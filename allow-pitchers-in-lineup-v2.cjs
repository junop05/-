#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-lineup-v2.cjs <src/App.jsx>');
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

const replacements = [
  {
    name: 'exact batting optgroup block',
    re: /<optgroup\s+label="선수">[\s\S]*?key=\{`batter-opt-\$\{b\.id\}`\}[\s\S]*?<\/optgroup>/m,
    to: `<optgroup label="선수">\n  {players.map(p => (\n    <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n      {p.name} No.{p.uniformNumber}\n    </option>\n  ))}\n</optgroup>`
  },
  {
    name: 'batting filter chain with batter-opt key',
    re: /players\s*\.\s*filter\([\s\S]*?primaryRole[\s\S]*?\)\s*\.\s*map\(\s*b\s*=>\s*\([\s\S]*?key=\{`batter-opt-\$\{b\.id\}`\}[\s\S]*?\)\s*\)/m,
    to: `players.map(p => (\n    <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n      {p.name} No.{p.uniformNumber}\n    </option>\n  ))`
  },
  {
    name: 'single-line batting filter chain',
    re: /players\s*\.\s*filter\([\s\S]*?primaryRole[\s\S]*?\)\s*\.\s*map\(\s*b\s*=>\s*<option[\s\S]*?batter-opt-[\s\S]*?<\/option>\s*\)/m,
    to: `players.map(p => <option key={\`lineup-opt-\${p.id}\`} value={p.id}>{p.name} No.{p.uniformNumber}</option>)`
  }
];

for (const rule of replacements) {
  if (rule.re.test(text)) {
    text = text.replace(rule.re, rule.to);
    replaced = true;
    console.log(`Applied rule: ${rule.name}`);
    break;
  }
}

if (!replaced) {
  const idx = text.indexOf('batter-opt-');
  if (idx !== -1) {
    const start = Math.max(0, idx - 600);
    const end = Math.min(text.length, idx + 800);
    console.error('Found batter-opt- but could not safely patch this format. Nearby code:\n');
    console.error(text.slice(start, end));
    process.exit(2);
  }
  console.error('Could not find the lineup batter option block. Search in src/App.jsx for: batter-opt-');
  process.exit(2);
}

if (text === original) {
  console.error('Matched but no change was applied.');
  process.exit(3);
}

const backup = `${filePath}.bak_${Date.now()}`;
fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(filePath, text, 'utf8');
console.log(`Backup created: ${backup}`);
console.log(`Patched: ${filePath}`);
