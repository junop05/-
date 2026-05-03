const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.jsx');
if (!fs.existsSync(file)) {
  console.error('src/App.jsx 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let code = fs.readFileSync(file, 'utf8');
const backup = `${file}.bak_${Date.now()}`;
fs.copyFileSync(file, backup);

const warns = [];
const log = [];

function insertAfter(re, block, name) {
  const m = code.match(re);
  if (!m) {
    warns.push(`삽입 실패: ${name}`);
    return;
  }
  const i = m.index + m[0].length;
  code = code.slice(0, i) + '\n' + block + code.slice(i);
  log.push(`삽입 완료: ${name}`);
}

function insertBefore(re, block, name) {
  const m = code.match(re);
  if (!m) {
    warns.push(`삽입 실패: ${name}`);
    return;
  }
  const i = m.index;
  code = code.slice(0, i) + block + '\n' + code.slice(i);
  log.push(`삽입 완료: ${name}`);
}

function replace(re, to, name) {
  if (!re.test(code)) {
    warns.push(`치환 실패: ${name}`);
    return;
  }
  code = code.replace(re, to);
  log.push(`치환 완료: ${name}`);
}

const MARK_CONST = '/* LANDING_TIMING_PATCH_CONST */';
const MARK_EFFECT = '/* LANDING_TIMING_PATCH_EFFECT */';

// 1) 상수/상태 추가
if (!code.includes(MARK_CONST)) {
  const block = `  ${MARK_CONST}
  const DEFAULT_BG = '/background.JPG';
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [landingBgLoaded, setLandingBgLoaded] = useState(false);
  const [landingAnimReady, setLandingAnimReady] = useState(false);`;
  insertAfter(/export\s+default\s+function\s+App\s*\(\)\s*\{/, block, '기본 상수/상태');
}

// 2) customBackground 초기값 null
replace(
  /const\s*\[\s*customBackground\s*,\s*setCustomBackground\s*\]\s*=\s*useState\([^;]*\);/,
  "const [customBackground, setCustomBackground] = useState(null);",
  'customBackground 초기값'
);

// 3) unsubSettings 교체
replace(
  /const\s+unsubSettings\s*=\s*onSnapshot\(\s*collection\(\s*db\s*,\s*['"]polaris_settings['"]\s*\)\s*,\s*\(snap\)\s*=>\s*\{[\s\S]*?\}\s*\);/,
  `const unsubSettings = onSnapshot(collection(db, 'polaris_settings'), (snap) => {
      const bgDoc = snap.docs.find((d) => d.id === 'background_current');
      if (bgDoc) {
        const data = bgDoc.data();
        setCustomBackground(data?.imageUrl || DEFAULT_BG);
        setBgSettings(data?.settings || { scale: 1, posX: 50, posY: 50 });
      } else {
        setCustomBackground(DEFAULT_BG);
        setBgSettings({ scale: 1, posX: 50, posY: 50 });
      }
      setIsSettingsLoaded(true);
    });`,
  'unsubSettings'
);

// 4) 이미지 preload useEffect 추가
if (!code.includes(MARK_EFFECT)) {
  const effect = `  ${MARK_EFFECT}
  useEffect(() => {
    if (!isSettingsLoaded || !customBackground) return;
    let canceled = false;

    setLandingBgLoaded(false);
    setLandingAnimReady(false);

    const img = new Image();
    img.onload = () => {
      if (canceled) return;
      setLandingBgLoaded(true);
      requestAnimationFrame(() => {
        if (!canceled) setLandingAnimReady(true);
      });
    };
    img.onerror = () => {
      if (canceled) return;
      setLandingBgLoaded(true);
      setLandingAnimReady(true);
    };
    img.src = customBackground;

    return () => {
      canceled = true;
    };
  }, [isSettingsLoaded, customBackground]);`;

  if (/const\s+allPlayers\s*=\s*useMemo\(/.test(code)) {
    insertBefore(/const\s+allPlayers\s*=\s*useMemo\(/, effect, 'preload useEffect');
  } else {
    insertBefore(/const\s+handleInputChange\s*=\s*\(e\)\s*=>\s*\{/, effect, 'preload useEffect(fallback)');
  }
}

// 5) landing 화면 조건 적용
replace(
  /className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center"/,
  "className={`absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center transition-opacity duration-500 ${landingBgLoaded ? 'opacity-100' : 'opacity-0'}`}",
  'landing 배경 opacity 조건'
);

replace(/src=\{customBackground\}/g, "src={customBackground || DEFAULT_BG}", 'landing img src fallback');

code = code.replace(
  /<span className="([^"]*?)animate-slide-left([^"]*?)">/g,
  (_m, a, b) => `<span className={\`${a}\${landingAnimReady ? 'animate-slide-left' : 'opacity-0'}${b}\`}>`
);
code = code.replace(
  /<span className="([^"]*?)animate-slide-right([^"]*?)">/g,
  (_m, a, b) => `<span className={\`${a}\${landingAnimReady ? 'animate-slide-right' : 'opacity-0'}${b}\`}>`
);

// 6) resetBackground 기본 이미지 통일
replace(
  /setCustomBackground\(\s*['"]\/background\s*\.?JPG['"]\s*\);/gi,
  'setCustomBackground(DEFAULT_BG);',
  'resetBackground setCustomBackground'
);
replace(
  /imageUrl:\s*['"]\/background\s*\.?JPG['"]/gi,
  'imageUrl: DEFAULT_BG',
  'resetBackground imageUrl'
);

// 7) 저장
fs.writeFileSync(file, code, 'utf8');

console.log('패치 완료 ✅');
console.log('백업 파일:', backup);
if (log.length) console.log(log.map((x) => '- ' + x).join('\n'));
if (warns.length) {
  console.log('\n수동 확인 필요 ⚠️');
  console.log(warns.map((x) => '- ' + x).join('\n'));
}
