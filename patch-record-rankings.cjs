const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'App.jsx');
if (!fs.existsSync(filePath)) {
  console.error('❌ src/App.jsx 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let code = fs.readFileSync(filePath, 'utf8');
const backupPath = `${filePath}.bak_${Date.now()}`;
fs.copyFileSync(filePath, backupPath);

const logs = [];
const warns = [];

function replaceOnce(label, re, to) {
  if (!re.test(code)) {
    warns.push(`패턴 못 찾음: ${label}`);
    return false;
  }
  code = code.replace(re, to);
  logs.push(`적용: ${label}`);
  return true;
}

// 1) renderRecordsAndRankings 내부에 helper/정렬 변수 추가 (중복 방지)
const marker = '/* RECORD_RANK_PATCH_V1 */';
if (!code.includes(marker)) {
  const block = `
    ${marker}
    const getH = (p) => Number(p?.stats?.hits ?? p?.hits ?? 0);
    const getBB = (p) => Number(p?.stats?.walks ?? p?.walks ?? 0);
    const getOnBase = (p) => getH(p) + getBB(p);
    const getIPOuts = (p) => parseBaseballInningsToOuts(p?.stats?.innings ?? p?.innings ?? 0);

    const battersByHits = [...players]
      .filter(p => p.primaryRole === '타자' || p.primaryRole === '투타겸업' || p.batting?.atBats > 0)
      .map(b => getBatterStats(b, 'season'))
      .sort((a, b) => getH(b) - getH(a));

    const battersByOnBase = [...players]
      .filter(p => p.primaryRole === '타자' || p.primaryRole === '투타겸업' || p.batting?.atBats > 0)
      .map(b => getBatterStats(b, 'season'))
      .sort((a, b) => getOnBase(b) - getOnBase(a));

    const pitchersByInnings = [...players]
      .filter(p => p.primaryRole === '투수' || p.primaryRole === '투타겸업' || parseBaseballInningsToOuts(p.pitching?.innings) > 0)
      .map(p => getPitcherStats(p, 'season'))
      .sort((a, b) => getIPOuts(b) - getIPOuts(a));
`;

  // renderRecordsAndRankings 함수 내부의 return( 바로 앞에 삽입
  replaceOnce(
    'helper 블록 삽입',
    /(const\s+renderRecordsAndRankings\s*=\s*\(\)\s*=>\s*\{[\s\S]*?)(\n\s*return\s*\()/,
    `$1${block}$2`
  );
} else {
  logs.push('이미 적용됨: helper 블록');
}

// 2) 홈런 카드 -> 안타 카드
replaceOnce(
  '홈런→안타 카드',
  /<RankTable\s+title="홈런"[\s\S]*?\/>/,
  `<RankTable title="안타" data={battersByHits} getValue={p => \`\${getH(p)}개\`} valueLabel="H" />`
);

// 3) 타점 카드 -> 출루 카드
replaceOnce(
  '타점→출루 카드',
  /<RankTable\s+title="타점"[\s\S]*?\/>/,
  `<RankTable title="출루" data={battersByOnBase} getValue={p => \`\${getOnBase(p)}회\`} valueLabel="OB" />`
);

// 4) 다승 카드 -> 이닝 카드
replaceOnce(
  '다승→이닝 카드',
  /<RankTable\s+title="다승"[\s\S]*?\/>/,
  `<RankTable title="이닝" data={pitchersByInnings} getValue={p => outsToBaseballInnings(getIPOuts(p))} valueLabel="IP" />`
);

fs.writeFileSync(filePath, code, 'utf8');

console.log('✅ 패치 완료');
console.log('백업 파일:', backupPath);
if (logs.length) console.log(logs.map(v => `- ${v}`).join('\n'));
if (warns.length) {
  console.log('\n⚠️ 수동 확인 필요');
  console.log(warns.map(v => `- ${v}`).join('\n'));
}
