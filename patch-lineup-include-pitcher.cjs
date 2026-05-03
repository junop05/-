#!/usr/bin/env node
/**
 * patch-lineup-include-pitcher.cjs
 *
 * 타순 선택 드롭다운의 optgroup 필터에서 '투수' 역할 선수도
 * 타순에 선택 가능하도록 패치합니다.
 *
 * 사용법:
 *   node patch-lineup-include-pitcher.cjs <입력파일> [출력파일]
 *
 *   출력파일 생략 시 원본을 .backup으로 백업 후 인플레이스 수정
 *
 * 예시:
 *   node patch-lineup-include-pitcher.cjs App.jsx
 *   node patch-lineup-include-pitcher.cjs App.jsx App_patched.jsx
 */

const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '/* [PATCH:lineup-include-pitcher] */';

// ──────────────────────────────────────────────────────────────────────────────
// 패치 대상 패턴 (타순 드롭다운 optgroup - 타자/양쪽만 표시하는 필터)
// 원본: players.filter(p => ['타자','양쪽'].includes(p.primaryRole))
//       또는 ['타자', '양쪽'] / ["타자","양쪽"] 등 다양한 공백 형태
// 패치: ['타자', '양쪽', '투수'] 로 변경
// ──────────────────────────────────────────────────────────────────────────────

// 타순 드롭다운 내부 optgroup 의 batter 필터 패턴들
const BATTER_FILTER_PATTERNS = [
  // 작은따옴표, 공백 다양
  /players\.filter\(\s*p\s*=>\s*\[['"]타자['"]\s*,\s*['"]양쪽['"]\]\.includes\(p\.primaryRole\)\)/g,
  // 큰따옴표
  /players\.filter\(\s*p\s*=>\s*\["타자"\s*,\s*"양쪽"\]\.includes\(p\.primaryRole\)\)/g,
];

const REPLACEMENT =
  `${PATCH_MARKER} players.filter(p => ['타자', '양쪽', '투수'].includes(p.primaryRole))`;

// ──────────────────────────────────────────────────────────────────────────────
// 유효성 검사: 타순 드롭다운에만 적용 (투수 선택 드롭다운은 건드리지 않음)
// 투수 드롭다운은 ['투수','양쪽'] 필터 → 그대로 유지
// ──────────────────────────────────────────────────────────────────────────────

function applyPatch(source) {
  // 이미 패치된 경우
  if (source.includes(PATCH_MARKER)) {
    return { patched: false, content: source, reason: '이미 패치가 적용된 파일입니다.' };
  }

  let result = source;
  let patchCount = 0;

  for (const pattern of BATTER_FILTER_PATTERNS) {
    const before = result;
    result = result.replace(pattern, REPLACEMENT);
    if (result !== before) patchCount++;
  }

  if (patchCount === 0) {
    return {
      patched: false,
      content: source,
      reason:
        "패치 대상 패턴을 찾지 못했습니다.\n" +
        "  찾는 패턴: players.filter(p => ['타자','양쪽'].includes(p.primaryRole))\n" +
        "  파일 내 해당 코드가 있는지 확인해주세요.",
    };
  }

  return { patched: true, content: result, patchCount };
}

// ──────────────────────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('사용법: node patch-lineup-include-pitcher.cjs <입력파일> [출력파일]');
    process.exit(1);
  }

  const inputFile = path.resolve(args[0]);
  const outputFile = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputFile)) {
    console.error(`오류: 파일을 찾을 수 없습니다 → ${inputFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(inputFile, 'utf8');
  const { patched, content, patchCount, reason } = applyPatch(source);

  if (!patched) {
    console.warn(`⚠️  패치 건너뜀: ${reason}`);
    process.exit(0);
  }

  if (outputFile) {
    // 새 파일로 출력
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log(`✅ 패치 완료 (${patchCount}곳 수정) → ${outputFile}`);
  } else {
    // 인플레이스: 원본 백업 후 덮어쓰기
    const backupFile = inputFile + '.backup';
    fs.copyFileSync(inputFile, backupFile);
    fs.writeFileSync(inputFile, content, 'utf8');
    console.log(`✅ 패치 완료 (${patchCount}곳 수정)`);
    console.log(`   원본 백업: ${backupFile}`);
    console.log(`   수정 파일: ${inputFile}`);
  }
}

main();
