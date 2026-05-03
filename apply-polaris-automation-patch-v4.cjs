const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APP = path.join(ROOT, 'src', 'App.jsx');
const FDIR = path.join(ROOT, 'functions');
const FINDEX = path.join(FDIR, 'index.js');
const FPKG = path.join(FDIR, 'package.json');
const ENVEX = path.join(ROOT, '.env.example');

const log = [];
const warn = [];

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
  log.push(`작성: ${p}`);
}
function backup(p) {
  if (!exists(p)) return;
  const b = `${p}.bak_${Date.now()}`;
  fs.copyFileSync(p, b);
  log.push(`백업: ${b}`);
}
function safeReplace(code, re, repl, name) {
  if (!re.test(code)) {
    warn.push(`치환 못함: ${name}`);
    return code;
  }
  return code.replace(re, repl);
}
function insertAfter(code, re, block, name) {
  const m = code.match(re);
  if (!m) {
    warn.push(`삽입 못함: ${name}`);
    return code;
  }
  const i = m.index + m[0].length;
  return code.slice(0, i) + '\n' + block + code.slice(i);
}
function insertBefore(code, re, block, name) {
  const m = code.match(re);
  if (!m) {
    warn.push(`삽입 못함: ${name}`);
    return code;
  }
  const i = m.index;
  return code.slice(0, i) + block + '\n' + code.slice(i);
}

