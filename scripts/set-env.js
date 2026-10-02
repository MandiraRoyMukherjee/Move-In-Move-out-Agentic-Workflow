/**
 * Writes DATABASE_URL to .env (replaces existing line or appends).
 * Run: node scripts/set-env.js
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const url =
  "postgresql://neondb_owner:npg_wm4HfWudFBp5@ep-square-mouse-b59d25vc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

if (/^DATABASE_URL=/m.test(contents)) {
  contents = contents.replace(/^DATABASE_URL=.*/m, `DATABASE_URL="${url}"`);
} else {
  contents += `\nDATABASE_URL="${url}"\n`;
}

fs.writeFileSync(envPath, contents, "utf8");
console.log("✅ DATABASE_URL written to .env");
console.log("   " + url.replace(/:([^@]+)@/, ":***@"));
