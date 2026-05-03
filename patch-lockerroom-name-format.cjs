#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CANDIDATES = [
  'app.jsx',
  'App.jsx',
  path.join('src', 'app.jsx'),
  path.join('src', 'App.jsx'),
  path.join('src', 'components', 'App.jsx'),
  path.join('components', 'App.jsx'),
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`• ${message}`);
}

function findTarget() {
  const userPath = process.argv[2];
  if (userPath) {
    const resolved = path.resolve(process.cwd(), userPath);
    if (!fs.existsSync(resolved)) fail(`지정한 파일을 찾을 수 없습니다: ${resolved}`);
    return resolved;
  }

  for (const candidate of CANDIDATES) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }

  fail('App.jsx 파일을 찾지 못했습니다. 예: node patch-lockerroom-name-format.cjs src/App.jsx');
}

function replaceExact(source, from, to, label) {
  if (!source.includes(from)) fail(`패치할 코드를 찾지 못했습니다: ${label}`);
  return source.replace(from, to);
}

const targetPath = findTarget();
let source = fs.readFileSync(targetPath, 'utf8');

if (
  source.includes('{player.uniformNumber ? `${player.uniformNumber}. ${player.name}` : player.name}') ||
  source.includes('{selectedPlayer.uniformNumber ? `${selectedPlayer.uniformNumber}. ${String(selectedPlayer.name)}` : String(selectedPlayer.name)}')
) {
  log('이미 락커룸 이름 포맷 패치가 적용되어 있습니다.');
  process.exit(0);
}

source = replaceExact(
  source,
  '<h3 className="text-xl font-bold text-gray-800 mb-1">{player.name}</h3>',
  '<h3 className="text-xl font-bold text-gray-800 mb-1">{player.uniformNumber ? `${player.uniformNumber}. ${player.name}` : player.name}</h3>',
  '락커룸 선수 카드 이름'
);

source = replaceExact(
  source,
  '<h2 className="text-4xl font-black mb-2 truncate">{String(selectedPlayer.name)}</h2>',
  '<h2 className="text-4xl font-black mb-2 truncate">{selectedPlayer.uniformNumber ? `${selectedPlayer.uniformNumber}. ${String(selectedPlayer.name)}` : String(selectedPlayer.name)}</h2>',
  '선수 상세 모달 이름'
);

const backupPath = `${targetPath}.bak-lockerroom-name-format`;
fs.writeFileSync(backupPath, fs.readFileSync(targetPath, "utf8"), 'utf8');
fs.writeFileSync(targetPath, source, 'utf8');

log(`백업 파일 생성: ${backupPath}`);
log(`패치 완료: ${targetPath}`);
log('락커룸 카드와 선수 상세 모달 이름이 "등번호. 이름" 형식으로 바뀌었습니다.');
