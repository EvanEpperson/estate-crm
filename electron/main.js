const { app, BrowserWindow, shell, Menu, dialog, net } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");

const PORT = 3000;
let nextServer = null;
let mainWindow = null;

// ─── Paths ──────────────────────────────────────────────────────────────────

const isPackaged = app.isPackaged;

// Root of the bundled Next.js app (inside Resources when packaged)
const appRoot = isPackaged
  ? path.join(process.resourcesPath, "standalone")
  : path.join(__dirname, "..");

// When packaged, appRoot IS the standalone dir (resources/standalone/)
// In dev, standalone lives at .next/standalone/
const standaloneDir = isPackaged
  ? appRoot
  : path.join(appRoot, ".next", "standalone");
const serverScript = path.join(standaloneDir, "server.js");

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(appRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    vars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

// ─── Wait for server ready ───────────────────────────────────────────────────

function waitForServer(url, retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", retry);
    };
    const retry = () => {
      if (++attempts >= retries) return reject(new Error("Server did not start"));
      setTimeout(check, delay);
    };
    check();
  });
}

// ─── Find Node.js binary ─────────────────────────────────────────────────────

function findNodeBin() {
  const { execSync } = require("child_process");

  // 1. Try resolving via PATH (works when launched from terminal)
  try {
    const found = execSync("where node", { encoding: "utf8", timeout: 3000 })
      .trim()
      .split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) return found;
  } catch (_) {}

  // 2. Check common Windows install locations
  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "nodejs", "node.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "nodejs", "node.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "nodejs", "node.exe"),
    process.env.APPDATA && path.join(process.env.APPDATA, "nvm", "current", "node.exe"),
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Program Files (x86)\\nodejs\\node.exe",
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // 3. Try nvm directory — find latest version
  const nvmHome = process.env.NVM_HOME || path.join(process.env.APPDATA || "", "nvm");
  if (fs.existsSync(nvmHome)) {
    try {
      const versions = fs.readdirSync(nvmHome)
        .filter((d) => d.startsWith("v"))
        .sort()
        .reverse();
      for (const v of versions) {
        const p = path.join(nvmHome, v, "node.exe");
        if (fs.existsSync(p)) return p;
      }
    } catch (_) {}
  }

  return null;
}

// ─── Start Next.js server ────────────────────────────────────────────────────

async function startNextServer(nodeBin) {
  console.log("[electron] Using Node:", nodeBin);

  const env = {
    ...process.env,
    ...loadEnv(),
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    CRM_DATA_DIR: isPackaged ? app.getPath("userData") : "",
  };

  nextServer = spawn(nodeBin, [serverScript], {
    cwd: standaloneDir, // server.js resolves modules relative to this dir
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextServer.stdout.on("data", (d) => console.log("[server]", d.toString().trim()));
  nextServer.stderr.on("data", (d) => console.error("[server]", d.toString().trim()));
  nextServer.on("exit", (code) => console.log("[server] exited", code));

  await waitForServer(`http://127.0.0.1:${PORT}`);
}

// ─── Browser window ──────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Estate CRM",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0f172a",
    show: false,
  });

  // Open external links in real browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  // Minimal menu
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "File",
        submenu: [
          {
            label: "Open data folder",
            click: () => shell.openPath(path.join(appRoot, "data")),
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }] },
    ])
  );
}

// ─── Auto-install Node.js ────────────────────────────────────────────────────

const NODE_LTS_VERSION = "22.15.0";
const NODE_INSTALLER_URL = `https://nodejs.org/dist/v${NODE_LTS_VERSION}/node-v${NODE_LTS_VERSION}-x64.msi`;

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (u) =>
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
    request(url);
  });
}

async function installNodeJs(splashWin) {
  const msiPath = path.join(os.tmpdir(), `node-v${NODE_LTS_VERSION}-x64.msi`);

  if (splashWin) splashWin.webContents.executeJavaScript(
    `document.getElementById('status').textContent = 'Downloading Node.js (30 MB)…'`
  ).catch(() => {});

  await downloadFile(NODE_INSTALLER_URL, msiPath);

  if (splashWin) splashWin.webContents.executeJavaScript(
    `document.getElementById('status').textContent = 'Installing Node.js… follow the installer prompts.'`
  ).catch(() => {});

  await new Promise((resolve, reject) => {
    const proc = spawn("msiexec", ["/i", msiPath, "/passive", "/norestart"], {
      stdio: "ignore",
      windowsHide: false,
    });
    proc.on("close", (code) => (code === 0 || code === 3010 ? resolve() : reject(new Error(`msiexec exit ${code}`))));
  });

  fs.unlink(msiPath, () => {});
}

// ─── Splash window ───────────────────────────────────────────────────────────

function createSplash() {
  const win = new BrowserWindow({
    width: 420, height: 220,
    frame: false, resizable: false, center: true,
    backgroundColor: "#1e1b4b",
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  win.loadURL(`data:text/html,<!DOCTYPE html><html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1e1b4b;color:white;font-family:system-ui">
    <div style="font-size:2.5rem;margin-bottom:12px">🏠</div>
    <div style="font-size:1.4rem;font-weight:700;margin-bottom:8px">Estate CRM</div>
    <div id="status" style="font-size:0.9rem;opacity:0.7">Starting server…</div>
  </body></html>`);
  return win;
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  const splash = createSplash();

  try {
    let nodeBin = findNodeBin();

    if (!nodeBin) {
      const { response } = await dialog.showMessageBox({
        type: "question",
        title: "Node.js required",
        message: "Node.js is not installed",
        detail: "Estate CRM needs Node.js to run. Install it automatically now? (~30 MB, takes ~1 minute)",
        buttons: ["Install automatically", "Cancel"],
        defaultId: 0,
      });

      if (response !== 0) { app.quit(); return; }

      await installNodeJs(splash);

      // Refresh PATH and try again
      nodeBin = findNodeBin();
      if (!nodeBin) {
        // Installer may need a relaunch to update PATH
        await dialog.showMessageBox({
          type: "info",
          title: "Restart required",
          message: "Node.js installed! Please relaunch Estate CRM.",
          buttons: ["OK"],
        });
        app.quit();
        return;
      }
    }

    await startNextServer(nodeBin);
    splash.close();
    createWindow();
  } catch (err) {
    splash.close();
    dialog.showErrorBox("Failed to start Estate CRM", err.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
  app.quit();
});
