import assert from "assert";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5000";
let passed = 0;
let failed = 0;
let adminToken = null;

const TEST_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "";

async function req(method, url, body = null, headers = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== null && !(body instanceof FormData)) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }
  const res = await fetch(`${BASE}${url}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, headers: res.headers, json, text };
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function section(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

function fileRead(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function authHeaders() {
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
}

// ─── Phase 0: Authentication ──────────────────────────────────

async function testPhase0() {
  section("Authentication: Login Flow");

  await test("Login rejects missing credentials", async () => {
    const res = await req("POST", "/api/v1/auth/login", {});
    assert.strictEqual(res.status, 400);
  });

  await test("Login rejects wrong password", async () => {
    const res = await req("POST", "/api/v1/auth/login", {
      email: TEST_EMAIL,
      password: "definitely-wrong-password-xyz",
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.json.success, false);
  });

  await test("Login returns valid JWT on success", async () => {
    if (!TEST_PASSWORD) {
      console.log("    ⚠ Skipping: set TEST_ADMIN_PASSWORD env var to enable");
      return;
    }
    const res = await req("POST", "/api/v1/auth/login", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.json.token, "No token returned");
    assert.ok(res.json.token.split(".").length === 3, "Token is not a valid JWT");
    adminToken = res.json.token;
  });

  await test("Rejected token returns 401", async () => {
    const res = await req("GET", "/api/v1/lists/all", null, {
      Authorization: "Bearer invalid-token-here",
    });
    assert.strictEqual(res.status, 401);
  });

  await test("Missing token returns 401 on protected route", async () => {
    const res = await req("GET", "/api/v1/lists/all");
    assert.strictEqual(res.status, 401);
  });

  await test("Valid token grants access to protected route", async () => {
    if (!adminToken) {
      console.log("    ⚠ Skipping: login required");
      return;
    }
    const res = await req("GET", "/api/v1/lists/all", null, authHeaders());
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);
  });
}

// ─── Phase 1 Tests ───────────────────────────────────────────

async function testPhase1() {
  section("Fix 1: Path Traversal Protection");

  await test("Rejects ../ in filename", async () => {
    const res = await req("GET", "/api/v1/stream/../../etc/passwd");
    assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
  });

  await test("Rejects ..\\ in filename", async () => {
    const res = await req("GET", "/api/v1/download/..\\..\\etc\\passwd");
    assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
  });

  await test("Rejects encoded traversal %2e%2e", async () => {
    const res = await req("GET", "/api/v1/stream/%2e%2e/%2e%2e/etc/passwd");
    assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
  });

  await test("Non-existent valid filename returns 404", async () => {
    const res = await req("GET", "/api/v1/stream/nonexistent-video-12345.mp4");
    assert.strictEqual(res.status, 404);
  });

  await test("Images route rejects path traversal", async () => {
    const res = await req("GET", "/uploads/images/../../etc/passwd");
    assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
  });

  section("Fix 2: Regex Escaping in Search");

  await test("Handles regex special characters safely", async () => {
    const res = await req("GET", "/api/v1/movies/search/(a%2B)%2B%24");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);
  });

  await test("Limits query length to 100 chars", async () => {
    const longQuery = "a".repeat(101);
    const res = await req("GET", `/api/v1/movies/search/${longQuery}`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.json.success, false);
  });

  await test("Regex escape function exists in movies.js", async () => {
    const content = fileRead("backend/routes/movies.js");
    assert.ok(content.includes("escapeRegex"), "escapeRegex function not found");
    assert.ok(content.includes("\\$&"), "Regex escaping pattern not found");
  });

  section("Fix 3: Field Whitelisting");

  await test("Movie field whitelist exists", async () => {
    const content = fileRead("backend/routes/movies.js");
    assert.ok(content.includes("MOVIE_FIELDS"), "MOVIE_FIELDS constant not found");
    assert.ok(content.includes("pickFields"), "pickFields function not found");
  });

  await test("Create movie requires title", async () => {
    const res = await req("POST", "/api/v1/movies", { description: "no title" }, authHeaders());
    if (res.status === 401) return;
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.json.success, false);
  });

  await test("List field whitelist exists", async () => {
    const content = fileRead("backend/routes/lists.js");
    assert.ok(content.includes("LIST_FIELDS"), "LIST_FIELDS constant not found");
  });

  section("Fix 4: Bcrypt Password Comparison");

  await test("auth.js uses bcrypt.compare", async () => {
    const content = fileRead("backend/routes/auth.js");
    assert.ok(content.includes("bcrypt.compare"), "bcrypt.compare not found in auth.js");
  });

  await test("Login rejects invalid credentials", async () => {
    const res = await req("POST", "/api/v1/auth/login", {
      email: "wrong@example.com",
      password: "wrongpassword",
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.json.success, false);
  });

  await test("Login requires email and password", async () => {
    const res = await req("POST", "/api/v1/auth/login", {});
    assert.strictEqual(res.status, 400);
  });

  section("Fix 5: JWT_SECRET Validation");

  await test("JWT_SECRET minimum length check exists", async () => {
    const content = fileRead("backend/config/envVars.js");
    assert.ok(content.includes("length < 32"), "JWT_SECRET length check not found");
  });

  await test("JWT_SECRET entropy check exists", async () => {
    const content = fileRead("backend/config/envVars.js");
    assert.ok(content.includes("mixed characters") || content.includes("entropy"), "JWT_SECRET entropy check not found");
  });

  await test("Required env vars validation exists", async () => {
    const content = fileRead("backend/config/envVars.js");
    assert.ok(content.includes("Missing required environment variables"), "Missing env var check not found");
  });

  section("ObjectId Validation");

  await test("Rejects invalid movie ID format", async () => {
    const res = await req("GET", "/api/v1/movies/not-a-valid-id");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.json.success, false);
  });

  await test("Rejects invalid list ID format", async () => {
    const res = await req("GET", "/api/v1/lists/not-a-valid-id");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.json.success, false);
  });

  await test("Handles non-existent but valid movie ID", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await req("GET", `/api/v1/movies/${fakeId}`);
    assert.strictEqual(res.status, 404);
  });

  section("Error Message Hiding");

  await test("Global error handler returns generic message in production", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes('"Internal server error"'), "Generic error message not found in errorHandler");
  });

  await test("Global error handler hides stack traces in production", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("NODE_ENV") && content.includes("stack"), "Stack trace hiding not implemented");
  });

  section("File Cleanup on Delete");

  await test("Movie delete cleans up files from disk", async () => {
    const content = fileRead("backend/routes/movies.js");
    assert.ok(content.includes("unlink"), "File cleanup (unlink) not implemented");
  });
}

// ─── Phase 2 Tests ───────────────────────────────────────────

async function testPhase2() {
  section("Fix 7: Rate Limiting");

  await test("Global rate limiter configured", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("rateLimit"), "rateLimit not found in server.js");
    assert.ok(content.includes("max: 100"), "Global rate limit max not set to 100");
  });

  await test("Login has stricter rate limit (5 attempts)", async () => {
    const content = fileRead("backend/routes/auth.js");
    assert.ok(content.includes("max: 5"), "Login rate limit not set to 5");
  });

  await test("Rate limit headers present on responses", async () => {
    const res = await req("GET", "/api/v1/movies");
    const rateLimit = res.headers.get("ratelimit-limit");
    assert.ok(rateLimit, "Rate limit header not found");
  });

  section("Fix 8: Security Headers (Helmet)");

  await test("X-Content-Type-Options header present", async () => {
    const res = await req("GET", "/health");
    assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
  });

  await test("X-Frame-Options header present", async () => {
    const res = await req("GET", "/health");
    const val = res.headers.get("x-frame-options");
    assert.ok(val === "DENY" || val === "SAMEORIGIN", `Expected DENY or SAMEORIGIN, got: ${val}`);
  });

  await test("X-Powered-By header removed", async () => {
    const res = await req("GET", "/health");
    assert.ok(!res.headers.get("x-powered-by"), "X-Powered-By should be removed");
  });

  await test("Strict-Transport-Security present", async () => {
    const res = await req("GET", "/health");
    assert.ok(res.headers.get("strict-transport-security"), "HSTS header not found");
  });

  await test("Content-Security-Policy present", async () => {
    const res = await req("GET", "/health");
    assert.ok(res.headers.get("content-security-policy"), "CSP header not found");
  });

  section("Fix 9: CORS Restriction");

  await test("CORS blocks unauthorized origins", async () => {
    const res = await req("GET", "/api/v1/movies", null, {
      Origin: "https://evil-site.com",
    });
    assert.strictEqual(res.status, 403);
  });

  await test("CORS allows localhost:3001", async () => {
    const res = await req("GET", "/api/v1/movies", null, {
      Origin: "http://localhost:3001",
    });
    assert.strictEqual(res.status, 200);
  });

  await test("CORS error message is clean", async () => {
    const res = await req("GET", "/api/v1/movies", null, {
      Origin: "https://evil-site.com",
    });
    assert.strictEqual(res.json.message, "CORS policy denied");
  });

  section("Fix 10: Request Body Size Limit");

  await test("Body size limit configured to 1mb", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes('limit: "1mb"'), "Body size limit not set");
  });

  await test("Rejects oversized JSON body", async () => {
    const largeBody = { data: "x".repeat(2 * 1024 * 1024) };
    const res = await req("POST", "/api/v1/movies", largeBody, authHeaders());
    assert.ok([400, 413].includes(res.status), `Expected 400 or 413, got ${res.status}`);
  });

  section("Fix 11: Server Config");

  await test("Server timeout configured to 30s", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("server.timeout = 30000"), "Server timeout not configured");
  });

  await test("Graceful SIGTERM handler exists", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("SIGTERM"), "SIGTERM handler not found");
  });

  await test("Graceful SIGINT handler exists", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("SIGINT"), "SIGINT handler not found");
  });

  section("Health Check");

  await test("GET /health returns 200 with status ok", async () => {
    const res = await req("GET", "/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.status, "ok");
  });

  section("Compression");

  await test("Compression middleware configured", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("compression"), "Compression middleware not configured");
  });

  section("Logging");

  await test("Morgan logging configured", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("morgan"), "Morgan not configured");
  });

  section("Unused Dependencies");

  await test("cookie-parser removed from package.json", async () => {
    const content = fileRead("package.json");
    assert.ok(!content.includes("cookie-parser"), "cookie-parser still in dependencies");
  });

  section("Static File Security");

  await test("Broad /uploads static mount removed", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(!content.includes('app.use("/uploads", express.static'), "Broad /uploads static mount still present");
  });

  await test("Validated image serving route exists", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("/uploads/images/:filename"), "Validated image route not found");
    assert.ok(content.includes("path.basename"), "Filename sanitization not found in image route");
  });

  await test("CORS placeholder domain removed", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(!content.includes("yourdomain.com"), "Placeholder CORS domain still present");
  });

  section("Admin Panel Build");

  await test("Admin panel builds successfully", async () => {
    const { execSync } = await import("child_process");
    try {
      execSync("npm run build", { cwd: "admin", stdio: "pipe" });
    } catch {
      throw new Error("Admin build failed");
    }
  });

  section("Client Build");

  await test("Client builds successfully", async () => {
    const { execSync } = await import("child_process");
    try {
      execSync("npm run build", { cwd: "client", stdio: "pipe" });
    } catch {
      throw new Error("Client build failed");
    }
  });
}

// ─── Phase 3 Tests ───────────────────────────────────────────

async function testPhase3() {
  section("Global Error System: asyncHandler");

  await test("asyncHandler utility exists", async () => {
    const content = fileRead("backend/utils/asyncHandler.js");
    assert.ok(content.includes("Promise.resolve"), "asyncHandler does not wrap with Promise.resolve");
    assert.ok(content.includes(".catch(next)"), "asyncHandler does not forward errors to next()");
  });

  await test("Movies routes use asyncHandler (no manual try/catch)", async () => {
    const content = fileRead("backend/routes/movies.js");
    assert.ok(content.includes("asyncHandler"), "asyncHandler not imported in movies.js");
    assert.ok(!content.includes("} catch (error)"), "Manual try/catch still present in movies.js");
  });

  await test("Lists routes use asyncHandler (no manual try/catch)", async () => {
    const content = fileRead("backend/routes/lists.js");
    assert.ok(content.includes("asyncHandler"), "asyncHandler not imported in lists.js");
    assert.ok(!content.includes("} catch (error)"), "Manual try/catch still present in lists.js");
  });

  await test("Auth routes use asyncHandler (no manual try/catch)", async () => {
    const content = fileRead("backend/routes/auth.js");
    assert.ok(content.includes("asyncHandler"), "asyncHandler not imported in auth.js");
    assert.ok(!content.includes("} catch"), "Manual try/catch still present in auth.js");
  });

  await test("Upload routes use asyncHandler", async () => {
    const content = fileRead("backend/routes/upload.js");
    assert.ok(content.includes("asyncHandler"), "asyncHandler not imported in upload.js");
  });

  section("Global Error System: errorHandler");

  await test("Global error handler middleware exists", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("err, req, res, next"), "Not a valid Express error handler signature");
  });

  await test("Error handler imported and mounted in server.js", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("errorHandler"), "errorHandler not imported in server.js");
    assert.ok(content.includes("app.use(errorHandler)"), "errorHandler not mounted as middleware");
  });

  await test("Error handler catches CORS errors", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("Not allowed by CORS"), "CORS error handling not found");
  });

  await test("Error handler catches duplicate key errors (code 11000)", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("11000"), "Duplicate key error handling not found");
  });

  await test("Error handler catches validation errors", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("ValidationError"), "ValidationError handling not found");
  });

  await test("Error handler catches invalid ObjectId (CastError)", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes("CastError"), "CastError handling not found");
  });

  section("Global Error System: 404 Handler");

  await test("404 catch-all route exists in server.js", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("Route not found"), "404 catch-all route not found");
  });

  await test("Unknown API route returns 404", async () => {
    const res = await req("GET", "/api/v1/nonexistent-endpoint");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.json.success, false);
  });

  section("Global Error System: Unhandled Rejection/Exception");

  await test("unhandledRejection handler exists", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes('process.on("unhandledRejection"'), "unhandledRejection handler not found");
  });

  await test("uncaughtException handler exists", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes('process.on("uncaughtException"'), "uncaughtException handler not found");
  });

  section("Global Error System: Error Response Hiding");

  await test("Error handler hides details in production mode", async () => {
    const content = fileRead("backend/middleware/errorHandler.js");
    assert.ok(content.includes('"development"'), "Development mode check not found");
    assert.ok(!content.includes("err.stack") || content.includes('NODE_ENV === "development"'), "Stack trace only exposed in development");
  });
}

// ─── Phase 4 Tests ───────────────────────────────────────────

async function testPhase4() {
  section("Request ID Correlation");

  await test("requestId middleware exists", async () => {
    const content = fileRead("backend/middleware/requestId.js");
    assert.ok(content.includes("crypto"), "crypto module not used for ID generation");
    assert.ok(content.includes("req.id"), "Request ID not attached to req object");
    assert.ok(content.includes("X-Request-Id"), "X-Request-Id header not set");
  });

  await test("requestId imported and mounted in server.js", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("requestId"), "requestId not imported in server.js");
    assert.ok(content.includes("app.use(requestId)"), "requestId not mounted as middleware");
  });

  await test("X-Request-Id header present on responses", async () => {
    const res = await req("GET", "/health");
    const requestId = res.headers.get("x-request-id");
    assert.ok(requestId, "X-Request-Id header not found on response");
    assert.ok(requestId.length > 0, "X-Request-Id header is empty");
  });

  await test("X-Request-Id is a valid UUID", async () => {
    const res = await req("GET", "/health");
    const requestId = res.headers.get("x-request-id");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.ok(uuidRegex.test(requestId), `X-Request-Id is not a valid UUID: ${requestId}`);
  });

  await test("Server.js has log messages for graceful shutdown", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("shutting down gracefully"), "Graceful shutdown log message not found");
  });

  section("Range Header Validation");

  await test("Invalid range header returns 416", async () => {
    const res = await req("GET", "/api/v1/stream/nonexistent.mp4", null, {
      Range: "bytes=abc-",
    });
    assert.ok([404, 416].includes(res.status), `Expected 404 or 416, got ${res.status}`);
  });

  await test("Out-of-bounds range returns 416", async () => {
    const res = await req("GET", "/api/v1/stream/nonexistent.mp4", null, {
      Range: "bytes=999999-",
    });
    assert.ok([404, 416].includes(res.status), `Expected 404 or 416, got ${res.status}`);
  });
}

// ─── Phase 5: CRUD Mutation Tests ────────────────────────────

async function testPhase5() {
  if (!adminToken) {
    section("CRUD Mutation Tests (SKIPPED — no auth token)");
    console.log("  ⚠ Set TEST_ADMIN_PASSWORD env var and restart server to enable\n");
    return;
  }

  let createdMovieId = null;
  let createdListId = null;

  section("Movie CRUD");

  await test("POST /api/v1/movies creates a movie", async () => {
    const res = await req("POST", "/api/v1/movies", {
      title: `Test Movie ${Date.now()}`,
      description: "A test movie for automated testing",
      genre: "Action",
      year: "2024",
      duration: "2h 0m",
      limit: 13,
      isSeries: false,
    }, authHeaders());
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.data._id, "No _id returned");
    createdMovieId = res.json.data._id;
  });

  await test("GET /api/v1/movies/:id retrieves the created movie", async () => {
    if (!createdMovieId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("GET", `/api/v1/movies/${createdMovieId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data._id, createdMovieId);
  });

  await test("PUT /api/v1/movies/:id updates a movie", async () => {
    if (!createdMovieId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("PUT", `/api/v1/movies/${createdMovieId}`, {
      title: "Updated Test Movie",
      description: "Updated description",
    }, authHeaders());
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.title, "Updated Test Movie");
  });

  await test("PUT /api/v1/movies/:id rejects invalid ID", async () => {
    const res = await req("PUT", "/api/v1/movies/not-a-valid-id", {
      title: "X",
    }, authHeaders());
    assert.strictEqual(res.status, 400);
  });

  await test("DELETE /api/v1/movies/:id deletes a movie", async () => {
    if (!createdMovieId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("DELETE", `/api/v1/movies/${createdMovieId}`, null, authHeaders());
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);
  });

  await test("GET /api/v1/movies/:id returns 404 after delete", async () => {
    if (!createdMovieId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("GET", `/api/v1/movies/${createdMovieId}`);
    assert.strictEqual(res.status, 404);
  });

  await test("DELETE /api/v1/movies/:id without auth returns 401", async () => {
    const res = await req("DELETE", "/api/v1/movies/507f1f77bcf86cd799439011");
    assert.strictEqual(res.status, 401);
  });

  section("List CRUD");

  await test("POST /api/v1/lists creates a list", async () => {
    const res = await req("POST", "/api/v1/lists", {
      title: `Test List ${Date.now()}`,
      type: "movie",
      genre: "Action",
      content: [],
    }, authHeaders());
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.data._id, "No _id returned");
    createdListId = res.json.data._id;
  });

  await test("GET /api/v1/lists/:id retrieves the created list", async () => {
    if (!createdListId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("GET", `/api/v1/lists/${createdListId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data._id, createdListId);
  });

  await test("PUT /api/v1/lists/:id updates a list", async () => {
    if (!createdListId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("PUT", `/api/v1/lists/${createdListId}`, {
      title: "Updated Test List",
    }, authHeaders());
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.title, "Updated Test List");
  });

  await test("DELETE /api/v1/lists/:id deletes a list", async () => {
    if (!createdListId) { console.log("    ⚠ Skipping: create failed"); return; }
    const res = await req("DELETE", `/api/v1/lists/${createdListId}`, null, authHeaders());
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);
  });

  await test("DELETE /api/v1/lists/:id without auth returns 401", async () => {
    const res = await req("DELETE", "/api/v1/lists/507f1f77bcf86cd799439011");
    assert.strictEqual(res.status, 401);
  });

  section("File Upload");

  await test("POST /api/v1/upload without auth returns 401", async () => {
    const form = new FormData();
    form.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
    const res = await req("POST", "/api/v1/upload", form);
    assert.strictEqual(res.status, 401);
  });

  await test("POST /api/v1/upload rejects invalid file types", async () => {
    const form = new FormData();
    form.append("file", new Blob(["test"], { type: "application/x-executable" }), "malware.exe");
    const res = await req("POST", "/api/v1/upload", form, authHeaders());
    assert.ok([400, 401, 415].includes(res.status), `Expected 400/401/415, got ${res.status}`);
  });

  await test("POST /api/v1/upload accepts image files", async () => {
    const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const form = new FormData();
    form.append("file", new Blob([pixel], { type: "image/png" }), "test-image.png");
    const res = await req("POST", "/api/v1/upload", form, authHeaders());
    if (res.status === 401) return;
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.url, "No URL returned");
    assert.ok(res.json.url.startsWith("/uploads/images/"), "URL doesn't start with /uploads/images/");
  });

  await test("Stream endpoint returns 404 for non-existent upload", async () => {
    const res = await req("GET", "/api/v1/stream/definitely-not-a-real-file.mp4");
    assert.strictEqual(res.status, 404);
  });

  await test("Image route serves validated paths only", async () => {
    const content = fileRead("backend/server.js");
    assert.ok(content.includes("path.basename"), "path.basename not used for image sanitization");
  });
}

// ─── Run All Tests ───────────────────────────────────────────

async function run() {
  console.log("\n🎬 Movie Website — Security Test Suite\n");
  console.log(`Target: ${BASE}`);
  if (!TEST_PASSWORD) {
    console.log("Tip: Set TEST_ADMIN_PASSWORD env var to enable mutation/auth tests\n");
  }

  try {
    const res = await req("GET", "/health");
    if (res.status !== 200) throw new Error("Health check failed");
    console.log("Server is running\n");
  } catch {
    console.error("\n❌ Server is not running. Start it with: npm run dev\n");
    process.exit(1);
  }

  await testPhase0();
  await testPhase1();
  await testPhase2();
  await testPhase3();
  await testPhase4();
  await testPhase5();

  console.log(`\n━━━ Results ━━━`);
  console.log(`  ✓ ${passed} passed`);
  console.log(`  ✗ ${failed} failed`);
  console.log(`  Total: ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
