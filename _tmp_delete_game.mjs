// 오늘(7/5) 충북대 의대 경기 삭제 + 스탯 롤백 — 앱 deleteGame 로직을 그대로 복제
// 실행: node _tmp_delete_game.mjs         (DRY: 변경안함, 계획만 출력)
//       node _tmp_delete_game.mjs commit  (실제 커밋)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';

const COMMIT = process.argv[2] === 'commit';
const TARGET_GAME_ID = '1783229697534'; // 2026-07-05 충북대 의대 14:3 폴라리스

const firebaseConfig = {
  apiKey: "AIzaSyACJx4P4OkcGp8y1Ym4LZHvC6LTgAM_aEs",
  authDomain: "polaris-8a991.firebaseapp.com",
  projectId: "polaris-8a991",
  storageBucket: "polaris-8a991.firebasestorage.app",
  messagingSenderId: "885335820774",
  appId: "1:885335820774:web:b6bbdbe7e5ad0ab0aeee27",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== App.jsx에서 그대로 복제한 헬퍼 =====
const calculateBattingAverage = (hits, atBats) => atBats > 0 ? (hits / atBats).toFixed(3) : '0.000';
const parseBaseballInningsToOuts = (v) => { const raw = String(v ?? 0); if (!raw.includes('.')) return (parseInt(raw,10)||0)*3; const [w,d]=raw.split('.'); return ((parseInt(w,10)||0)*3)+(parseInt(d,10)||0); };
const outsToBaseballInnings = (outs) => `${Math.floor((outs||0)/3)}.${(outs||0)%3}`;
const calculateEra = (er, iou) => { const outs = Number.isInteger(iou)?iou:parseBaseballInningsToOuts(iou); const ip=outs/3; if(ip<=0)return '0.00'; return ((er*9)/ip).toFixed(2); };
const createBaseBatting = () => ({ games:0,atBats:0,runs:0,hits:0,singles:0,doubles:0,triples:0,homeRuns:0,rbi:0,walks:0,hitByPitch:0,strikeouts:0,steals:0,caughtStealing:0,sacFlies:0,sacBunts:0,errors:0,putouts:0,assists:0,avg:'0.000',career:{} });
const createBasePitching = () => ({ games:0,wins:0,losses:0,saves:0,innings:0,strikeouts:0,runsAllowed:0,earnedRuns:0,hitsAllowed:0,walksAllowed:0,hitByPitch:0,wildPitches:0,battersFaced:0,era:'0.00',career:{} });
const BATTER_COUNT_KEYS = ['atBats','hits','singles','doubles','triples','homeRuns','rbi','runs','walks','hitByPitch','strikeouts','steals','caughtStealing','sacrifices','sacFlies','sacBunts','errors','putouts','assists'];
const PITCH_COUNT_KEYS = ['strikeouts','runsAllowed','earnedRuns','hitsAllowed','walksAllowed','hitByPitch','wildPitches','battersFaced'];

await signInAnonymously(auth);

const gameSnap = await getDoc(doc(db, 'polaris_games', TARGET_GAME_ID));
if (!gameSnap.exists()) { console.log('❌ 대상 경기가 이미 없습니다.'); process.exit(1); }
const game = gameSnap.data();
console.log(`대상 경기: ${game.date} | ${game.away} ${game.awayScore}:${game.homeScore} ${game.home} | result=${game.result}`);

const playersSnap = await getDocs(collection(db, 'polaris_players'));
const players = playersSnap.docs.map(d => d.data());

const batch = writeBatch(db);
const gameYear = (game.date || '').slice(0,4);
const batterEntries = [...(game.detail.lineup||[]), ...(game.detail.lineupB||[])];
const pitcherEntries = [...(game.detail.pitchers||[]), ...(game.detail.pitchersB||[])];
const decisions = game.detail.decisions || null;

const subtractBatting = (target, entry) => {
  BATTER_COUNT_KEYS.forEach(k => { target[k] = Math.max(0,(target[k]||0)-(entry[k]||0)); });
  target.games = Math.max(0,(target.games||0)-((entry.pa||0)>0?1:0));
  target.avg = String(calculateBattingAverage(target.hits||0, target.atBats||0));
};
const subtractPitching = (target, entry, wins, losses, saves) => {
  const newOuts = Math.max(0, parseBaseballInningsToOuts(target.innings||0)-(entry.inningsOuts||0));
  target.games = Math.max(0,(target.games||0)-1);
  target.wins = Math.max(0,(target.wins||0)-wins);
  target.losses = Math.max(0,(target.losses||0)-losses);
  target.saves = Math.max(0,(target.saves||0)-saves);
  target.innings = String(outsToBaseballInnings(newOuts));
  PITCH_COUNT_KEYS.forEach(k => { target[k] = Math.max(0,(target[k]||0)-(entry[k]||0)); });
  target.era = String(calculateEra(target.earnedRuns||0, newOuts));
};

let anyChange = false;
for (const p of players) {
  let changed = false;
  const updated = { ...p, batting:{...(p.batting||createBaseBatting())}, pitching:{...(p.pitching||createBasePitching())}, yearlyStats:{...(p.yearlyStats||{})} };
  const hasYearly = gameYear && updated.yearlyStats[gameYear];
  if (hasYearly) updated.yearlyStats[gameYear] = { batting:{...(updated.yearlyStats[gameYear].batting||createBaseBatting())}, pitching:{...(updated.yearlyStats[gameYear].pitching||createBasePitching())} };

  const matchesBatter = (e) => (e.id!=null && String(e.id)===String(p.id)) || (e.id==null && e.name===p.name && e.uniformNumber===p.uniformNumber);
  const matchesPitcher = (e) => (e.pitcherId!=null && String(e.pitcherId)===String(p.id)) || (e.pitcherId==null && e.name===p.name && e.uniformNumber===p.uniformNumber);

  const myBatterEntries = batterEntries.filter(matchesBatter);
  if (myBatterEntries.length > 0) {
    const merged = { pa: 0 };
    myBatterEntries.forEach((entry) => { merged.pa += entry.pa||0; BATTER_COUNT_KEYS.forEach(k => { merged[k]=(merged[k]||0)+(entry[k]||0); }); });
    console.log(`\n[타격 롤백] ${p.name}: 경기 ${updated.batting.games}→${Math.max(0,updated.batting.games-((merged.pa||0)>0?1:0))}, 타수 ${updated.batting.atBats}→${Math.max(0,updated.batting.atBats-(merged.atBats||0))}, 안타 ${updated.batting.hits}→${Math.max(0,updated.batting.hits-(merged.hits||0))}`);
    subtractBatting(updated.batting, merged);
    if (hasYearly) subtractBatting(updated.yearlyStats[gameYear].batting, merged);
    changed = true;
  }

  const myPitcherEntries = pitcherEntries.filter(matchesPitcher);
  myPitcherEntries.forEach((entry, entryIdx) => {
    let wins=0, losses=0, saves=0;
    if (entryIdx === 0) {
      if (decisions) {
        if (decisions.win!=null && String(decisions.win)===String(p.id)) wins=1;
        if (decisions.lose!=null && String(decisions.lose)===String(p.id)) losses=1;
        if (decisions.save!=null && String(decisions.save)===String(p.id)) saves=1;
      } else if (game.detail.pitchers?.[0] && matchesPitcher(game.detail.pitchers[0])) {
        if (game.result==='승') wins=1;
        else if (game.result==='패') losses=1;
        else if (game.home==='백팀') { const a=Number(game.awayScore||0),h=Number(game.homeScore||0); if(a>h)wins=1; else if(h>a)losses=1; }
      }
    }
    console.log(`[투구 롤백] ${p.name}: 경기 ${updated.pitching.games}→${Math.max(0,updated.pitching.games-1)}, 이닝 ${updated.pitching.innings}, 실점 ${updated.pitching.runsAllowed}→${Math.max(0,updated.pitching.runsAllowed-(entry.runsAllowed||0))} | W-${wins} L-${losses} S-${saves}`);
    subtractPitching(updated.pitching, entry, wins, losses, saves);
    if (hasYearly) subtractPitching(updated.yearlyStats[gameYear].pitching, entry, wins, losses, saves);
    changed = true;
  });

  if (changed) { anyChange = true; if (COMMIT) batch.set(doc(db,'polaris_players',p.id.toString()), updated); }
}

if (!anyChange) console.log('\n(영향받는 선수 없음)');

if (COMMIT) {
  batch.delete(doc(db,'polaris_games', TARGET_GAME_ID));
  await batch.commit();
  console.log('\n✅ 커밋 완료: 경기 삭제 + 스탯 롤백 반영됨');
} else {
  console.log('\n🔎 DRY RUN — 실제로는 아무것도 변경하지 않았습니다. 커밋하려면 `commit` 인자와 함께 재실행.');
}
process.exit(0);
