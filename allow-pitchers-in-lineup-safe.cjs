#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-lineup-safe.cjs <src/App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let text = fs.readFileSync(filePath, 'utf8');
const original = text;

const lineupSelectPattern = /(value=\{slot\.playerId\}[\s\S]*?onChange=\{e => handleLineupChange\(teamKey, idx, 'playerId', e\.target\.value\)\}[\s\S]*?<option value="">선수 선택<\/option>)([\s\S]*?)(<\/select>)/m;

const match = text.match(lineupSelectPattern);
if (!match) {
  console.error('Could not find the lineup player select block. Search for handleLineupChange(teamKey, idx, \'playerId\', e.target.value).');
  process.exit(2);
}

const currentBlock = match[2];
if (!currentBlock.includes('batter-opt-') && currentBlock.includes('lineup-opt-')) {
  console.log('This file already looks patched. No change applied.');
  process.exit(0);
}

const replacementOptgroup = `\n                            <optgroup label="선수">\n                              {players.map(p => (\n                                <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n                                  {p.name} No.{p.uniformNumber}\n                                </option>\n                              ))}\n                            </optgroup>\n                          `;

text = text.replace(lineupSelectPattern, `$1${replacementOptgroup}$3`);

if (text === original) {
  console.error('Matched the lineup select block but no change was applied.');
  process.exit(3);
}

const backup = `${filePath}.bak_pitcher_lineup_${Date.now()}`;
fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(filePath, text, 'utf8');
console.log(`Backup created: ${backup}`);
console.log(`Patched: ${filePath}`);
console.log('Pitchers can now be selected in the lineup dropdown.');
