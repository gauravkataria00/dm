const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);
const idx = lines.findIndex((l) => l.includes('app.use("/api/milk", milkRoutes)'));
if (idx === -1) {
  console.error('Could not find milk route registration line.');
  process.exit(1);
}

const insert = [
  '',
  'app.get("/ping", (req, res) => {',
  '  res.send("pong");',
  '});',
  '',
];

const newLines = [...lines.slice(0, idx + 1), ...insert, ...lines.slice(idx + 1)];
fs.writeFileSync(file, newLines.join('\n') + '\n', 'utf8');
console.log('Inserted /ping route into server.js');
