/**
 * Génère un certificat HTTPS auto-signé pour le réseau local.
 * Le certificat est stocké dans certs/ et valable 825 jours.
 *
 * Usage : node scripts/gen-cert.js
 *   ou  : npm run gen-cert
 */

const selfsigned = require("selfsigned");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Récupère l'IP locale ─────────────────────────────────────────────────────

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const localIp = getLocalIp();
console.log(`\n🔐  Génération du certificat HTTPS pour IP : ${localIp}\n`);

// ─── Génération ───────────────────────────────────────────────────────────────

const attrs = [{ name: "commonName", value: "Bio Analysis Local" }];

(async () => {
  const pems = await selfsigned.generate(attrs, {
    days: 825, // Maximum accepté par Chrome pour les certs auto-signés
    keySize: 2048,
    extensions: [
      { name: "basicConstraints", cA: true },
      {
        name: "keyUsage",
        keyCertSign: true,
        digitalSignature: true,
        keyEncipherment: true,
      },
      { name: "extKeyUsage", serverAuth: true },
      {
        name: "subjectAltName",
        altNames: [
          { type: 7, ip: localIp }, // IP du PC sur le réseau local
          { type: 7, ip: "127.0.0.1" },
          { type: 2, value: "localhost" },
        ],
      },
    ],
  });

  // ─── Sauvegarde ───────────────────────────────────────────────────────────────

  const certsDir = path.join(__dirname, "..", "certs");
  fs.mkdirSync(certsDir, { recursive: true });

  fs.writeFileSync(path.join(certsDir, "cert.pem"), pems.cert);
  fs.writeFileSync(path.join(certsDir, "key.pem"), pems.private);
  // ca.crt = même cert renommé → format reconnu par Android pour l'installation
  fs.writeFileSync(path.join(certsDir, "ca.crt"), pems.cert);

  // ─── Instructions ─────────────────────────────────────────────────────────────

  console.log("✅  Certificat généré dans certs/\n");
  console.log("Prochaines étapes :\n");
  console.log("  1. Démarrez le serveur :  npm run serve");
  console.log(
    `  2. Sur votre téléphone, ouvrez :  http://${localIp}:3000/ca.crt`,
  );
  console.log("  3. Android vous propose d'installer le certificat");
  console.log('     → Sélectionnez "Certificat CA" (ou "CA Certificate")');
  console.log("     → Acceptez l'avertissement de sécurité");
  console.log(`  4. Ouvrez ensuite : https://${localIp}:3000\n`);
  console.log(
    "⚠️   Si votre IP change (redémarrage box), relancez : npm run gen-cert\n",
  );
})();
