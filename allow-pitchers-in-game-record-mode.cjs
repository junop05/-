#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node allow-pitchers-in-game-record-mode.cjs <src/App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const original = fs.readFileSync(filePath, 'utf8');
let text = original;

const lineupSelectRe =
  /(<select[\s\S]*?value=\{slot\.playerId\}[\s\S]*?onChange=\{e => handleLineupChange\(teamKey,\s*idx,\s*'playerId',\s*e\.target\.value\)\}[\s\S]*?<option value="">[\s\S]*?<\/option>)([\s\S]*?)(<\/select>)/m;

const match = text.match(lineupSelectRe);

if (!match) {
  console.error(
    'Could not find the lineup player select block. Search App.jsx for value={slot.playerId} or handleLineupChange(teamKey, idx, \'playerId\', e.target.value).'
  );
  process.exit(2);
}

const inner = match[2];

if (inner.includes('lineup-opt-') && inner.includes('players.map(p =>')) {
  console.log('Already patched. No change applied.');
  process.exit(0);
}

const batterOnlyOptgroupRe =
  /<optgroup label="선수">[\s\S]*?players\.filter\([\s\S]*?primaryRole[\s\S]*?map\([\s\S]*?batter-opt-[\s\S]*?<\/optgroup>/m;

const replacement = `<optgroup label="선수">
                            {players.map(p => (
                              <option key={\`lineup-opt-\${p.id}\`} value={p.id}>
                                {p.name} No.{p.uniformNumber}
                              </option>
                            ))}
                          </optgroup>`;

let changed = false;

if (batterOnlyOptgroupRe.test(inner)) {
  text = text.replace(
    lineupSelectRe,
    (_, before, currentInner, after) => {
      changed = true;
      return before + currentInner.replace(batterOnlyOptgroupRe, replacement) + after;
    }
  );
} else {
  const fallbackInsertRe =
    /(<option value="">[\s\S]*?<\/option>)/m;

  text = text.replace(
    lineupSelectRe,
    (_, before, currentInner, after) => {
      if (fallbackInsertRe.test(before)) {
        changed = true;
        return before + '\n                          ' + replacement + '\n                        ' + after;
      }
      return before + currentInner + after;
    }
  );
}

if (!changed || text === original) {
  console.error('Matched the lineup select, but could not safely replace the batter-only option block.');
  process.exit(3);
}

const backupPath = `${filePath}.bak_pitcher_batting_${Date.now()}`;
fs.writeFileSync(backupPath, original, 'utf8');
fs.writeFileSync(filePath, text, 'utf8');

console.log(`Backup created: ${backupPath}`);
console.log(`Patched: ${filePath}`);
console.log('Pitchers can now appear in the batting lineup dropdown in game record mode.');