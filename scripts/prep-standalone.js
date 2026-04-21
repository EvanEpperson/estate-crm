/**
 * Copies .next/static and public into the standalone output
 * so the server can serve them. Run after `next build`.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log("Copying .next/static → standalone/.next/static");
copyDir(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
);

console.log("Copying public → standalone/public");
copyDir(path.join(root, "public"), path.join(standalone, "public"));

console.log("Standalone prep done.");
