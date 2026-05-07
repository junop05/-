#!/usr/bin/env node
/**
 * patch-locker-show-number.cjs
 *
 * 락커룸 선수 카드의 이름 표시를 "박준호" -> "53. 박준호" 형식으로 변경합니다.
 *
 * 사용법:
 *   node patch-locker-show-number.cjs src/App.jsx
 *   node patch-locker-show-number.cjs src/App.jsx App_patched.jsx
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const PATCH_MARKER = '[PATCH:locker-show-number]';

const BEFORE = '<h3 className="text-xl font-bold text-gray-800 mb-1">{player.name}</h3>';
const AFTER  = '<h3 className="text-xl font-bold text-gray-800 mb-1">{/* ' + PATCH_MARKER + ' */}{player.uniformNumber}. {player.name}</h3>';

function applyPatch(source) {
  if (source.includes(PATCH_MARKER)) {
    return { patched: false, content: source, reason: '이미 패치가 적용된 파일입니다.' };
  }
  if (!source.includes(BEFORE)) {
    return {
      patched: false,
      content: source,
      reason: '패치 대상 패턴을 찾지 못했습니다.\n  파일 내 해당 코드가 있는지 확인해주세요.'
    };
  }
  return { patched: true, content: source.replace(BEFORE, AFTER), count: 1 };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('사용법: node patch-locker-show-number.cjs <입력파일> [출력파일]');
    process.exit(1);
  }

  const inputFile  = path.resolve(args[0]);
  const outputFile = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputFile)) {
    console.error('오류: 파일을 찾을 수 없습니다 → ' + inputFile);
    process.exit(1);
  }

  const source = fs.readFileSync(inputFile, 'utf8');
  const { patched, content, count, reason } = applyPatch(source);

  if (!patched) {
    console.warn('⚠️  패치 건너뜀: ' + reason);
    process.exit(0);
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log('✅ 패치 완료 (' + count + '곳 수정) → ' + outputFile);
  } else {
    const backupFile = inputFile + '.backup';
    fs.copyFileSync(inputFile, backupFile);
    fs.writeFileSync(inputFile, content, 'utf8');
    console.log('✅ 패치 완료 (' + count + '곳 수정)');
    console.log('   원본 백업: ' + backupFile);
    console.log('   수정 파일: ' + inputFile);
  }
}

main();
