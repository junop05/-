#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('사용법: node fix-handleGameAction.cjs <대상파일경로>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), target);
if (!fs.existsSync(filePath)) {
  console.error(`파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

let src = fs.readFileSync(filePath, 'utf8');
const original = src;

function insertDroppedThirdStrikeBeforePlateUpdates(code) {
  const plateRegex = /let\s+plateUpdates\s*=\s*\{/;
  const alreadyDeclaredBefore = /const\s+isDroppedThirdStrike\s*=/.test(
    code.slice(0, code.search(plateRegex))
  );

  if (alreadyDeclaredBefore) return code;

  const idx = code.search(plateRegex);
  if (idx === -1) return code;

  const insert = `const isDroppedThirdStrike = actionLabel === '낫아웃 출루';\n        `;
  return code.slice(0, idx) + insert + code.slice(idx);
}

function removeDuplicateDroppedThirdStrikeAfter(code) {
  const firstIdx = code.indexOf(`const isDroppedThirdStrike = actionLabel === '낫아웃 출루';`);
  if (firstIdx === -1) return code;

  const rest = code.slice(firstIdx + 1);
  const dupRegex = /\n\s*const\s+isDroppedThirdStrike\s*=\s*actionLabel\s*===\s*['"]낫아웃 출루['"]\s*;?/g;
  let found = false;
  const cleanedRest = rest.replace(dupRegex, (m, offset) => {
    if (!found) {
      found = true;
      return m;
    }
    return '';
  });

  return code[0] + cleanedRest;
}

function fixRunnerOnForEachTypo(code) {
  return code.replace(/\brunnersOnforEach\s*\(/g, 'runnersOn.forEach(');
}

src = insertDroppedThirdStrikeBeforePlateUpdates(src);
src = removeDuplicateDroppedThirdStrikeAfter(src);
src = fixRunnerOnForEachTypo(src);

if (src === original) {
  console.log('패치할 변경사항이 없었습니다.');
  process.exit(0);
}

const backup = `${filePath}.bak`;
fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(filePath, src, 'utf8');

console.log('패치 완료');
console.log(`원본 백업: ${backup}`);
console.log(`수정 파일: ${filePath}`);
