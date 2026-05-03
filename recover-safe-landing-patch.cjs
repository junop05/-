const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
const srcDir = path.join(process.cwd(), 'src');

function latestBackup() {
  const files = fs.readdirSync(srcDir).filter((f) => /^App\.jsx\.bak_\d+$/.test(f));
  if (!files.length) return null;
  files.sort((a, b) => Number(b.split('_').pop()) - Number(a.split('_').pop()));
  return path.join(srcDir, files[0]);
}

function backupCurrent() {
  if (!fs.existsSync(appPath)) return null;
  const out = `${appPath}.pre_safe_${Date.now()}`;
  fs.copyFileSync(appPath, out);
  return out;
}

function ensureAfter(code, re, block) {
  if (code.includes(block.trim())) return code;
  const m = code.match(re);
  if (!m) return code;
  const i = m.index + m[0].length;
  return code.slice(0, i) + '\n' + block + code.slice(i);
}

function ensureBefore(code, re, block) {
  if (code.includes(block.trim())) return code;
  const m = code.match(re);
  if (!m) return code;
  const i = m.index;
  return code.slice(0, i) + block + '\n' + code.slice(i);
}

if (!fs.existsSync(appPath)) throw new Error('src/App.jsx 없음');

const bak = latestBackup();
if (!bak) throw new Error('복구용 App.jsx.bak_* 파일이 없음');

const pre = backupCurrent();
fs.copyFileSync(bak, appPath);

let code = fs.readFileSync(appPath, 'utf8');

// App 시작 직후 공통 상수/상태
const appStart = /export\s+default\s+function\s+App\s*\(\)\s*\{/;
const stateBlock = `
  const DEFAULT_BG = '/background.JPG';
  const [landingBgLoaded, setLandingBgLoaded] = useState(false);
  const [landingAnimReady, setLandingAnimReady] = useState(false);`;
code = ensureAfter(code, appStart, stateBlock);

// customBackground 초기값 null
code = code.replace(
  /const\s*\[\s*customBackground\s*,\s*setCustomBackground\s*\]\s*=\s*useState\([^)]*\);/,
  "const [customBackground, setCustomBackground] = useState(null);"
);

// settings 구독 (있으면 교체, 없으면 스킵)
const settingsRe = /const\s+unsubSettings\s*=\s*onSnapshot\s*\(\s*collection\s*\(\s*db\s*,\s*['"]polaris_settings['"]\s*\)\s*,[\s\S]*?setIsSettingsFetched\s*\(\s*true\s*\)\s*;\s*\}\s*\)\s*;/;
const settingsBlock = `const unsubSettings = onSnapshot(collection(db, 'polaris_settings'), (snap) => {
      const bgDoc = snap.docs.find((d) => d.id === 'background_current');
      if (bgDoc) {
        const data = bgDoc.data();
        setCustomBackground(data?.imageUrl || DEFAULT_BG);
        setBgSettings(data?.settings || { scale: 1, posX: 50, posY: 50 });
      } else {
        setCustomBackground(DEFAULT_BG);
        setBgSettings({ scale: 1, posX: 50, posY: 50 });
      }
      setIsSettingsFetched(true);
    });`;
if (settingsRe.test(code)) code = code.replace(settingsRe, settingsBlock);

// preload effect
const effectBlock = `
  useEffect(() => {
    if (!isSettingsFetched || !customBackground) return;
    setLandingBgLoaded(false);
    setLandingAnimReady(false);
    const img = new Image();
    img.onload = () => {
      setLandingBgLoaded(true);
      requestAnimationFrame(() => setLandingAnimReady(true));
    };
    img.onerror = () => {
      setLandingBgLoaded(true);
      setLandingAnimReady(true);
    };
    img.src = customBackground;
  }, [isSettingsFetched, customBackground]);`;
if (!code.includes('setLandingAnimReady(true)')) {
  code = ensureBefore(code, /const\s+allPlayers\s*=\s*useMemo\(/, effectBlock);
  if (!code.includes('setLandingAnimReady(true)')) {
    code = ensureBefore(code, /const\s+handleInputChange\s*=\s*\(e\)\s*=>\s*\{/, effectBlock);
  }
}

// landing 표시 타이밍
code = code.replace(/isSettingsFetched \? 'opacity-100' : 'opacity-0'/g, "landingBgLoaded ? 'opacity-100' : 'opacity-0'");
code = code.replace(/isSettingsFetched \? 'animate-slide-left' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-left' : 'opacity-0'");
code = code.replace(/isSettingsFetched \? 'animate-slide-right' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-right' : 'opacity-0'");
code = code.replace(/src=\{customBackground\}/g, "src={customBackground || DEFAULT_BG}");

// reset 기본 이미지 치환
code = code.replace(/['"]\/background\s*\.?JPG['"]/gi, 'DEFAULT_BG');

// 기존 자잘한 오타
code = code.replace(/finishedStatevenue/g, 'finishedState.venue');
code = code.replace(/newLogsunshift\s*\(/g, 'newLogs.unshift(');
code = code.replace(/\$\{pwins\}/g, '${p.wins}');

fs.writeFileSync(appPath, code, 'utf8');

console.log('복구 원본:', bak);
console.log('현재 파일 백업:', pre || '(없음)');
console.log('안전패치 완료:', appPath);
