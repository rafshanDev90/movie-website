import dotenv from "dotenv";
dotenv.config();

function validateEnv() {
  const required = ["MONGO_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD_HASH"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters long");
    process.exit(1);
  }

  if (/^[a-zA-Z0-9]+$/.test(process.env.JWT_SECRET)) {
    console.error("JWT_SECRET must contain mixed characters (letters, numbers, symbols). Generate one with: openssl rand -base64 48");
    process.exit(1);
  }
}

validateEnv();

export const ENV_VARS = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  NODE_ENV: process.env.NODE_ENV || "development",
  ADMIN_CORS_ORIGIN: process.env.ADMIN_CORS_ORIGIN || "",
  CLIENT_CORS_ORIGIN: process.env.CLIENT_CORS_ORIGIN || "",
};
