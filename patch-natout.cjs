const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
if (!fs.existsSync(appPath)) {
  console.error('❌ src/App.jsx 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const original = fs.readFileSync(appPath, 'utf8');
const backupPath = `${appPath}.bak_${Date.now()}`;
fs.copyFileSync(appPath, backupPath);

let code = original;
const logs = [];
const fails = [];

function applyReplace(label, replacerList) {
  for (const { re, to } of replacerList) {
    if (re.test(code)) {
      code = code.replace(re, to);
      logs.push(`✅ ${label}`);
      return true;
    }
  }
  fails.push(`❌ ${label} 패턴을 찾지 못함`);
  return false;
}

function alreadyIncludes(snippet) {
  return code.includes(snippet);
}

try {
  // 1) 낫아웃 버튼 추가 (이미 있으면 스킵)
  if (!alreadyIncludes("handleGameAction('낫아웃 출루', false, 1)")) {
    applyReplace('낫아웃 버튼 추가', [
      {
        re: /(<button[^>]*onClick=\{\(\)\s*=>\s*handleGameAction\('사구',\s*false,\s*1\)\}[\s\S]*?사구\s*\(HBP\)[\s\S]*?<\/button>)/,
        to: `$1
                      <button onClick={() => handleGameAction('낫아웃 출루', false, 1)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow transition-colors">낫아웃 출루</button>`
      }
    ]);
  } else {
    logs.push('✅ 낫아웃 버튼 이미 존재');
  }

  // 2) 플래그 추가
  if (!alreadyIncludes("const isDroppedThirdStrike = actionLabel === '낫아웃 출루';")) {
    applyReplace('isDroppedThirdStrike 플래그 추가', [
      {
        re: /(const\s+isDoublePlay\s*=\s*actionLabel\s*===\s*'병살타';)/,
        to: `$1
         const isDroppedThirdStrike = actionLabel === '낫아웃 출루';`
      }
    ]);
  } else {
    logs.push('✅ isDroppedThirdStrike 이미 존재');
  }

  // 3) 타자 strikeouts 반영
  if (!alreadyIncludes("strikeouts: (actionLabel === '삼진' || isDroppedThirdStrike) ? 1 : 0,")) {
    applyReplace('plateUpdates strikeouts 수정', [
      {
        re: /strikeouts:\s*actionLabel\s*===\s*'삼진'\s*\?\s*1\s*:\s*0\s*,/,
        to: "strikeouts: (actionLabel === '삼진' || isDroppedThirdStrike) ? 1 : 0,"
      }
    ]);
  } else {
    logs.push('✅ plateUpdates strikeouts 이미 수정됨');
  }

  // 4) 출루 분기 조건 확장
  if (!alreadyIncludes("actionLabel === '사구' || isDroppedThirdStrike")) {
    applyReplace('볼넷/사구 분기에 낫아웃 포함', [
      {
        re: /if\s*\(\s*actionLabel\s*===\s*'볼넷'\s*\|\|\s*actionLabel\s*===\s*'사구'\s*\)\s*\{/,
        to: "if (actionLabel === '볼넷' || actionLabel === '사구' || isDroppedThirdStrike) {"
      }
    ]);
  } else {
    logs.push('✅ 출루 분기 조건 이미 수정됨');
  }

  // 5) 볼넷 카운트/삼진 카운트 분리
  if (!alreadyIncludes("if (isDroppedThirdStrike) pitchingDelta.strikeouts += 1;")) {
    applyReplace('투수 walks/strikeouts 분리 반영', [
      {
        re: /pitchingDelta\.walksAllowed\s*\+=\s*1\s*;/,
        to: `if (actionLabel === '볼넷' || actionLabel === '사구') pitchingDelta.walksAllowed += 1;
             if (isDroppedThirdStrike) pitchingDelta.strikeouts += 1;`
      }
    ]);
  } else {
    logs.push('✅ 투수 분리 카운트 이미 수정됨');
  }

  // 6) 팀 요약 strikeouts 반영
  if (!alreadyIncludes("((actionLabel === '삼진' || actionLabel === '낫아웃 출루') ? 1 : 0)")) {
    applyReplace('summary strikeouts 수정', [
      {
        re: /\(actionLabel\s*===\s*'삼진'\s*\?\s*1\s*:\s*0\)/,
        to: "((actionLabel === '삼진' || actionLabel === '낫아웃 출루') ? 1 : 0)"
      }
    ]);
  } else {
    logs.push('✅ summary strikeouts 이미 수정됨');
  }

  // 필수 항목 검증
  const requiredChecks = [
    "handleGameAction('낫아웃 출루', false, 1)",
    "const isDroppedThirdStrike = actionLabel === '낫아웃 출루';",
    "actionLabel === '사구' || isDroppedThirdStrike",
    "if (isDroppedThirdStrike) pitchingDelta.strikeouts += 1;"
  ];

  const missing = requiredChecks.filter((s) => !code.includes(s));
  if (missing.length > 0) {
    fs.writeFileSync(appPath, original, 'utf8');
    console.error('❌ 필수 패치가 일부 누락되어 자동 롤백했습니다.');
    missing.forEach((m) => console.error(`- 누락: ${m}`));
    console.error(`백업 파일: ${backupPath}`);
    process.exit(1);
  }

  fs.writeFileSync(appPath, code, 'utf8');
  console.log('🎉 낫아웃 패치 완료');
  console.log(`백업 파일: ${backupPath}`);
  logs.forEach((x) => console.log(x));
  if (fails.length) {
    console.log('\n⚠️ 참고(일부 패턴 미매칭):');
    fails.forEach((x) => console.log(x));
  }
} catch (e) {
  fs.writeFileSync(appPath, original, 'utf8');
  console.error('❌ 패치 중 오류 발생, 자동 롤백 완료');
  console.error(e.message);
  console.error(`백업 파일: ${backupPath}`);
  process.exit(1);
}
