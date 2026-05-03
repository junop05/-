#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-lineup-flex.cjs <src/App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const original = fs.readFileSync(filePath, 'utf8');
let text = original;

const lineupSelectRe = /(<select[^>]*value=\{slot\.playerId\}[\s\S]*?<option\s+value=\{?""\}?[^>]*>\s*선수 선택\s*<\/option>)([\s\S]*?)(<\/select>)/m;
const lineupMatch = text.match(lineupSelectRe);

if (!lineupMatch) {
  console.error('Could not find a lineup <select> using value={slot.playerId}. Open App.jsx and search for value={slot.playerId}.');
  process.exit(2);
}

const currentInner = lineupMatch[2];
if (currentInner.includes('lineup-opt-') && currentInner.includes('players.map')) {
  console.log('This file already looks patched. No change applied.');
  process.exit(0);
}

const batterOnlyBlockRe = /<optgroup\s+label="선수">[\s\S]*?players\.filter\([\s\S]*?primaryRole[\s\S]*?map\([\s\S]*?batter-opt-[\s\S]*?<\/optgroup>/m;

let newInner;
if (batterOnlyBlockRe.test(currentInner)) {
  newInner = currentInner.replace(
    batterOnlyBlockRe,
    `<optgroup label="선수">\n                              {players.map(p => (\n                                <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n                                  {p.name} No.{p.uniformNumber}\n                                </option>\n                              ))}\n                            </optgroup>`
  );
} else {
  newInner = `\n                            <optgroup label="선수">\n                              {players.map(p => (\n                                <option key={\`lineup-opt-\${p.id}\`} value={p.id}>\n                                  {p.name} No.{p.uniformNumber}\n                                </option>\n                              ))}\n                            </optgroup>\n                          `;
}

text = text.replace(lineupSelectRe, `$1${newInner}$3`);

if (text === original) {
  console.error('Matched the lineup select, but no change was applied.');
  process.exit(3);
}

const backup = `${filePath}.bak_pitcher_lineup_${Date.now()}`;
fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(filePath, text, 'utf8');
console.log(`Backup created: ${backup}`);
console.log(`Patched: ${filePath}`);
console.log('Lineup dropdown now includes every registered player, including pitchers.');
