/**
 * Packages the Electron app for Windows using @electron/packager.
 * No code signing, no winCodeSign, no symlink issues.
 */
const { packager } = require("@electron/packager");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");

(async () => {
  console.log("Packaging Estate CRM for Windows...");

  const appPaths = await packager({
    dir: root,
    name: "Estate CRM",
    platform: "win32",
    arch: "x64",
    out: path.join(root, "dist-electron"),
    overwrite: true,
    icon: path.join(root, "electron", "icon.ico"),
    ignore: [
      /^\/\.next(?!\/standalone)/,        // exclude .next except standalone
      /^\/dist-electron/,
      /^\/node_modules\/@electron/,
      /^\/node_modules\/electron-builder/,
      /^\/node_modules\/tailwindcss/,
      /^\/node_modules\/@tailwindcss/,
      /^\/node_modules\/typescript/,
      /^\/node_modules\/@types/,
      /^\/scripts/,
      /^\/app/,
      /^\/components/,
      /^\/lib/,
      /^\/data/,
      /^\/public/,
      /^\/\.git/,
      /^\/\.next\/cache/,
      /node_modules\/@electron\/packager/,
    ],
    extraResource: [
      path.join(root, ".next", "standalone"),
    ],
    appVersion: "1.0.0",
    win32metadata: {
      CompanyName: "Destiny Epperson Realty",
      FileDescription: "Estate CRM",
      OriginalFilename: "Estate CRM.exe",
      ProductName: "Estate CRM",
    },
  });

  console.log("Packaged to:", appPaths);

  // Copy .next/static and .env.local into the resources folder
  const outDir = appPaths[0];
  const resourcesDir = path.join(outDir, "resources");
  const nextjsDir = path.join(resourcesDir, "standalone");

  // Static files need to be inside standalone/.next/static
  copyDir(
    path.join(root, ".next", "static"),
    path.join(nextjsDir, ".next", "static")
  );

  // .env.local
  const envSrc = path.join(root, ".env.local");
  if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, path.join(nextjsDir, ".env.local"));
    console.log("Copied .env.local");
  }

  // public folder (if it exists)
  const pubSrc = path.join(root, "public");
  if (fs.existsSync(pubSrc)) {
    copyDir(pubSrc, path.join(nextjsDir, "public"));
    console.log("Copied public/");
  }

  console.log("\nDone! Your app is at:");
  console.log(" ", path.join(outDir, "Estate CRM.exe"));
  console.log("\nTo distribute: zip the entire folder:", outDir);
})();

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