function patchApp() {
  if (!exists(APP)) throw new Error(`파일 없음: ${APP}`);
  backup(APP);
  let code = read(APP);

  // 1) App 함수 시작점
  const appStartRe = /export\s+default\s+function\s+App\s*\(\)\s*\{/;
  if (!appStartRe.test(code)) throw new Error('App 컴포넌트 시작점을 찾지 못함');

  // 2) 공통 patch 블록(중복 방지 marker)
  const STATE_MARK = '/* POLARIS_PATCH_V4_STATE */';
  if (!code.includes(STATE_MARK)) {
    const stateBlock = `  ${STATE_MARK}
  const DEFAULT_BG = '/background.JPG';
  const AUTO_IMPORT_ENDPOINT = import.meta.env.VITE_AUTO_IMPORT_ENDPOINT || '';
  const [landingBgLoaded, setLandingBgLoaded] = useState(false);
  const [landingAnimReady, setLandingAnimReady] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);`;
    code = insertAfter(code, appStartRe, stateBlock, 'state block');
  }

  // 3) customBackground 초기값 null
  code = safeReplace(
    code,
    /const\s*\[\s*customBackground\s*,\s*setCustomBackground\s*\]\s*=\s*useState\([^)]*\);/,
    "const [customBackground, setCustomBackground] = useState(null);",
    'customBackground 초기값'
  );

  // 4) settings 구독 블록 교체
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
  code = safeReplace(code, settingsRe, settingsBlock, 'unsubSettings');

  // 5) landing preload effect 삽입
  const EFFECT_MARK = '/* POLARIS_PATCH_V4_LANDING_EFFECT */';
  if (!code.includes(EFFECT_MARK)) {
    const effectBlock = `  ${EFFECT_MARK}
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

    const beforeAllPlayers = /const\s+allPlayers\s*=\s*useMemo\(/;
    const beforeInput = /const\s+handleInputChange\s*=\s*\(e\)\s*=>\s*\{/;
    let prev = code;
    code = insertBefore(code, beforeAllPlayers, effectBlock, 'landing effect(allPlayers)');
    if (code === prev) code = insertBefore(code, beforeInput, effectBlock, 'landing effect(input)');
  }

  // 6) landing 조건/이미지 fallback 변경
  code = code.replace(/isSettingsFetched \? 'opacity-100' : 'opacity-0'/g, "landingBgLoaded ? 'opacity-100' : 'opacity-0'");
  code = code.replace(/isSettingsFetched \? 'animate-slide-left' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-left' : 'opacity-0'");
  code = code.replace(/isSettingsFetched \? 'animate-slide-right' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-right' : 'opacity-0'");
  code = code.replace(/src=\{customBackground\}/g, "src={customBackground || DEFAULT_BG}");

  // 7) 자동분석 함수 삽입
  const AUTO_MARK = '/* POLARIS_PATCH_V4_AUTO_IMPORT */';
  if (!code.includes(AUTO_MARK)) {
    const autoFns = `  ${AUTO_MARK}
  const applyCareerDraftToPlayer = async (draft) => {
    if (!draft || !user) return;

    const no = Number(draft.uniformNumber);
    const name = String(draft.name || '').trim();

    const target =
      players.find((p) => Number(p.uniformNumber) === no) ||
      players.find((p) => String(p.name || '').trim() === name);

    if (!target) {
      alert('대상 선수를 찾지 못했습니다. 이름/등번호를 확인해주세요.');
      return;
    }

    const b = draft.battingCareer || {};
    const pit = draft.pitchingCareer || {};

    const normInnings = (v) => {
      const s = String(v ?? '0').trim();
      if (!s) return '0';
      if (s.includes(' ')) return s;
      if (s.includes('.')) {
        const [w, d] = s.split('.');
        const o = d === '1' ? 1 : d === '2' ? 2 : 0;
        return \`\${parseInt(w || '0', 10)} \${o}\`;
      }
      return s;
    };

    const bHits = Number(b.hits || 0);
    const bAb = Number(b.atBats || 0);
    const bAvg = String(calculateBattingAverage(bHits, bAb));
    const pEr = Number(pit.earnedRuns || 0);
    const pIp = normInnings(pit.innings);
    const pEra = String(calculateEra(pEr, pIp));

    const updatedPlayer = {
      ...target,
      batting: {
        ...(target.batting || createBaseBatting()),
        career: {
          games: Number(b.games || 0),
          atBats: bAb,
          runs: Number(b.runs || 0),
          hits: bHits,
          homeRuns: Number(b.homeRuns || 0),
          rbi: Number(b.rbi || 0),
          walks: Number(b.walks || 0),
          strikeouts: Number(b.strikeouts || 0),
          steals: Number(b.steals || 0),
          errors: Number(b.errors || 0),
          avg: bAvg
        }
      },
      pitching: {
        ...(target.pitching || createBasePitching()),
        career: {
          games: Number(pit.games || 0),
          wins: Number(pit.wins || 0),
          losses: Number(pit.losses || 0),
          saves: Number(pit.saves || 0),
          innings: pIp,
          strikeouts: Number(pit.strikeouts || 0),
          runsAllowed: Number(pit.runsAllowed || 0),
          earnedRuns: pEr,
          hitsAllowed: Number(pit.hitsAllowed || 0),
          walksAllowed: Number(pit.walksAllowed || 0),
          battersFaced: Number(pit.battersFaced || 0),
          era: pEra
        }
      }
    };

    await setDoc(doc(db, 'polaris_players', String(target.id)), updatedPlayer);
    alert(\`\${target.name} 선수 통산 기록 자동 반영 완료\`);
  };

  const handleAutoImportImage = async (e, mode = 'game') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!AUTO_IMPORT_ENDPOINT || !AUTO_IMPORT_ENDPOINT.trim()) {
      alert('VITE_AUTO_IMPORT_ENDPOINT 환경변수를 먼저 설정해주세요.');
      return;
    }

    try {
      setIsAutoImporting(true);
      const imageDataUrl = await resizeImage(file, 2200, 2200);

      const resp = await fetch(AUTO_IMPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, imageDataUrl })
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data?.error || '자동 분석 실패');

      if (mode === 'career') await applyCareerDraftToPlayer(data.draft || {});
      else alert('경기 결과 자동 업로드 완료');
    } catch (err) {
      console.error(err);
      alert(err.message || '자동 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAutoImporting(false);
    }
  };`;

    let old = code;
    code = insertBefore(code, /const\s+getPlayerKey\s*=\s*\(player\)\s*=>/, autoFns, 'auto fn before getPlayerKey');
    if (code === old) {
      old = code;
      code = insertBefore(code, /\/\/\s*-{3,}\s*\n\s*\/\/\s*각 화면 렌더링/, autoFns, 'auto fn before render section');
    }
  }

  // 8) gameRecord 탭 업로드 버튼 UI 삽입
  if (!code.includes('경기 캡처 자동 업로드')) {
    const panel = `            <div className="mb-6 flex flex-wrap items-center gap-3">
              <label className={\`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors \${isAutoImporting ? 'bg-gray-200 text-gray-500' : 'bg-slate-800 hover:bg-black text-white'}\`}>
                {isAutoImporting ? '분석 중...' : '경기 캡처 자동 업로드'}
                <input type="file" accept="image/*" className="hidden" disabled={isAutoImporting} onChange={(e) => handleAutoImportImage(e, 'game')} />
              </label>
              <label className={\`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors \${isAutoImporting ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}\`}>
                {isAutoImporting ? '분석 중...' : '통산 캡처 자동 분석'}
                <input type="file" accept="image/*" className="hidden" disabled={isAutoImporting} onChange={(e) => handleAutoImportImage(e, 'career')} />
              </label>
              <span className="text-xs text-gray-500">경기 결과/선수 통산 캡처 이미지를 업로드하세요.</span>
            </div>`;

    const reCard = /adminSubTab\s*===\s*['"]gameRecord['"]\s*&&\s*\([\s\S]*?<div className="bg-white[^"]*min-h-\[600px\][^"]*">/;
    const m = code.match(reCard);
    if (m) {
      const end = m.index + m[0].length;
      code = code.slice(0, end) + '\n' + panel + code.slice(end);
    } else {
      warn.push('gameRecord 패널 삽입 못함');
    }
  }

  // 9) 자잘한 오타 통합 보정
  code = code.replace(/finishedStatevenue/g, 'finishedState.venue');
  code = code.replace(/newLogsunshift\s*\(/g, 'newLogs.unshift(');
  code = code.replace(/\$\{pwins\}/g, '${p.wins}');
  code = code.replace(/['"]\/background\s*\.?JPG['"]/gi, 'DEFAULT_BG');

  write(APP, code);
}

function patchFunctions() {
  backup(FINDEX);
  const indexCode = `const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const OpenAI = require('openai');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

exports.parseBaseballImage = onRequest(
  { secrets: [OPENAI_API_KEY], cors: true, timeoutSeconds: 120, memory: '1GiB' },
  async (req, res) => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

      const { mode, imageDataUrl } = req.body || {};
      if (!mode || !['game', 'career'].includes(mode)) return res.status(400).json({ ok: false, error: 'mode must be game|career' });
      if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        return res.status(400).json({ ok: false, error: 'imageDataUrl(data URL) required' });
      }

      const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

      const schema = mode === 'game'
        ? {
            name: 'game_extract',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                date: { type: 'string' },
                opponent: { type: 'string' },
                venue: { type: 'string', enum: ['home', 'away'] },
                homeScore: { type: 'number' },
                awayScore: { type: 'number' },
                result: { type: 'string', enum: ['승', '패', '무'] }
              },
              required: ['date', 'opponent', 'venue', 'homeScore', 'awayScore', 'result']
            }
          }
        : {
            name: 'career_extract',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                uniformNumber: { type: 'number' },
                primaryRole: { type: 'string', enum: ['타자', '투수', '투타겸업'] },
                battingCareer: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    games: { type: 'number' },
                    atBats: { type: 'number' },
                    runs: { type: 'number' },
                    hits: { type: 'number' },
                    homeRuns: { type: 'number' },
                    rbi: { type: 'number' },
                    walks: { type: 'number' },
                    strikeouts: { type: 'number' },
                    steals: { type: 'number' },
                    errors: { type: 'number' }
                  },
                  required: ['games','atBats','runs','hits','homeRuns','rbi','walks','strikeouts','steals','errors']
                },
                pitchingCareer: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    games: { type: 'number' },
                    wins: { type: 'number' },
                    losses: { type: 'number' },
                    saves: { type: 'number' },
                    innings: { type: 'string' },
                    strikeouts: { type: 'number' },
                    runsAllowed: { type: 'number' },
                    earnedRuns: { type: 'number' },
                    hitsAllowed: { type: 'number' },
                    walksAllowed: { type: 'number' },
                    battersFaced: { type: 'number' }
                  },
                  required: ['games','wins','losses','saves','innings','strikeouts','runsAllowed','earnedRuns','hitsAllowed','walksAllowed','battersFaced']
                }
              },
              required: ['name','uniformNumber','primaryRole','battingCareer','pitchingCareer']
            }
          };

      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_schema', json_schema: schema },
        messages: [
          { role: 'system', content: '야구 기록 추출기. 보이는 값만 추출하고 애매하면 0. 스키마 준수.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: mode === 'game' ? '경기 결과를 추출해줘.' : '선수 통산 기록을 추출해줘.' },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ]
      });

      const parsed = JSON.parse(completion?.choices?.[0]?.message?.content || '{}');

      if (mode === 'game') {
        const id = Date.now().toString();
        const date = String(parsed.date || new Date().toISOString().slice(0, 10));
        const opponent = String(parsed.opponent || '상대팀');
        const venue = parsed.venue === 'away' ? 'away' : 'home';
        const homeScore = n(parsed.homeScore);
        const awayScore = n(parsed.awayScore);
        const result = ['승', '패', '무'].includes(parsed.result) ? parsed.result : '무';

        const home = venue === 'home' ? '폴라리스' : opponent;
        const away = venue === 'home' ? opponent : '폴라리스';

        const gameDoc = { id, date, opponent, home, away, homeScore, awayScore, result, detail: null };
        await db.collection('polaris_games').doc(id).set(gameDoc);
        return res.json({ ok: true, mode, game: gameDoc });
      }

      return res.json({ ok: true, mode, draft: parsed });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: err?.message || 'parse failed' });
    }
  }
);`;
  write(FINDEX, indexCode);

  if (exists(FPKG)) {
    backup(FPKG);
    const pkg = JSON.parse(read(FPKG));
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies.openai) pkg.dependencies.openai = '^4.103.0';
    if (!pkg.dependencies['firebase-admin']) pkg.dependencies['firebase-admin'] = '^12.7.0';
    if (!pkg.dependencies['firebase-functions']) pkg.dependencies['firebase-functions'] = '^6.0.1';
    write(FPKG, JSON.stringify(pkg, null, 2));
  } else {
    const pkg = {
      name: 'functions',
      private: true,
      engines: { node: '20' },
      main: 'index.js',
      dependencies: {
        openai: '^4.103.0',
        'firebase-admin': '^12.7.0',
        'firebase-functions': '^6.0.1'
      }
    };
    write(FPKG, JSON.stringify(pkg, null, 2));
  }

  if (!exists(ENVEX)) {
    write(ENVEX, "VITE_AUTO_IMPORT_ENDPOINT=https://<REGION>-<PROJECT_ID>.cloudfunctions.net/parseBaseballImage\n");
  }
}

try {
  patchApp();
  patchFunctions();

  console.log('\\n패치 완료 ✅');
  log.forEach((x) => console.log('- ' + x));
  if (warn.length) {
    console.log('\\n수동 확인 필요 ⚠️');
    warn.forEach((x) => console.log('- ' + x));
  }

  console.log('\\n다음 순서:');
  console.log('1) node apply-polaris-automation-patch-v4.cjs');
  console.log('2) npm run dev');
  console.log('3) cd functions && npm i');
  console.log('4) firebase functions:secrets:set OPENAI_API_KEY');
  console.log('5) firebase deploy --only functions:parseBaseballImage');
  console.log('6) .env에 VITE_AUTO_IMPORT_ENDPOINT 설정');
} catch (e) {
  console.error('실패:', e.message);
  process.exit(1);
}
