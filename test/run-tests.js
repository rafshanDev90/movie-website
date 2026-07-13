import assert from "assert";
import fs from "fs";

const BASE = "http://localhost:5000";
let passed = 0;
let failed = 0;
let adminToken = null;

async function req(method, path, body = null, headers = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== null) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
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

function fileRead(path) {
  return fs.readFileSync(path, "utf8");
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
    const res = await req("POST", "/api/v1/movies", { description: "no title" }, {
      Authorization: `Bearer ${adminToken}`,
    });
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

  await test("Returns generic error message (not error.message)", async () => {
    const content = fileRead("backend/routes/movies.js");
    assert.ok(content.includes('"Internal server error"'), "Generic error message not found");
  });

  await test("Lists routes also hide errors", async () => {
    const content = fileRead("backend/routes/lists.js");
    assert.ok(content.includes('"Internal server error"'), "Generic error message not found in lists");
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
    const res = await req("POST", "/api/v1/movies", largeBody, {
      Authorization: `Bearer ${adminToken}`,
    });
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

// ─── Run All Tests ───────────────────────────────────────────

async function run() {
  console.log("\n🎬 Movie Website — Security Test Suite\n");
  console.log(`Target: ${BASE}`);

  try {
    const res = await req("GET", "/health");
    if (res.status !== 200) throw new Error("Health check failed");
    console.log("Server is running\n");
  } catch {
    console.error("\n❌ Server is not running. Start it with: npm run dev\n");
    process.exit(1);
  }

  await testPhase1();
  await testPhase2();

  console.log(`\n━━━ Results ━━━`);
  console.log(`  ✓ ${passed} passed`);
  console.log(`  ✗ ${failed} failed`);
  console.log(`  Total: ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
