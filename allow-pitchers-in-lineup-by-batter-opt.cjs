#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-lineup-by-batter-opt.cjs <src/App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const original = fs.readFileSync(filePath, 'utf8');
let text = original;

if (text.includes('lineup-opt-') && text.includes('{players.map(p => (')) {
  console.log('Already patched. No change applied.');
  process.exit(0);
}

const batterOptIndex = text.indexOf('batter-opt-');
if (batterOptIndex === -1) {
  console.error('Could not find batter-opt- block. Search App.jsx for batter-opt- and replace that optgroup manually.');
  process.exit(2);
}

const optgroupStart = text.lastIndexOf('<optgroup label="선수">', batterOptIndex);
const optgroupEnd = text.indexOf('</optgroup>', batterOptIndex);

if (optgroupStart === -1 || optgroupEnd === -1) {
  console.error('Found batter-opt-, but could not locate surrounding <optgroup>.');
  process.exit(3);
}

const replacement = `<optgroup label="선수">\n                            {players.map(p => (\n                              <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n                                {p.name} No.{p.uniformNumber}\n                              </option>\n                            ))}\n                          </optgroup>`;

text = text.slice(0, optgroupStart) + replacement + text.slice(optgroupEnd + '</optgroup>'.length);

if (text === original) {
  console.error('Matched the batter option block, but no change was applied.');
  process.exit(4);
}

const backupPath = `${filePath}.bak_pitcher_lineup_${Date.now()}`;
fs.writeFileSync(backupPath, original, 'utf8');
fs.writeFileSync(filePath, text, 'utf8');

console.log(`Backup created: ${backupPath}`);
console.log(`Patched: ${filePath}`);
console.log('Pitchers can now be selected in the lineup dropdown.');
