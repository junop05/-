#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('사용법: node safe-fix-handleGameAction.cjs <src/App.jsx>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), input);
if (!fs.existsSync(filePath)) {
  console.error(`파일이 없습니다: ${filePath}`);
  process.exit(1);
}

let src = fs.readFileSync(filePath, 'utf8');
const original = src;

const brokenLineRe = /^\s*ionst\s+isDroppedThirdStrike\s*=\s*actionLabel\s*===\s*['"]낫아웃 출루['"]\s*;?\s*\r?\n?/m;
src = src.replace(brokenLineRe, '');

src = src.replace(/\brunnersOnforEach\s*\(/g, 'runnersOn.forEach(');

const fnStart = src.indexOf('const handleGameAction = (actionLabel, isOut, basesToAdvance) => {');
if (fnStart === -1) {
  console.error('handleGameAction 함수를 찾지 못했습니다.');
  process.exit(1);
}

const fnEnd = src.indexOf('const applyPitchingEvent = (state, defenseTeam, delta) => {', fnStart);
if (fnEnd === -1) {
  console.error('handleGameAction 함수 끝 경계를 찾지 못했습니다.');
  process.exit(1);
}

let block = src.slice(fnStart, fnEnd);
const decl = `const isDroppedThirdStrike = actionLabel === '낫아웃 출루';`;

block = block.replace(new RegExp(`\\s*${decl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), '\n');

const plateIdx = block.indexOf('let plateUpdates = {');
if (plateIdx === -1) {
  console.error('plateUpdates 선언 위치를 찾지 못했습니다.');
  process.exit(1);
}

const lineStart = block.lastIndexOf('\n', plateIdx) + 1;
block = block.slice(0, lineStart) + '        ' + decl + '\n' + block.slice(lineStart);

src = src.slice(0, fnStart) + block + src.slice(fnEnd);

if (src === original) {
  console.log('변경 사항이 없습니다.');
  process.exit(0);
}

const backupPath = `${filePath}.bak2`;
fs.writeFileSync(backupPath, original, 'utf8');
fs.writeFileSync(filePath, src, 'utf8');

console.log('패치 완료');
console.log(`백업 파일: ${backupPath}`);
console.log(`수정 파일: ${filePath}`);
