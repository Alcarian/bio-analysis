/**
 * Serveur de production Bio Analysis
 *
 * - Sert les fichiers statiques du dossier build/
 * - Proxy /v1/* → LM Studio (localhost:1234 par défaut)
 *   → permet au téléphone d'utiliser l'IA sans problème CORS
 *
 * Usage :
 *   node server.js
 *   PORT=8080 node server.js
 *   LM_STUDIO_URL=http://localhost:1234 node server.js
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = parseInt(process.env.PORT || "3000", 10);
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://localhost:1234";
const BUILD_DIR = path.join(__dirname, "build");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// ─── Proxy vers LM Studio ─────────────────────────────────────────────────────

function proxyToLMStudio(req, res) {
  let lmUrl;
  try {
    lmUrl = new URL(LM_STUDIO_URL);
  } catch {
    res.writeHead(500);
    res.end(
      JSON.stringify({ error: "LM_STUDIO_URL invalide : " + LM_STUDIO_URL }),
    );
    return;
  }

  const options = {
    hostname: lmUrl.hostname,
    port: parseInt(
      lmUrl.port || (lmUrl.protocol === "https:" ? "443" : "80"),
      10,
    ),
    path: req.url, // conserve /v1/models, /v1/chat/completions, etc.
    method: req.method,
    headers: {
      ...req.headers,
      host: lmUrl.host,
      // On retire les en-têtes liés à la connexion entrante
      "x-forwarded-for": undefined,
    },
  };

  const protocol = lmUrl.protocol === "https:" ? https : http;
  const proxyReq = protocol.request(options, (proxyRes) => {
    const headers = {
      ...proxyRes.headers,
      // Autoriser tous les origines côté proxy (le téléphone sur le réseau local)
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
    };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "LM Studio inaccessible : " + err.message,
        hint: "Vérifiez que LM Studio est lancé et que le serveur est démarré (onglet Developer).",
      }),
    );
  });

  req.pipe(proxyReq, { end: true });
}

// ─── Serveur principal ────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  } catch {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Proxy toutes les requêtes /v1/* vers LM Studio
  if (parsedUrl.pathname.startsWith("/v1/")) {
    proxyToLMStudio(req, res);
    return;
  }

  // Web Share Target : redirige vers l'app (le SW gère le POST réel)
  if (req.method === "POST" && parsedUrl.pathname === "/share-pdf") {
    res.writeHead(303, { Location: "/?shared=1" });
    res.end();
    return;
  }

  // ── Fichiers statiques ────────────────────────────────────────────────────
  let filePath = path.join(BUILD_DIR, parsedUrl.pathname);

  // Sécurité : empêcher la sortie du dossier build (path traversal)
  if (!filePath.startsWith(BUILD_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // SPA fallback : si le fichier n'existe pas → index.html
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    stat = null;
  }

  if (!stat || stat.isDirectory()) {
    filePath = path.join(BUILD_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const headers = { "Content-Type": contentType };
    // Cache long pour les assets hashés, pas de cache pour index.html
    if (ext !== ".html") {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache";
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  // Récupérer l'IP locale pour l'afficher
  let localIp = "VOTRE-IP";
  try {
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          localIp = net.address;
          break;
        }
      }
      if (localIp !== "VOTRE-IP") break;
    }
  } catch {}

  console.log("\n✅  Bio Analysis — serveur de production démarré");
  console.log(`   Local   : http://localhost:${PORT}`);
  console.log(
    `   Réseau  : http://${localIp}:${PORT}  ← URL à utiliser sur le téléphone`,
  );
  console.log(`   Proxy   : /v1/* → ${LM_STUDIO_URL}`);
  console.log(`\n📱  Sur votre téléphone :`);
  console.log(`   1. Ouvrez http://${localIp}:${PORT}`);
  console.log(
    `   2. Dans Paramètres IA, mettez l'URL : http://${localIp}:${PORT}`,
  );
  console.log(`      (l'app se charge elle-même de contacter LM Studio)\n`);
});
