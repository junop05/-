const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
if (!fs.existsSync(appPath)) {
  console.error('❌ src/App.jsx 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const original = fs.readFileSync(appPath, 'utf8');
const backup = `${appPath}.bak_${Date.now()}`;
fs.copyFileSync(appPath, backup);

let code = original;
const logs = [];
const warns = [];

function rep(label, re, to) {
  if (!re.test(code)) {
    warns.push(`패턴 미발견: ${label}`);
    return false;
  }
  code = code.replace(re, to);
  logs.push(`적용: ${label}`);
  return true;
}

// 1) createBaseBatting 확장
rep(
  'createBaseBatting',
  /const\s+createBaseBatting\s*=\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\s*\);\s*\n\s*const\s+createBasePitching\s*=\s*\(\)\s*=>\s*\(\{/,
`const createBaseBatting = () => ({
  games: 0, atBats: 0, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 0, strikeouts: 0, steals: 0, errors: 0, avg: '0.000',
  career: { games: 0, atBats: 0, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 0, strikeouts: 0, steals: 0, errors: 0, avg: '0.000' }
});

const createBasePitching = () => ({`
);

// 2) openCareerModal 필드 추가
rep(
  'openCareerModal doubles/triples',
  /b_hits:\s*player\.batting\?\.career\?\.hits\s*\|\|\s*0,\s*\n\s*b_homeRuns:/,
`b_hits: player.batting?.career?.hits || 0,
      b_doubles: player.batting?.career?.doubles || 0,
      b_triples: player.batting?.career?.triples || 0,
      b_homeRuns:`
);

// 3) handleSaveCareer 계산식 확장
rep(
  'handleSaveCareer batting calc',
  /const\s+b_hits\s*=\s*parseInt\(careerForm\.b_hits\)\s*\|\|\s*0;\s*\n\s*const\s+b_ab\s*=\s*parseInt\(careerForm\.b_atBats\)\s*\|\|\s*0;\s*\n\s*const\s+b_avg\s*=\s*String\(calculateBattingAverage\(b_hits,\s*b_ab\)\);/,
`const b_hits = parseInt(careerForm.b_hits) || 0;
      const b_ab = parseInt(careerForm.b_atBats) || 0;
      const b_2b = parseInt(careerForm.b_doubles) || 0;
      const b_3b = parseInt(careerForm.b_triples) || 0;
      const b_hr = parseInt(careerForm.b_homeRuns) || 0;
      if (b_2b + b_3b + b_hr > b_hits) {
        alert('안타(H)는 2루타+3루타+홈런 합보다 크거나 같아야 합니다.');
        return;
      }
      const b_1b = b_hits - (b_2b + b_3b + b_hr);
      const b_avg = String(calculateBattingAverage(b_hits, b_ab));`
);

// 4) 저장 필드 확장
rep(
  'career 저장 singles/doubles/triples',
  /hits:\s*b_hits,\s*\n\s*homeRuns:\s*parseInt\(careerForm\.b_homeRuns\)\s*\|\|\s*0,/,
`hits: b_hits,
            singles: b_1b,
            doubles: b_2b,
            triples: b_3b,
            homeRuns: b_hr,`
);

// 5) getBatterStats 총루타 계산 개선
rep(
  'getBatterStats tb',
  /const\s+tb\s*=\s*\(h\s*-\s*hr\)\s*\+\s*\(hr\s*\*\s*4\)\s*;[^\n]*\n\s*const\s+slg\s*=\s*ab\s*>\s*0\s*\?\s*tb\s*\/\s*ab\s*:\s*0\s*;/,
`const doubles = stats.doubles || 0;
     const triples = stats.triples || 0;
     const singles = typeof stats.singles === 'number' ? stats.singles : Math.max(0, h - doubles - triples - hr);
     const tb = singles + doubles * 2 + triples * 3 + hr * 4;
     const slg = ab > 0 ? tb / ab : 0;`
);

// 6) 통산 입력 UI: 2루타/3루타 추가 (b_hits 입력 뒤)
if (!code.includes('name="b_doubles"') && !code.includes("name='b_doubles'")) {
  rep(
    'career modal input 추가',
    /(<input[^>]*name=["']b_hits["'][^>]*>[\s\S]*?<\/div>)/,
`$1
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">2루타 (2B)</label><input type="number" name="b_doubles" value={careerForm.b_doubles} onChange={handleCareerInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" min="0" /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">3루타 (3B)</label><input type="number" name="b_triples" value={careerForm.b_triples} onChange={handleCareerInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" min="0" /></div>`
  );
} else {
  logs.push('적용: career modal input 이미 존재');
}

// 저장
fs.writeFileSync(appPath, code, 'utf8');

console.log('🎉 패치 완료');
console.log('백업:', backup);
logs.forEach(v => console.log('-', v));
if (warns.length) {
  console.log('\n⚠️ 수동 확인 필요');
  warns.forEach(v => console.log('-', v));
}
