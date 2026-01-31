// migrate-attendance.js
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
try {
  const envContent = fs.readFileSync(
    path.join(__dirname, ".env.local"),
    "utf8",
  );
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
    }
  });
} catch (e) {
  console.error("Could not read .env.local");
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log("Adding 'acara' to 'attendance'...");
    await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS acara TEXT DEFAULT ''`;
    console.log("Ensuring 'invitations' is clean...");
    await sql`ALTER TABLE invitations DROP COLUMN IF EXISTS acara`;
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration error:", error.message);
  } finally {
    process.exit();
  }
}

migrate();
