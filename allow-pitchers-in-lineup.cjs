#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-lineup.cjs <App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let text = fs.readFileSync(filePath, 'utf8');
const original = text;
let replaced = false;

const patterns = [
  {
    re: /players\s*\.\s*filter\(\s*p\s*=>\s*\['타자'\s*,\s*'투타'\]\s*\.\s*includes\(\s*p\.primaryRole\s*\)\s*\)\s*\.\s*map\(\s*b\s*=>\s*\(\s*<option\s+key=\{`batter-opt-\$\{b\.id\}`\}\s+value=\{b\.id\}>\s*\{b\.name\}\s*\(No\.\{b\.uniformNumber\}\)<\/option>\s*\)\s*\)/gms,
    to: "players.map(p => (<option key={`lineup-opt-${p.id}`} value={p.id}>{p.name} (No.{p.uniformNumber})</option>))"
  },
  {
    re: /players\s*\.\s*filter\(\s*p\s*=>\s*\['타자'\s*,\s*'투타'\]\s*\.\s*includes\(\s*p\.primaryRole\s*\)\s*\)\s*\.\s*map\(\s*b\s*=>\s*<option\s+key=\{`batter-opt-\$\{b\.id\}`\}\s+value=\{b\.id\}>\s*\{b\.name\}\s*\(No\.\{b\.uniformNumber\}\)<\/option>\s*\)/gms,
    to: "players.map(p => <option key={`lineup-opt-${p.id}`} value={p.id}>{p.name} (No.{p.uniformNumber})</option>)"
  },
  {
    re: /<optgroup\s+label="선수">\s*\{\s*players\s*\.\s*filter\(\s*p\s*=>\s*\['타자'\s*,\s*'투타'\]\s*\.\s*includes\(\s*p\.primaryRole\s*\)\s*\)\s*\.\s*map\([\s\S]*?<\/optgroup>/gm,
    to: `<optgroup label="선수">
  {players.map(p => (
    <option key={\`lineup-opt-\${p.id}\`} value={p.id}>
      {p.name} (No.{p.uniformNumber})
    </option>
  ))}
</optgroup>`
  }
];

for (const { re, to } of patterns) {
  if (re.test(text)) {
    text = text.replace(re, to);
    replaced = true;
    break;
  }
}

if (!replaced) {
  console.error('Could not find the lineup player filter block. Search for the lineup <optgroup label="선수"> block and replace the batting-only filter with players.map(...).');
  process.exit(2);
}

if (text === original) {
  console.error('Matched but no change was applied.');
  process.exit(3);
}

fs.writeFileSync(filePath, text, 'utf8');
console.log(`Patched: ${filePath}`);
