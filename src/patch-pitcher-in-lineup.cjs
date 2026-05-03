/**
 * patch-pitcher-in-lineup.cjs
 *
 * [패치 내용]
 * 경기 기록 모드(startGame)에서 투수가 타순에 없을 경우
 * 자동으로 타순 마지막에 추가하는 옵션 A 패치.
 *
 * 사용법:
 *   node patch-pitcher-in-lineup.cjs <입력파일.js(x)> [출력파일.js(x)]
 *
 *   출력파일을 생략하면 원본 파일을 직접 수정합니다.
 *   원본 백업은 <입력파일>.backup 으로 자동 저장됩니다.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── CLI 인수 처리 ──────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌  사용법: node patch-pitcher-in-lineup.cjs <입력파일> [출력파일]');
  process.exit(1);
}

const inputFile  = path.resolve(args[0]);
const outputFile = args[1] ? path.resolve(args[1]) : inputFile;
const inPlace    = inputFile === outputFile;

if (!fs.existsSync(inputFile)) {
  console.error(`❌  파일을 찾을 수 없습니다: ${inputFile}`);
  process.exit(1);
}

// ── 원본 읽기 ─────────────────────────────────────────────────
const original = fs.readFileSync(inputFile, 'utf8');

// ── 이미 패치 여부 확인 ────────────────────────────────────────
const PATCH_MARKER = '/* [PATCH] pitcher-in-lineup */';
if (original.includes(PATCH_MARKER)) {
  console.log('ℹ️  이미 패치가 적용된 파일입니다. 건너뜁니다.');
  process.exit(0);
}

// ── 패치 대상 코드 정의 ────────────────────────────────────────
// startGame 내부의 mappedLineup 생성 직후, newTeams[team] 할당 직전 부분을 찾아
// 투수 자동 추가 코드를 삽입합니다.
//
// 찾을 원본 패턴 (공백 유연하게):
//   newTeams[team] = {
//     ...gameState[team],
//     pitcher: pitcher,
//     lineup: mappedLineup
//   };
//
// 교체할 새 코드:
//   (투수 자동 추가 로직 + 기존 newTeams 할당)

const TARGET_REGEX = /([ \t]*)(newTeams\[team\]\s*=\s*\{\s*\.\.\.gameState\[team\],\s*pitcher:\s*pitcher,\s*lineup:\s*mappedLineup\s*\};)/;

const PATCH_CODE = (indent) => `${PATCH_MARKER}
${indent}// 투수가 타순에 없으면 자동으로 마지막 타순에 추가 (옵션 A)
${indent}const pitcherAlreadyInLineup = mappedLineup.some(
${indent}  (p) => String(p.id) === String(pitcherRawId)
${indent});
${indent}if (!pitcherAlreadyInLineup && pitcher) {
${indent}  mappedLineup.push({
${indent}    ...pitcher,
${indent}    assignedPosition: pitcher.position || '1',
${indent}    gameStats: {}
${indent}  });
${indent}}`;

// ── 패치 적용 ─────────────────────────────────────────────────
if (!TARGET_REGEX.test(original)) {
  console.error('❌  패치 대상 코드를 찾지 못했습니다.');
  console.error('    파일이 올바른 소스 파일인지 확인하세요.');
  console.error('    (newTeams[team] = { ...gameState[team], pitcher: pitcher, lineup: mappedLineup }; 가 있어야 합니다)');
  process.exit(1);
}

const patched = original.replace(TARGET_REGEX, (match, indent, assignBlock) => {
  return `${PATCH_CODE(indent)}\n${indent}${assignBlock}`;
});

// ── 백업 저장 (인플레이스 수정일 때만) ─────────────────────────
if (inPlace) {
  const backupPath = inputFile + '.backup';
  fs.writeFileSync(backupPath, original, 'utf8');
  console.log(`💾  원본 백업 저장됨: ${backupPath}`);
}

// ── 결과 저장 ─────────────────────────────────────────────────
fs.writeFileSync(outputFile, patched, 'utf8');

console.log('✅  패치 완료!');
console.log(`    출력 파일: ${outputFile}`);
console.log('');
console.log('[변경 내용]');
console.log('  startGame() 내부의 mappedLineup 구성 이후,');
console.log('  투수(pitcher)가 타순(lineup)에 포함되어 있지 않으면');
console.log('  자동으로 마지막 타순에 추가됩니다.');
console.log('  이미 타순에 투수를 직접 넣은 경우에는 중복 추가되지 않습니다.');
