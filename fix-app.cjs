const fs = require('fs');

const filePath = 'src/App.jsx'; // 필요하면 경로 수정
if (!fs.existsSync(filePath)) {
  throw new Error(`파일을 찾을 수 없음: ${filePath}`);
}

let code = fs.readFileSync(filePath, 'utf8');

const startRe = /const\s+finalizeAndPersistGameStats\s*=\s*async\s*\(\s*finishedState\s*,\s*mvpId\s*\)\s*=>\s*\{/;
const startMatch = code.match(startRe);
if (!startMatch) {
  throw new Error('finalizeAndPersistGameStats 시작점을 찾지 못했습니다.');
}
const startIdx = startMatch.index;

const endMarker = 'const confirmEndGame = () => {';
const endIdx = code.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  throw new Error('confirmEndGame 시작점을 찾지 못했습니다.');
}

const newFinalizeFn = `
const finalizeAndPersistGameStats = async (finishedState, mvpId) => {
  if (!finishedState || !user) return;

  const gameDate = finishedState.gameDate || new Date().toISOString().slice(0, 10);
  const gameYear = gameDate.slice(0, 4);

  const isRegular = finishedState.mode === 'regular_play';
  const polarisTeamKey = isRegular ? (finishedState.venue === 'home' ? 'teamB' : 'teamA') : null;
  const opponentTeamKey = isRegular ? (polarisTeamKey === 'teamA' ? 'teamB' : 'teamA') : null;

  const winningTeamKey =
    finishedState.teamA.score > finishedState.teamB.score
      ? 'teamA'
      : finishedState.teamB.score > finishedState.teamA.score
        ? 'teamB'
        : null;

  const losingTeamKey =
    winningTeamKey === 'teamA' ? 'teamB' : winningTeamKey === 'teamB' ? 'teamA' : null;

  const shouldApplySeason = (teamKey) => {
    if (!isRegular) return true;
    return teamKey === polarisTeamKey;
  };

  for (const player of players) {
    const next = {
      ...player,
      batting: { ...(player.batting || createBaseBatting()) },
      pitching: { ...(player.pitching || createBasePitching()) },
      yearlyStats: { ...(player.yearlyStats || {}) }
    };

    if (!next.yearlyStats[gameYear]) {
      next.yearlyStats[gameYear] = {
        batting: createBaseBatting(),
        pitching: createBasePitching()
      };
    } else {
      next.yearlyStats[gameYear] = {
        batting: { ...(next.yearlyStats[gameYear].batting || createBaseBatting()) },
        pitching: { ...(next.yearlyStats[gameYear].pitching || createBasePitching()) }
      };
    }

    let changed = false;

    for (const teamKey of ['teamA', 'teamB']) {
      if (!shouldApplySeason(teamKey)) continue;

      const lineup = finishedState?.[teamKey]?.lineup || [];
      const foundBatter = lineup.find((lp) => String(lp.id) === String(player.id));

      if (foundBatter?.gameStats) {
        next.batting = updateBatterSeasonStats(next.batting, foundBatter.gameStats);
        next.yearlyStats[gameYear].batting = updateBatterSeasonStats(
          next.yearlyStats[gameYear].batting,
          foundBatter.gameStats
        );
        changed = true;
      }

      const appearances = finishedState?.[teamKey]?.pitcherAppearances || [];
      appearances.forEach((app, idx) => {
        if (String(app.pitcherId) !== String(player.id)) return;

        const isWinningPitcher = winningTeamKey === teamKey && idx === 0;
        const isLosingPitcher = losingTeamKey === teamKey && idx === 0;

        next.pitching = updatePitcherSeasonStats(
          next.pitching,
          app.stats || {},
          isWinningPitcher,
          isLosingPitcher
        );

        next.yearlyStats[gameYear].pitching = updatePitcherSeasonStats(
          next.yearlyStats[gameYear].pitching,
          app.stats || {},
          isWinningPitcher,
          isLosingPitcher
        );

        changed = true;
      });
    }

    if (changed) {
      await setDoc(doc(db, 'polaris_players', String(player.id)), next);
    }
  }

  const opponentName = isRegular ? (finishedState.opponentName?.trim() || '상대팀') : '자체 청백전';
  const home = isRegular ? (finishedState.venue === 'home' ? '폴라리스' : opponentName) : '백팀';
  const away = isRegular ? (finishedState.venue === 'home' ? opponentName : '폴라리스') : '청팀';
  const homeScore = Number(finishedState.teamB?.score || 0);
  const awayScore = Number(finishedState.teamA?.score || 0);

  let result = '-';
  if (isRegular) {
    const polarisScore = finishedState.venue === 'home' ? homeScore : awayScore;
    const oppScore = finishedState.venue === 'home' ? awayScore : homeScore;
    result = polarisScore > oppScore ? '승' : polarisScore < oppScore ? '패' : '무';
  }

  const viewTeamKey = isRegular ? polarisTeamKey : 'teamA';
  const enemyViewKey = isRegular ? opponentTeamKey : 'teamB';

  const polarisSummary = finishedState.summary?.[viewTeamKey] || {};
  const opponentSummary = finishedState.summary?.[enemyViewKey] || {};
  const polarisPitcher = finishedState?.[viewTeamKey]?.pitcher || null;
  const polarisPitcherStats = finishedState?.[viewTeamKey]?.pitcherGameStats || {};

  const polarisPitchers = (finishedState?.[viewTeamKey]?.pitcherAppearances || []).map((app) => ({
    name: app.pitcherName,
    uniformNumber: app.uniformNumber,
    ...(app.stats || {})
  }));

  const detailPayload = {
    inningScores: finishedState.inningScores || {},
    summary: finishedState.summary || {},
    opponentName,
    venue: finishedState.venue,
    playEvents: finishedState.playEvents || [],
    lineup: (finishedState?.[viewTeamKey]?.lineup || []).map((pl, index) => ({
      id: pl.id,
      order: index + 1,
      position: pl.assignedPosition || pl.position || '미정',
      name: pl.name,
      uniformNumber: pl.uniformNumber,
      ...(pl.gameStats || {}),
      seasonAvg: pl.avg || '0.000'
    })),
    pitcher: {
      name: polarisPitcher?.name || '',
      uniformNumber: polarisPitcher?.uniformNumber || '',
      ...polarisPitcherStats
    },
    pitchers: polarisPitchers,
    officials: { recorder: 'Polaris Record Mode' },
    scoreboard: {
      polaris: isRegular ? (finishedState.venue === 'home' ? homeScore : awayScore) : awayScore,
      opponent: isRegular ? (finishedState.venue === 'home' ? awayScore : homeScore) : homeScore,
      home,
      away,
      homeScore,
      awayScore
    },
    statBars: [
      { label: '안타', left: opponentSummary.hits || 0, right: polarisSummary.hits || 0 },
      { label: '홈런', left: opponentSummary.homeRuns || 0, right: polarisSummary.homeRuns || 0 },
      { label: '도루', left: opponentSummary.steals || 0, right: polarisSummary.steals || 0 },
      { label: '삼진', left: opponentSummary.strikeouts || 0, right: polarisSummary.strikeouts || 0 },
      { label: '실책', left: opponentSummary.errors || 0, right: polarisSummary.errors || 0 },
      { label: '사사구', left: opponentSummary.walks || 0, right: polarisSummary.walks || 0 }
    ],
    mvpId: mvpId || null
  };

  const newGameId = Date.now().toString();
  const newGame = {
    id: newGameId,
    date: gameDate,
    opponent: opponentName,
    home,
    away,
    homeScore,
    awayScore,
    result,
    detail: detailPayload
  };

  await setDoc(doc(db, 'polaris_games', newGameId), newGame);
  setActiveTab('records');
};
`;

const backupPath = filePath + '.bak';
fs.writeFileSync(backupPath, code, 'utf8');

code = code.slice(0, startIdx) + newFinalizeFn + '\n\n' + code.slice(endIdx);

// 추가 오타 수정
code = code.split('finishedStatevenue').join('finishedState.venue');
code = code.replace(/newLogsunshift\s*\(/g, 'newLogs.unshift(');
code = code.split('${pwins}').join('${p.wins}');

fs.writeFileSync(filePath, code, 'utf8');

console.log(`수정 완료: ${filePath}`);
console.log(`백업 생성: ${backupPath}`);
