const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
const functionsDir = path.join(process.cwd(), 'functions');
const functionsIndexPath = path.join(functionsDir, 'index.js');
const functionsPkgPath = path.join(functionsDir, 'package.json');
const envExamplePath = path.join(process.cwd(), '.env.example');

function fail(msg) {
  throw new Error(msg);
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const backupPath = `${filePath}.bak_${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`백업 생성: ${backupPath}`);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`작성 완료: ${filePath}`);
}

function replaceOrThrow(src, re, replacement, label) {
  if (!re.test(src)) fail(`치환 실패(${label}): 패턴을 찾지 못함`);
  return src.replace(re, replacement);
}

function insertAfterLine(src, anchor, insert, label) {
  const idx = src.indexOf(anchor);
  if (idx === -1) fail(`삽입 실패(${label}): anchor를 찾지 못함`);
  const pos = idx + anchor.length;
  return src.slice(0, pos) + '\n' + insert + src.slice(pos);
}

function insertBeforeLine(src, anchor, insert, label) {
  const idx = src.indexOf(anchor);
  if (idx === -1) fail(`삽입 실패(${label}): anchor를 찾지 못함`);
  return src.slice(0, idx) + insert + '\n' + src.slice(idx);
}

(function main() {
  if (!fs.existsSync(appPath)) fail(`파일 없음: ${appPath}`);
  backupFile(appPath);

  let app = fs.readFileSync(appPath, 'utf8');

  // 1) 상수 추가
  if (!app.includes('const DEFAULT_BG =')) {
    app = replaceOrThrow(
      app,
      /const POSITIONS = \[[\s\S]*?\];/,
      (m) =>
        `${m}
const DEFAULT_BG = '/background.JPG';
const AUTO_IMPORT_ENDPOINT = import.meta.env.VITE_AUTO_IMPORT_ENDPOINT || '';`,
      'DEFAULT_BG/AUTO_IMPORT_ENDPOINT 추가'
    );
  }

  // 2) customBackground 초기값 null로
  app = replaceOrThrow(
    app,
    /const\s*\[\s*customBackground\s*,\s*setCustomBackground\s*\]\s*=\s*useState\([^)]*\);/,
    "const [customBackground, setCustomBackground] = useState(null);",
    'customBackground 초기값'
  );

  // 3) landing sync state 추가
  if (!app.includes('const [landingBgLoaded, setLandingBgLoaded]')) {
    app = insertAfterLine(
      app,
      "const [isSettingsFetched, setIsSettingsFetched] = useState(false);",
      "  const [landingBgLoaded, setLandingBgLoaded] = useState(false);\n  const [landingAnimReady, setLandingAnimReady] = useState(false);",
      'landing state'
    );
  }

  // 4) auto import loading state 추가
  if (!app.includes('const [isAutoImporting, setIsAutoImporting]')) {
    app = insertAfterLine(
      app,
      "const [endGameMvp, setEndGameMvp] = useState('');",
      "  const [isAutoImporting, setIsAutoImporting] = useState(false);",
      'isAutoImporting state'
    );
  }

  // 5) settings 구독 블록 교체
  const settingsRe =
    /const\s+unsubSettings\s*=\s*onSnapshot\(\s*collection\(db,\s*['"]polaris_settings['"]\)\s*,\s*\(snap\)\s*=>\s*\{[\s\S]*?setIsSettingsFetched\(true\);\s*\}\s*\);/;
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
  app = replaceOrThrow(app, settingsRe, settingsBlock, 'unsubSettings 교체');

  // 6) preload useEffect 추가
  if (!app.includes('setLandingAnimReady(true)')) {
    const marker = '}, [user]);';
    const idx = app.lastIndexOf(marker);
    if (idx === -1) fail('Firestore useEffect 종료 지점을 찾지 못함');
    const insertPos = idx + marker.length;
    const preloadEffect = `
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
    app = app.slice(0, insertPos) + '\n' + preloadEffect + app.slice(insertPos);
  }

  // 7) landing 렌더 타이밍 조건/이미지 fallback 치환
  app = app.replace(/isSettingsFetched \? 'opacity-100' : 'opacity-0'/g, "landingBgLoaded ? 'opacity-100' : 'opacity-0'");
  app = app.replace(/isSettingsFetched \? 'animate-slide-left' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-left' : 'opacity-0'");
  app = app.replace(/isSettingsFetched \? 'animate-slide-right' : 'opacity-0'/g, "landingAnimReady ? 'animate-slide-right' : 'opacity-0'");
  app = app.replace(/src=\{customBackground\}/g, "src={customBackground || DEFAULT_BG}");

  // 8) reset/default bg 문자열 통일
  app = app.replace(/['"]\/background\s*\.?JPG['"]/gi, 'DEFAULT_BG');

  // 9) auto-import 함수 삽입
  if (!app.includes('const handleAutoImportImage = async')) {
    const autoImportBlock = `
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
      if (!resp.ok || !data.ok) {
        throw new Error(data?.error || '자동 분석 실패');
      }

      if (mode === 'career') {
        await applyCareerDraftToPlayer(data.draft || {});
      } else {
        alert('경기 결과 자동 업로드 완료');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || '자동 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAutoImporting(false);
    }
  };
`;
    app = insertBeforeLine(app, "const getPlayerKey = (player) =>", autoImportBlock, 'auto import 함수');
  }

  // 10) gameRecord UI 버튼 삽입
  if (!app.includes('자동 분석 업로드')) {
    const cardOpenTagRe = /<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-\[600px\]">/;
    const uploadPanel = `<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
            <div className="mb-6 flex flex-wrap items-center gap-3">
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
    app = replaceOrThrow(app, cardOpenTagRe, uploadPanel, 'gameRecord 업로드 패널');
  }

  // 11) 자잘한 오타 보정
  app = app.replace(/finishedStatevenue/g, 'finishedState.venue');
  app = app.replace(/newLogsunshift\s*\(/g, 'newLogs.unshift(');
  app = app.replace(/\$\{pwins\}/g, '${p.wins}');

  writeFile(appPath, app);

  // 12) functions/index.js 생성
  const functionsIndex = `const { onRequest } = require('firebase-functions/v2/https');
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
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'POST only' });
      }

      const { mode, imageDataUrl } = req.body || {};
      if (!mode || !['game', 'career'].includes(mode)) {
        return res.status(400).json({ ok: false, error: 'mode must be game | career' });
      }
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
                  required: ['games', 'atBats', 'runs', 'hits', 'homeRuns', 'rbi', 'walks', 'strikeouts', 'steals', 'errors']
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
                  required: ['games', 'wins', 'losses', 'saves', 'innings', 'strikeouts', 'runsAllowed', 'earnedRuns', 'hitsAllowed', 'walksAllowed', 'battersFaced']
                }
              },
              required: ['name', 'uniformNumber', 'primaryRole', 'battingCareer', 'pitchingCareer']
            }
          };

      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_schema', json_schema: schema },
        messages: [
          {
            role: 'system',
            content:
              '너는 야구 기록 추출기다. 이미지에서 보이는 값만 추출한다. 확신 없는 값은 0으로 채우고, 반드시 JSON 스키마를 지킨다.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: mode === 'game' ? '경기 결과를 추출해줘.' : '선수 통산 기록을 추출해줘.' },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ]
      });

      const raw = completion?.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

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

        const gameDoc = {
          id,
          date,
          opponent,
          home,
          away,
          homeScore,
          awayScore,
          result,
          detail: null
        };

        await db.collection('polaris_games').doc(id).set(gameDoc);
        return res.json({ ok: true, mode, game: gameDoc });
      }

      return res.json({ ok: true, mode, draft: parsed });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: err?.message || 'parse failed' });
    }
  }
);
`;

  if (fs.existsSync(functionsIndexPath)) backupFile(functionsIndexPath);
  writeFile(functionsIndexPath, functionsIndex);

  // 13) functions package.json 의존성 보강
  if (fs.existsSync(functionsPkgPath)) {
    backupFile(functionsPkgPath);
    const pkg = JSON.parse(fs.readFileSync(functionsPkgPath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies.openai) pkg.dependencies.openai = '^4.103.0';
    if (!pkg.dependencies['firebase-admin']) pkg.dependencies['firebase-admin'] = '^12.7.0';
    if (!pkg.dependencies['firebase-functions']) pkg.dependencies['firebase-functions'] = '^6.0.1';
    fs.writeFileSync(functionsPkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('업데이트 완료: functions/package.json');
  } else {
    console.log('주의: functions/package.json이 없어 의존성 자동 보강은 건너뜀');
  }

  // 14) env example
  if (!fs.existsSync(envExamplePath)) {
    writeFile(envExamplePath, "VITE_AUTO_IMPORT_ENDPOINT=https://<REGION>-<PROJECT_ID>.cloudfunctions.net/parseBaseballImage\n");
  }

  console.log('\\n패치 완료 ✅');
  console.log('다음 단계:');
  console.log('1) npm run dev');
  console.log('2) cd functions && npm i');
  console.log('3) firebase functions:secrets:set OPENAI_API_KEY');
  console.log('4) firebase deploy --only functions:parseBaseballImage');
  console.log('5) 프론트 .env에 VITE_AUTO_IMPORT_ENDPOINT 설정');
})();
