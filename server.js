/**
 * Serveur de production Bio Analysis
 *
 * - Sert les fichiers statiques du dossier build/
 * - Proxy /v1/* → LM Studio (localhost:1234 par défaut)
 *   → permet au téléphone d'utiliser l'IA sans problème CORS
 * - HTTPS automatique si certs/cert.pem + certs/key.pem existent
 *   (générer avec : npm run gen-cert)
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
const os = require("os");
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

// ─── Détection des certs HTTPS ────────────────────────────────────────────────

const CERTS_DIR = path.join(__dirname, "certs");
const CERT_PATH = path.join(CERTS_DIR, "cert.pem");
const KEY_PATH = path.join(CERTS_DIR, "key.pem");
const CA_PATH = path.join(CERTS_DIR, "ca.crt");

const hasHttps = fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);

// ─── IP locale ────────────────────────────────────────────────────────────────

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "VOTRE-IP";
}

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

// ─── Handler HTTP ────────────────────────────────────────────────────────────

function requestHandler(req, res) {
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

  // Téléchargement du certificat CA pour installation sur téléphone
  if (parsedUrl.pathname === "/ca.crt") {
    if (!fs.existsSync(CA_PATH)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Certificat non trouvé. Lancez : npm run gen-cert");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/x-x509-ca-cert",
      "Content-Disposition": 'attachment; filename="bio-analysis-ca.crt"',
    });
    fs.createReadStream(CA_PATH).pipe(res);
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
}

// ─── Démarrage du serveur ─────────────────────────────────────────────────────

let server;
if (hasHttps) {
  server = https.createServer(
    {
      cert: fs.readFileSync(CERT_PATH),
      key: fs.readFileSync(KEY_PATH),
    },
    requestHandler,
  );
} else {
  server = http.createServer(requestHandler);
}

server.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIp();
  const protocol = hasHttps ? "https" : "http";

  console.log("\n✅  Bio Analysis — serveur de production démarré");
  console.log(`   Local   : ${protocol}://localhost:${PORT}`);
  console.log(
    `   Réseau  : ${protocol}://${localIp}:${PORT}  ← URL à utiliser sur le téléphone`,
  );
  console.log(`   Proxy   : /v1/* → ${LM_STUDIO_URL}`);

  if (hasHttps) {
    console.log(`\n🔒  Mode HTTPS actif`);
    console.log(`\n📱  Sur votre téléphone (première fois) :`);
    console.log(
      `   1. Ouvrez http://${localIp}:${PORT}/ca.crt  (HTTP pour télécharger le cert)`,
    );
    console.log('   2. Installez le certificat → "Certificat CA"');
    console.log(`   3. Puis ouvrez https://${localIp}:${PORT}`);
  } else {
    console.log(`\n⚠️   HTTP seulement (pas de HTTPS)`);
    console.log(
      `   → Pour activer HTTPS (requis pour l'icône PWA) : npm run gen-cert`,
    );
    console.log(`\n📱  Sur votre téléphone :`);
    console.log(
      `   Ouvrez http://${localIp}:${PORT} dans Chrome (pas l'icône installée)`,
    );
  }
  console.log("");
});
