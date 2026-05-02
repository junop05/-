import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Users, Activity, Plus, Trophy, X, Shirt, Calendar, Camera, Trash2, PlayCircle, Settings, ClipboardList, RefreshCw, BarChart3, FastForward, ArrowLeft, Lock, Image as ImageIcon, ZoomIn, ZoomOut, Save } from 'lucide-react';

const POSITIONS = ['투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('batter');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [runnerActionBase, setRunnerActionBase] = useState(null);
  const [detailTab, setDetailTab] = useState('summary');

  // 관리자 인증 상태 (비밀번호: 1982)
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');

  const currentSeasonYear = new Date().getFullYear();
  const seasonLabel = `${currentSeasonYear}시즌`;
  const MEDIA_DB_NAME = 'polaris-media-db';
  const MEDIA_STORE_NAME = 'media';

  const [manualBaseAssign, setManualBaseAssign] = useState(null);
  const [galleryPosts, setGalleryPosts] = useState([]);
  const [playerPhotos, setPlayerPhotos] = useState({});
  const [selectedGameResult, setSelectedGameResult] = useState(null);
  
  const [customBackground, setCustomBackground] = useState('/background.JPG');
  
  // 크롭 방식 배경화면 상태 (배율 및 X, Y 퍼센트)
  const [bgSettings, setBgSettings] = useState({ scale: 1, posX: 50, posY: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchDist, setPinchDist] = useState(null);
  const bgContainerRef = useRef(null);

  const [batters, setBatters] = useState([
    { id: 1, name: '김타자', uniformNumber: 15, position: '중견수', games: 120, atBats: 400, runs: 80, hits: 120, homeRuns: 20, rbi: 75, walks: 0, steals: 0, errors: 0, avg: '0.300', career: { games: 580, atBats: 1900, runs: 350, hits: 540, homeRuns: 85, rbi: 320, avg: '0.284' } },
    { id: 2, name: '이거포', uniformNumber: 52, position: '1루수', games: 115, atBats: 380, runs: 65, hits: 95, homeRuns: 30, rbi: 90, walks: 0, steals: 0, errors: 0, avg: '0.250', career: { games: 450, atBats: 1500, runs: 240, hits: 380, homeRuns: 105, rbi: 320, avg: '0.253' } },
    { id: 3, name: '박교타', uniformNumber: 7, position: '유격수', games: 130, atBats: 450, runs: 90, hits: 150, homeRuns: 5, rbi: 45, walks: 0, steals: 0, errors: 0, avg: '0.333', career: { games: 720, atBats: 2400, runs: 480, hits: 770, homeRuns: 25, rbi: 220, avg: '0.321' } },
  ]);

  const [pitchers, setPitchers] = useState([
    { id: 1, name: '최에이스', uniformNumber: 1, position: '선발투수', games: 25, wins: 15, losses: 5, saves: 0, innings: 160, strikeouts: 150, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 0, era: '2.45', career: { games: 130, wins: 65, losses: 35, saves: 2, innings: 850, strikeouts: 780, era: '2.78' } },
    { id: 2, name: '정마무리', uniformNumber: 21, position: '마무리투수', games: 50, wins: 3, losses: 2, saves: 30, innings: 55, strikeouts: 60, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 0, era: '1.85', career: { games: 280, wins: 18, losses: 15, saves: 145, innings: 310, strikeouts: 350, era: '2.10' } },
  ]);

  const allPlayers = useMemo(() => ([
    ...batters.map(b => ({ ...b, type: '타자' })),
    ...pitchers.map(p => ({ ...p, type: '투수' }))
  ].sort((a, b) => a.uniformNumber - b.uniformNumber)), [batters, pitchers]);

  const [gameResults, setGameResults] = useState([]);

  const [formData, setFormData] = useState({
    name: '', uniformNumber: '', position: '',
    games: '', atBats: '', runs: '', hits: '', homeRuns: '', rbi: '',
    wins: '', losses: '', saves: '', innings: '', strikeouts: '', era: ''
  });

  const [gameState, setGameState] = useState(null);
  const [changingPitcherTeam, setChangingPitcherTeam] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = () => {
    if (adminPwd === '1982') {
      setIsAdminAuth(true);
      setAdminPwd('');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
      setAdminPwd('');
    }
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (modalType === 'batter') {
      const hits = parseInt(formData.hits) || 0;
      const atBats = parseInt(formData.atBats) || 0;
      const avg = atBats > 0 ? (hits / atBats).toFixed(3) : '0.000';

      const newBatter = {
        id: batters.length + 1,
        name: formData.name,
        uniformNumber: parseInt(formData.uniformNumber) || 0,
        position: formData.position || '미정',
        games: parseInt(formData.games) || 0,
        atBats: atBats,
        runs: parseInt(formData.runs) || 0,
        hits: hits,
        homeRuns: parseInt(formData.homeRuns) || 0,
        rbi: parseInt(formData.rbi) || 0,
        avg: avg,
        career: { games: 0, atBats: 0, runs: 0, hits: 0, homeRuns: 0, rbi: 0, avg: '0.000' }
      };
      setBatters([...batters, newBatter]);
    } else {
      const newPitcher = {
        id: pitchers.length + 1,
        name: formData.name,
        uniformNumber: parseInt(formData.uniformNumber) || 0,
        position: formData.position || '미정',
        games: parseInt(formData.games) || 0,
        wins: parseInt(formData.wins) || 0,
        losses: parseInt(formData.losses) || 0,
        saves: parseInt(formData.saves) || 0,
        innings: parseInt(formData.innings) || 0,
        strikeouts: parseInt(formData.strikeouts) || 0,
        era: formData.era || '0.00',
        career: { games: 0, wins: 0, losses: 0, saves: 0, innings: 0, strikeouts: 0, era: '0.00' }
      };
      setPitchers([...pitchers, newPitcher]);
    }
    setShowAddModal(false);
    setFormData({
      name: '', uniformNumber: '', position: '',
      games: '', atBats: '', runs: '', hits: '', homeRuns: '', rbi: '',
      wins: '', losses: '', saves: '', innings: '', strikeouts: '', era: ''
    });
  };

  const handleDeleteBatter = (id) => {
    if (window.confirm('정말로 이 타자 기록을 삭제하시겠습니까?')) {
      setBatters(batters.filter(batter => batter.id !== id));
    }
  };

  const handleDeletePitcher = (id) => {
    if (window.confirm('정말로 이 투수 기록을 삭제하시겠습니까?')) {
      setPitchers(pitchers.filter(pitcher => pitcher.id !== id));
    }
  };

  // ----------------------------------------------------
  // 배경 화면 설정 및 조작 관련 로직
  // ----------------------------------------------------
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await fileToDataUrl(file);
      setCustomBackground(imageUrl);
      setBgSettings({ scale: 1, posX: 50, posY: 50 }); // 새 이미지 업로드 시 중앙, 1배율 초기화
      await putMediaItem({
        key: 'background:current',
        type: 'background',
        imageUrl,
        settings: { scale: 1, posX: 50, posY: 50 },
        updatedAt: Date.now()
      });
      alert('새로운 배경 사진이 업로드되었습니다. 위치와 크기를 조절한 후 저장해주세요.');
    } catch (error) {
      console.error('배경 화면 저장 실패', error);
      alert('배경 화면 저장 중 오류가 발생했습니다.');
    }
    e.target.value = '';
  };

  const saveBackgroundSettings = async () => {
    await putMediaItem({
      key: 'background:current',
      type: 'background',
      imageUrl: customBackground,
      settings: bgSettings,
      updatedAt: Date.now()
    });
    alert('배경 화면 위치 및 크기가 성공적으로 저장되었습니다.');
  };

  const resetBackground = async () => {
    const defaultSettings = { scale: 1, posX: 50, posY: 50 };
    setCustomBackground('/background.JPG');
    setBgSettings(defaultSettings);
    await putMediaItem({
      key: 'background:current',
      type: 'background',
      imageUrl: '/background.JPG',
      settings: defaultSettings,
      updatedAt: Date.now()
    });
  };

  // 최소 1배율 고정 (회색 테두리 방지)
  const handleZoomIn = () => setBgSettings(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5) }));
  const handleZoomOut = () => setBgSettings(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 1) }));

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setPinchDist(dist);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchDist !== null) {
      // 핀치 줌
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist - pinchDist;
      setBgSettings(prev => ({ ...prev, scale: Math.max(1, Math.min(prev.scale + delta * 0.01, 5)) }));
      setPinchDist(dist);
    } else if (e.touches.length === 1 && isDragging && bgContainerRef.current) {
      // 위치 드래그
      const { width, height } = bgContainerRef.current.getBoundingClientRect();
      const moveX = ((e.touches[0].clientX - dragStart.x) / width) * 100 / bgSettings.scale;
      const moveY = ((e.touches[0].clientY - dragStart.y) / height) * 100 / bgSettings.scale;
      
      setBgSettings(prev => ({
        ...prev,
        posX: Math.min(Math.max(prev.posX - moveX, 0), 100),
        posY: Math.min(Math.max(prev.posY - moveY, 0), 100)
      }));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPinchDist(null);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !bgContainerRef.current) return;
    const { width, height } = bgContainerRef.current.getBoundingClientRect();
    const moveX = ((e.clientX - dragStart.x) / width) * 100 / bgSettings.scale;
    const moveY = ((e.clientY - dragStart.y) / height) * 100 / bgSettings.scale;

    setBgSettings(prev => ({
      ...prev,
      posX: Math.min(Math.max(prev.posX - moveX, 0), 100),
      posY: Math.min(Math.max(prev.posY - moveY, 0), 100)
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ----------------------------------------------------
  // 경기 기록 모드 로직
  // ----------------------------------------------------
  const startScrimmageSetup = () => {
    setGameState({
      mode: 'scrimmage_setup',
      teamA: {
        name: '청팀 (Away/선공)',
        pitcherId: '',
        lineup: Array.from({ length: 9 }, () => ({ playerId: '', assignedPosition: '' })),
        score: 0,
        batterIndex: 0
      },
      teamB: {
        name: '백팀 (Home/후공)',
        pitcherId: '',
        lineup: Array.from({ length: 9 }, () => ({ playerId: '', assignedPosition: '' })),
        score: 0,
        batterIndex: 0
      },
      inning: 1,
      half: 'top',
      outs: 0,
      bases: [null, null, null],
      logs: []
    });
  };

  const startRegularSetup = () => {
    setGameState({
      mode: 'regular_setup',
      venue: 'home',
      opponentName: '상대팀',
      teamA: {
        name: '상대팀 (Away/선공)',
        pitcherId: '',
        lineup: Array.from({ length: 9 }, () => ({ playerId: '', assignedPosition: '' })),
        score: 0,
        batterIndex: 0
      },
      teamB: {
        name: '폴라리스 (Home/후공)',
        pitcherId: '',
        lineup: Array.from({ length: 9 }, () => ({ playerId: '', assignedPosition: '' })),
        score: 0,
        batterIndex: 0
      },
      inning: 1,
      half: 'top',
      outs: 0,
      bases: [null, null, null],
      logs: []
    });
  };

  const handlePitcherChange = (team, value) => {
    setGameState(prev => ({
      ...prev,
      [team]: { ...prev[team], pitcherId: value }
    }));
  };

  const handleLineupChange = (team, index, field, value) => {
    setGameState(prev => {
      const newLineup = [...prev[team].lineup];
      newLineup[index] = { ...newLineup[index], [field]: value };
      return {
        ...prev,
        [team]: { ...prev[team], lineup: newLineup }
      };
    });
  };

  const addLineupSlot = (team) => {
    setGameState(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        lineup: [...prev[team].lineup, { playerId: '', assignedPosition: '' }]
      }
    }));
  };

  const removeLineupSlot = (team, index) => {
    setGameState(prev => {
      const newLineup = [...prev[team].lineup];
      newLineup.splice(index, 1);
      return {
        ...prev,
        [team]: { ...prev[team], lineup: newLineup }
      };
    });
  };

  const handleRegularMetaChange = (field, value) => {
    setGameState(prev => {
      if (!prev || prev.mode !== 'regular_setup') return prev;

      const nextOpponentName = field === 'opponentName' ? value : prev.opponentName;
      const nextVenue = field === 'venue' ? value : prev.venue;
      const cleanOpponentName = nextOpponentName.trim() || '상대팀';

      return {
        ...prev,
        opponentName: nextOpponentName,
        venue: nextVenue,
        teamA: {
          ...prev.teamA,
          name: nextVenue === 'home' ? `${cleanOpponentName} (Away/선공)` : '폴라리스 (Away/선공)'
        },
        teamB: {
          ...prev.teamB,
          name: nextVenue === 'home' ? '폴라리스 (Home/후공)' : `${cleanOpponentName} (Home/후공)`
        }
      };
    });
  };

  const startGame = () => {
    let hasError = false;
    const newTeams = {};

    for (const team of ['teamA', 'teamB']) {
      if (!gameState[team].pitcherId) {
        alert(`${gameState[team].name}의 선발 투수를 선택해주세요.`);
        hasError = true;
        break;
      }

      const pitcherRawId = gameState[team].pitcherId.replace('p-', '');
      const pitcher = pitchers.find(p => p.id.toString() === pitcherRawId);

      if (!pitcher) {
        alert(`${gameState[team].name} 투수 정보 오류가 발생했습니다.`);
        hasError = true;
        break;
      }

      const validBatters = gameState[team].lineup.filter(b => b.playerId !== '');
      if (validBatters.length === 0) {
        alert(`${gameState[team].name}의 타자를 최소 1명 이상 선택해주세요.`);
        hasError = true;
        break;
      }

      const mappedLineup = validBatters.map(b => {
        const isPitcher = b.playerId.startsWith('p-');
        const rawId = b.playerId.replace(/^[bp]-/, '');
        const playerPool = isPitcher ? pitchers : batters;
        const player = playerPool.find(p => p.id.toString() === rawId);

        return {
          ...player,
          assignedPosition: b.assignedPosition || (player ? player.position : '미정')
        };
      });

      newTeams[team] = {
        ...gameState[team],
        pitcher: pitcher,
        lineup: mappedLineup
      };
    }

    if (hasError) return;

    setGameState(normalizeGameStateForTracking({
      ...gameState,
      teamA: newTeams.teamA,
      teamB: newTeams.teamB,
      mode: gameState.mode === 'regular_setup' ? 'regular_play' : 'scrimmage_play'
    }));
  };

  const executePitcherChange = (teamKey, newPitcherIdRaw) => {
    if (!newPitcherIdRaw) {
      setChangingPitcherTeam(null);
      return;
    }
    const rawId = newPitcherIdRaw.replace('p-', '');
    const newPitcher = pitchers.find(p => p.id.toString() === rawId);
    if (newPitcher) {
      setGameState(prev => {
        const safePrev = normalizeGameStateForTracking(prev);
        let newLogs = [...safePrev.logs];
        newLogs.unshift(`[투수 교체] ${safePrev[teamKey].name} : ${safePrev[teamKey].pitcher.name} → ${newPitcher.name}`);
        return {
          ...safePrev,
          logs: newLogs,
          [teamKey]: {
            ...safePrev[teamKey],
            pitcher: newPitcher,
            pitcherId: newPitcherIdRaw,
            pitcherAppearances: [
              ...safePrev[teamKey].pitcherAppearances,
              {
                pitcherId: newPitcher.id,
                pitcherName: newPitcher.name,
                uniformNumber: newPitcher.uniformNumber,
                stats: { inningsOuts: 0, strikeouts: 0, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 0, errorRuns: 0 }
              }
            ]
          }
        };
      });
    }
    setChangingPitcherTeam(null);
  };

  const handleRunnerAction = (baseIndex, actionType) => {
    setRunnerActionBase(null);
    setGameState(prev => {
      let state = normalizeGameStateForTracking(prev);
      let newBases = [...state.bases];
      const battingTeam = state.half === 'top' ? 'teamA' : 'teamB';
      const defenseTeam = state.half === 'top' ? 'teamB' : 'teamA';
      let newScore = state[battingTeam].score;
      let newLogs = [...state.logs];
      let newPlayEvents = [...state.playEvents];
      let runsScored = 0;
      let newOuts = state.outs;
      let earnedRunsToPitcher = 0;
      let runsToPitcher = 0;

      const baseName = baseIndex === 0 ? '1루' : baseIndex === 1 ? '2루' : '3루';
      const runnerObj = newBases[baseIndex];
      const runnerName = runnerObj?.name;

      if (actionType === '주루사') {
        newBases[baseIndex] = null;
        newOuts += 1;
        newLogs.unshift(`[${state.inning}회${state.half === 'top' ? '초' : '말'}] ${baseName} 주자(${runnerName}) 주루사 - 아웃`);
        newPlayEvents.unshift(`${baseName} 주자 ${runnerName} 주루사`);
      } else {
        for (let i = 2; i >= baseIndex; i--) {
          if (newBases[i]) {
            if (i === 2) {
              runsScored++;
              runsToPitcher++;
              if (newBases[i].isEarned) earnedRunsToPitcher++;
              newBases[i] = null;
            } else {
              newBases[i + 1] = newBases[i];
              newBases[i] = null;
            }
          }
        }
        newScore += runsScored;
        newLogs.unshift(`[${state.inning}회${state.half === 'top' ? '초' : '말'}] ${baseName} 주자(${runnerName}) ${actionType}로 진루${runsScored > 0 ? ` (+${runsScored}득점)` : ''}`);
        newPlayEvents.unshift(`${baseName} 주자 ${runnerName} ${actionType}`);

        const nextTeam = {
          ...state[battingTeam],
          lineup: state[battingTeam].lineup.map(player => player.name === runnerName ? {
            ...player,
            gameStats: {
              ...player.gameStats,
              steals: (player.gameStats.steals || 0) + (actionType === '도루' ? 1 : 0),
              runs: (player.gameStats.runs || 0) + (runsScored > 0 ? 1 : 0)
            }
          } : player)
        };
        state = { ...state, [battingTeam]: nextTeam };
      }

      state = {
        ...state,
        bases: newBases,
        outs: newOuts,
        logs: newLogs,
        playEvents: newPlayEvents,
        [battingTeam]: {
          ...state[battingTeam],
          score: newScore
        },
        summary: {
          ...state.summary,
          [battingTeam]: {
            ...state.summary[battingTeam],
            steals: (state.summary[battingTeam]?.steals || 0) + (actionType === '도루' ? 1 : 0)
          }
        }
      };

      if (runsToPitcher > 0 && runnerObj?.respPitcher) {
        state = addPitcherRuns(state, defenseTeam, runnerObj.respPitcher, runsToPitcher, earnedRunsToPitcher);
      }

      state = advanceInningScore(state, battingTeam, runsScored);

      let newInning = state.inning;
      let newHalf = state.half;
      let finalBases = state.bases;
      if (state.outs >= 3) {
        newLogs.unshift(`[${newInning}회${state.half === 'top' ? '초' : '말'} 종료] 쓰리아웃 공수교대`);
        if (newHalf === 'top') newHalf = 'bottom';
        else { newHalf = 'top'; newInning += 1; }
        finalBases = [null, null, null];
        return { ...state, inning: newInning, half: newHalf, outs: 0, bases: finalBases, logs: newLogs };
      }

      return state;
    });
  };

  const addPitcherRuns = (state, defenseTeam, pitcherId, runs, earned) => {
    const nextState = { ...state };
    nextState[defenseTeam].pitcherAppearances = nextState[defenseTeam].pitcherAppearances.map(app => {
      if (app.pitcherId === pitcherId) {
        return {
          ...app,
          stats: {
            ...app.stats,
            runsAllowed: (app.stats.runsAllowed || 0) + runs,
            earnedRuns: (app.stats.earnedRuns || 0) + earned
          }
        };
      }
      return app;
    });
    nextState[defenseTeam].pitcherGameStats.runsAllowed += runs;
    nextState[defenseTeam].pitcherGameStats.earnedRuns += earned;
    return nextState;
  };

  const handleGameAction = (actionLabel, isOut, basesToAdvance) => {
    setGameState(prev => {
      let state = normalizeGameStateForTracking(prev);
      const isTop = state.half === 'top';
      const battingTeam = isTop ? 'teamA' : 'teamB';
      const defenseTeam = isTop ? 'teamB' : 'teamA';
      const currentBatter = state[battingTeam].lineup[state[battingTeam].batterIndex];
      const currentPitcher = state[defenseTeam].pitcher;

      let newOuts = state.outs;
      let newLogs = [...state.logs];
      let newPlayEvents = [...state.playEvents];
      let newBases = [...state.bases];
      let newScore = state[battingTeam].score;
      let runsScored = 0;
      let runsToPitchers = [];

      let countAsAtBat = !['볼넷', '사구', '희생번트', '희생플라이'].includes(actionLabel);
      let countAsHit = ['안타', '2루타', '3루타', '홈런'].includes(actionLabel);
      let plateUpdates = {
        label: actionLabel,
        atBats: countAsAtBat ? 1 : 0,
        hits: countAsHit ? 1 : 0,
        homeRuns: actionLabel === '홈런' ? 1 : 0,
        walks: ['볼넷', '사구'].includes(actionLabel) ? 1 : 0,
        strikeouts: actionLabel === '삼진' ? 1 : 0,
        rbi: 0, runs: 0, steals: 0, errors: 0
      };
      let pitchingDelta = { inningsOuts: 0, strikeouts: 0, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 1, errorRuns: 0 };

      const isErrorPlay = actionLabel.startsWith('실책-');
      const isFielderChoice = actionLabel === '야수선택';
      const isDoublePlay = actionLabel === '병살타';

      const processRunnerScoring = (runnerObj) => {
        runsScored++;
        runsToPitchers.push({
          pitcherId: runnerObj.respPitcher,
          earned: runnerObj.isEarned && !isErrorPlay
        });
      };

      if (isErrorPlay) {
        const position = actionLabel.replace('실책-', '');
        plateUpdates.label = `${position} 실책`;
        plateUpdates.atBats = 1;
        state = incrementDefenseError(state, defenseTeam, position);
        newLogs.unshift(`[${state.inning}회${isTop ? '초' : '말'}] ${position} 실책으로 출루`);
        newPlayEvents.unshift(`${position} 실책`);

        const runnersOn = newBases.map((r, i) => r ? { runnerObj: r, base: i + 1 } : null).filter(Boolean);
        newBases = [null, null, null];
        runnersOn.forEach(({ runnerObj, base }) => {
          const nextBase = base + 1;
          if (nextBase > 3) processRunnerScoring(runnerObj);
          else newBases[nextBase - 1] = runnerObj;
        });
        newBases[0] = { name: currentBatter?.name, respPitcher: currentPitcher.id, isEarned: false };
      
      } else if (isFielderChoice) {
        const runnersOn = newBases.map((r, i) => r ? { runnerObj: r, base: i + 1 } : null).filter(Boolean);
        newBases = [null, null, null];
        
        if (runnersOn.length > 0) {
          runnersOn.pop(); 
          newOuts += 1;
          pitchingDelta.inningsOuts += 1;
        } else {
          newOuts += 1;
          pitchingDelta.inningsOuts += 1;
        }

        runnersOn.forEach(({ runnerObj, base }) => {
          const nextBase = base + 1;
          if (nextBase > 3) processRunnerScoring(runnerObj);
          else newBases[nextBase - 1] = runnerObj;
        });

        newBases[0] = { name: currentBatter?.name, respPitcher: currentPitcher.id, isEarned: true };
        newLogs.unshift(`[${state.inning}회${isTop ? '초' : '말'}] ${currentBatter?.name || '타자'} - 야수선택 출루 (선행주자 아웃)`);
        newPlayEvents.unshift(`${currentBatter?.name || '타자'} 야수선택`);

      } else if (isDoublePlay) {
        const runnersOn = newBases.map((r, i) => r ? { runnerObj: r, base: i + 1 } : null).filter(Boolean);
        newBases = [null, null, null];

        if (runnersOn.length > 0) {
          runnersOn.shift();
          newOuts += 2;
          pitchingDelta.inningsOuts += 2;
        } else {
          newOuts += 1;
          pitchingDelta.inningsOuts += 1;
        }

        runnersOn.forEach(({ runnerObj, base }) => {
          const nextBase = base + 1;
          if (nextBase > 3) processRunnerScoring(runnerObj);
          else newBases[nextBase - 1] = runnerObj;
        });

        newLogs.unshift(`[${state.inning}회${isTop ? '초' : '말'}] ${currentBatter?.name || '타자'} - 병살타 (2아웃)`);
        newPlayEvents.unshift(`${currentBatter?.name || '타자'} 병살타`);

      } else if (isOut) {
        newOuts += 1;
        pitchingDelta.inningsOuts += 1;
        if (actionLabel === '삼진') pitchingDelta.strikeouts += 1;
        newLogs.unshift(`[${state.inning}회${isTop ? '초' : '말'}] ${currentBatter?.name || '타자'} - ${actionLabel}`);
        newPlayEvents.unshift(`${currentBatter?.name || '타자'} ${actionLabel}`);
      } else {
        const runnersOn = newBases.map((r, i) => r ? { runnerObj: r, base: i + 1 } : null).filter(Boolean);
        newBases = [null, null, null];

        if (actionLabel === '볼넷' || actionLabel === '사구') {
          const occupied = [state.bases[0], state.bases[1], state.bases[2]];
          const third = occupied[2];
          const second = occupied[1];
          const first = occupied[0];
          if (first && second && third) processRunnerScoring(third);
          newBases[2] = second && first ? second : third;
          newBases[1] = first ? first : second;
          newBases[0] = { name: currentBatter?.name, respPitcher: currentPitcher.id, isEarned: true };
          pitchingDelta.walksAllowed += 1;
        } else {
          runnersOn.forEach(({ runnerObj, base }) => {
            const nextBase = base + basesToAdvance;
            if (nextBase > 3) processRunnerScoring(runnerObj);
            else newBases[nextBase - 1] = runnerObj;
          });

          if (basesToAdvance > 3) {
            runsScored++;
            runsToPitchers.push({ pitcherId: currentPitcher.id, earned: true });
            plateUpdates.runs = 1;
          } else {
            newBases[basesToAdvance - 1] = { name: currentBatter?.name, respPitcher: currentPitcher.id, isEarned: true };
          }
          if (countAsHit) pitchingDelta.hitsAllowed += 1;
        }

        newLogs.unshift(`[${state.inning}회${isTop ? '초' : '말'}] ${currentBatter?.name || '타자'} - ${actionLabel}${runsScored > 0 ? ` (+${runsScored}득점)` : ''}`);
        newPlayEvents.unshift(`${currentBatter?.name || '타자'} ${actionLabel}`);
      }

      newScore += runsScored;
      plateUpdates.rbi = runsScored;

      runsToPitchers.forEach(run => {
        state = addPitcherRuns(state, defenseTeam, run.pitcherId, 1, run.earned ? 1 : 0);
      });

      state = registerPlateAppearance(state, battingTeam, currentBatter, plateUpdates);
      state = applyPitchingEvent(state, defenseTeam, pitchingDelta);

      let nextSummary = {
        ...state.summary,
        [battingTeam]: {
          ...state.summary[battingTeam],
          hits: (state.summary[battingTeam]?.hits || 0) + (countAsHit ? 1 : 0),
          homeRuns: (state.summary[battingTeam]?.homeRuns || 0) + (actionLabel === '홈런' ? 1 : 0),
          strikeouts: (state.summary[battingTeam]?.strikeouts || 0) + (actionLabel === '삼진' ? 1 : 0),
          walks: (state.summary[battingTeam]?.walks || 0) + (['볼넷', '사구'].includes(actionLabel) ? 1 : 0)
        }
      };

      let newBatterIndex = state[battingTeam].batterIndex;
      if (state[battingTeam].lineup.length > 0) newBatterIndex = (newBatterIndex + 1) % state[battingTeam].lineup.length;

      state = {
        ...state,
        outs: newOuts,
        logs: newLogs,
        playEvents: newPlayEvents,
        bases: newBases,
        summary: nextSummary,
        [battingTeam]: {
          ...state[battingTeam],
          score: newScore,
          batterIndex: newBatterIndex
        }
      };

      state = advanceInningScore(state, battingTeam, runsScored);

      let newInning = state.inning;
      let newHalf = state.half;
      if (state.outs >= 3) {
        newLogs.unshift(`[${newInning}회${isTop ? '초' : '말'} 종료] 쓰리아웃 공수교대`);
        if (newHalf === 'top') newHalf = 'bottom';
        else { newHalf = 'top'; newInning += 1; }
        state = { ...state, inning: newInning, half: newHalf, outs: 0, bases: [null, null, null], logs: newLogs };
      }

      return state;
    });
  };

  const forceInningChange = () => {
    if (!window.confirm("강제로 이닝을 교대하시겠습니까?")) return;
    setGameState(prev => {
      const isTop = prev.half === 'top';
      let newLogs = [...prev.logs];
      newLogs.unshift(`[${prev.inning}회${isTop ? '초' : '말'} 종료] 강제 공수교대`);
      let newInning = prev.inning;
      let newHalf = prev.half;
      if (newHalf === 'top') {
        newHalf = 'bottom';
      } else {
        newHalf = 'top';
        newInning += 1;
      }
      return {
        ...prev,
        outs: 0,
        bases: [null, null, null],
        inning: newInning,
        half: newHalf,
        logs: newLogs
      };
    });
  };

  const endGame = () => {
    if (window.confirm("현재 진행 중인 경기를 종료하고 기록을 저장하시겠습니까?")) {
      finalizeAndPersistGameStats(gameState);
      setGameState(null);
      setRunnerActionBase(null);
      setManualBaseAssign(null);
    }
  };

  const getCurrentBattingTeamKey = () => (gameState?.half === 'top' ? 'teamA' : 'teamB');

  const getCurrentOffensePlayers = () => {
    if (!gameState) return [];
    const battingTeamKey = getCurrentBattingTeamKey();
    return gameState[battingTeamKey]?.lineup || [];
  };

  const handleManualBaseAssign = (baseIndex) => {
    if (!gameState) return;
    const allBasesEmpty = gameState.bases.every(base => base === null);
    const isFirstBase = baseIndex === 0;
    const isStartLikeState = allBasesEmpty && gameState.outs === 0;

    if (gameState.bases[baseIndex]) {
      setManualBaseAssign(null);
      setRunnerActionBase(baseIndex);
      return;
    }

    if (isFirstBase && isStartLikeState) {
      setRunnerActionBase(null);
      setManualBaseAssign(0);
    }
  };

  const assignRunnerToBase = (playerName) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newBases = [...prev.bases];
      const defenseTeam = prev.half === 'top' ? 'teamB' : 'teamA';
      newBases[0] = { name: playerName, respPitcher: prev[defenseTeam].pitcher.id, isEarned: false };
      const isTop = prev.half === 'top';
      return {
        ...prev,
        bases: newBases,
        logs: [`[${prev.inning}회${isTop ? '초' : '말'}] 수동 주자 배치 - ${playerName} 1루 배치`, ...prev.logs]
      };
    });
    setManualBaseAssign(null);
  };

  const openMediaDb = () => new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const putMediaItem = async (item) => {
    const db = await openMediaDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      tx.objectStore(MEDIA_STORE_NAME).put(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  };

  const getAllMediaItems = async () => {
    const db = await openMediaDb();
    if (!db) return [];
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
      const request = tx.objectStore(MEDIA_STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const newPosts = await Promise.all(files.map(async (file, index) => {
        const imageUrl = await fileToDataUrl(file);
        return {
          id: Date.now() + index,
          imageUrl,
          fileName: file.name,
          createdAt: new Date().toLocaleString('ko-KR'),
          caption: '팀 단체 사진'
        };
      }));
      setGalleryPosts(prev => [...newPosts, ...prev]);
      await Promise.all(newPosts.map(post => putMediaItem({
        key: `gallery:${post.id}`,
        type: 'gallery',
        ...post
      })));
    } catch (error) {
      console.error('갤러리 사진 저장 실패', error);
      alert('사진 저장 중 오류가 발생했습니다.');
    }
    e.target.value = '';
  };

  const getPlayerKey = (player) => `${player.type}-${player.id}`;

  const handlePlayerPhotoUpload = async (player, file) => {
    if (!file || !player) return;
    try {
      const key = getPlayerKey(player);
      const imageUrl = await fileToDataUrl(file);
      setPlayerPhotos(prev => ({
        ...prev,
        [key]: imageUrl
      }));
      await putMediaItem({
        key: `player:${key}`,
        type: 'player',
        playerKey: key,
        imageUrl,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('프로필 사진 저장 실패', error);
      alert('프로필 사진 저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getAllMediaItems();
        if (!mounted) return;
        const loadedGalleryPosts = items
          .filter(item => item.type === 'gallery')
          .sort((a, b) => b.id - a.id)
          .map(({ id, imageUrl, fileName, createdAt, caption }) => ({ id, imageUrl, fileName, createdAt, caption }));
        const loadedPlayerPhotos = items
          .filter(item => item.type === 'player')
          .reduce((acc, item) => {
            acc[item.playerKey] = item.imageUrl;
            return acc;
          }, {});

        // 배경 사진 및 설정 로드
        const loadedBackground = items.find(item => item.key === 'background:current');
        if (loadedBackground) {
          if (loadedBackground.imageUrl && loadedBackground.imageUrl !== '/background.JPG') {
            setCustomBackground(loadedBackground.imageUrl);
          }
          if (loadedBackground.settings) {
            setBgSettings({
              scale: loadedBackground.settings.scale ?? 1,
              posX: loadedBackground.settings.posX ?? 50,
              posY: loadedBackground.settings.posY ?? 50
            });
          }
        }

        setGalleryPosts(loadedGalleryPosts);
        setPlayerPhotos(loadedPlayerPhotos);
      } catch (error) {
        console.error('저장된 사진 불러오기 실패', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const calculateBattingAverage = (hits, atBats) => (atBats > 0 ? (hits / atBats).toFixed(3) : '0.000');

  const parseBaseballInningsToOuts = (inningsValue) => {
    const raw = String(inningsValue ?? 0);
    if (!raw.includes('.')) return (parseInt(raw, 10) || 0) * 3;
    const [whole, decimal] = raw.split('.');
    return ((parseInt(whole, 10) || 0) * 3) + (parseInt(decimal, 10) || 0);
  };

  const outsToBaseballInnings = (outs) => `${Math.floor((outs || 0) / 3)}.${(outs || 0) % 3}`;

  const calculateEra = (earnedRuns, inningsOrOuts) => {
    const outs = Number.isInteger(inningsOrOuts) ? inningsOrOuts : parseBaseballInningsToOuts(inningsOrOuts);
    const ip = outs / 3;
    if (ip <= 0) return '0.00';
    return ((earnedRuns * 9) / ip).toFixed(2);
  };

  const normalizeGameStateForTracking = (state) => {
    const createPitchingLine = (pitcher) => ({
      pitcherId: pitcher?.id || null,
      pitcherName: pitcher?.name || '미정',
      uniformNumber: pitcher?.uniformNumber || '',
      stats: { inningsOuts: 0, strikeouts: 0, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 0, errorRuns: 0 }
    });

    const ensureTeam = (team) => {
      const totalPitching = team?.pitcherGameStats || { inningsOuts: 0, strikeouts: 0, runsAllowed: 0, earnedRuns: 0, hitsAllowed: 0, walksAllowed: 0, battersFaced: 0, errorRuns: 0 };
      const pitcherAppearances = team?.pitcherAppearances?.length ? team.pitcherAppearances : (team?.pitcher ? [createPitchingLine(team.pitcher)] : []);
      return {
        ...team,
        score: team?.score || 0,
        batterIndex: team?.batterIndex || 0,
        lineup: (team?.lineup || []).map(player => ({
          ...player,
          gameStats: {
            pa: 0, atBats: 0, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, runs: 0, walks: 0, strikeouts: 0, steals: 0, sacrifices: 0, sacFlies: 0, sacBunts: 0, errors: 0, resultByInning: {}, ...(player.gameStats || {})
          },
          defensiveErrors: player.defensiveErrors || 0
        })),
        pitcherGameStats: totalPitching,
        pitcherAppearances
      };
    };

    return {
      ...state,
      teamA: ensureTeam(state.teamA),
      teamB: ensureTeam(state.teamB),
      inningScores: state.inningScores || {},
      unearnedRunCredits: state.unearnedRunCredits || { teamA: 0, teamB: 0 },
      summary: state.summary || {
        teamA: { hits: 0, homeRuns: 0, steals: 0, strikeouts: 0, errors: 0, walks: 0 },
        teamB: { hits: 0, homeRuns: 0, steals: 0, strikeouts: 0, errors: 0, walks: 0 }
      },
      playEvents: state.playEvents || []
    };
  };

  const getPlayerByPosition = (team, position) => {
    if (!team?.lineup?.length) return null;
    return team.lineup.find(player => player.assignedPosition === position || player.position === position) || null;
  };

  const updateBatterSeasonStats = (player, gameStats) => ({
    ...player,
    games: (player.games || 0) + (gameStats.pa > 0 ? 1 : 0),
    atBats: (player.atBats || 0) + gameStats.atBats,
    runs: (player.runs || 0) + gameStats.runs,
    hits: (player.hits || 0) + gameStats.hits,
    homeRuns: (player.homeRuns || 0) + gameStats.homeRuns,
    rbi: (player.rbi || 0) + gameStats.rbi,
    walks: (player.walks || 0) + gameStats.walks,
    steals: (player.steals || 0) + gameStats.steals,
    errors: (player.errors || 0) + gameStats.errors,
    avg: calculateBattingAverage((player.hits || 0) + gameStats.hits, (player.atBats || 0) + gameStats.atBats)
  });

  const updatePitcherSeasonStats = (pitcher, gameStats, isWinningPitcher, isLosingPitcher) => {
    const nextOuts = parseBaseballInningsToOuts(pitcher.innings || 0) + (gameStats.inningsOuts || 0);
    const nextInnings = outsToBaseballInnings(nextOuts);
    const nextEarnedRuns = (pitcher.earnedRuns || 0) + gameStats.earnedRuns;
    return {
      ...pitcher,
      games: (pitcher.games || 0) + 1,
      wins: (pitcher.wins || 0) + (isWinningPitcher ? 1 : 0),
      losses: (pitcher.losses || 0) + (isLosingPitcher ? 1 : 0),
      innings: nextInnings,
      strikeouts: (pitcher.strikeouts || 0) + gameStats.strikeouts,
      runsAllowed: (pitcher.runsAllowed || 0) + gameStats.runsAllowed,
      earnedRuns: nextEarnedRuns,
      hitsAllowed: (pitcher.hitsAllowed || 0) + gameStats.hitsAllowed,
      walksAllowed: (pitcher.walksAllowed || 0) + gameStats.walksAllowed,
      battersFaced: (pitcher.battersFaced || 0) + gameStats.battersFaced,
      era: calculateEra(nextEarnedRuns, nextOuts)
    };
  };

  const applyPitchingEvent = (state, defenseTeam, delta) => {
    const currentPitcherId = state[defenseTeam]?.pitcher?.id;
    const updateStats = (stats) => ({
      ...stats,
      inningsOuts: (stats.inningsOuts || 0) + (delta.inningsOuts || 0),
      strikeouts: (stats.strikeouts || 0) + (delta.strikeouts || 0),
      runsAllowed: (stats.runsAllowed || 0) + (delta.runsAllowed || 0),
      earnedRuns: (stats.earnedRuns || 0) + (delta.earnedRuns || 0),
      hitsAllowed: (stats.hitsAllowed || 0) + (delta.hitsAllowed || 0),
      walksAllowed: (stats.walksAllowed || 0) + (delta.walksAllowed || 0),
      battersFaced: (stats.battersFaced || 0) + (delta.battersFaced || 0),
      errorRuns: (stats.errorRuns || 0) + (delta.errorRuns || 0)
    });

    return {
      ...state,
      [defenseTeam]: {
        ...state[defenseTeam],
        pitcherGameStats: updateStats(state[defenseTeam].pitcherGameStats),
        pitcherAppearances: state[defenseTeam].pitcherAppearances.map(appearance =>
          appearance.pitcherId === currentPitcherId
            ? { ...appearance, stats: updateStats(appearance.stats) }
            : appearance
        )
      }
    };
  };

  const finalizeAndPersistGameStats = (finishedState) => {
    if (!finishedState) return;

    const polarisTeamKey = finishedState.mode === 'regular_play'
      ? (finishedState.venue === 'home' ? 'teamB' : 'teamA')
      : null;
    const opponentTeamKey = finishedState.mode === 'regular_play'
      ? (polarisTeamKey === 'teamA' ? 'teamB' : 'teamA')
      : null;

    const winningTeamKey = finishedState.teamA.score > finishedState.teamB.score ? 'teamA' : finishedState.teamB.score > finishedState.teamA.score ? 'teamB' : null;
    const losingTeamKey = winningTeamKey === 'teamA' ? 'teamB' : winningTeamKey === 'teamB' ? 'teamA' : null;

    const teamKeyToSeasonUpdater = (teamKey) => {
      if (finishedState.mode === 'scrimmage_play') return true;
      return teamKey === polarisTeamKey;
    };

    setBatters(prev => prev.map(player => {
      let updated = player;
      ['teamA', 'teamB'].forEach(teamKey => {
        if (!teamKeyToSeasonUpdater(teamKey)) return;
        const found = finishedState[teamKey].lineup.find(p => p.id === player.id && !String(p.id).startsWith('p-'));
        if (found?.gameStats) updated = updateBatterSeasonStats(updated, found.gameStats);
      });
      return updated;
    }));

    setPitchers(prev => prev.map(pitcher => {
      let updated = pitcher;
      ['teamA', 'teamB'].forEach(teamKey => {
        if (!teamKeyToSeasonUpdater(teamKey)) return;
        const appearances = finishedState[teamKey]?.pitcherAppearances || [];
        appearances.forEach((appearance, idx) => {
          if (appearance.pitcherId === pitcher.id) {
            updated = updatePitcherSeasonStats(
              updated,
              appearance.stats,
              winningTeamKey === teamKey && idx === 0,
              losingTeamKey === teamKey && idx === 0
            );
          }
        });
      });
      return updated;
    }));

    const isRegular = finishedState.mode === 'regular_play';
    const opponentName = isRegular ? (finishedState.opponentName?.trim() || '상대팀') : '자체 청백전';
    const home = isRegular ? (finishedState.venue === 'home' ? '폴라리스' : opponentName) : '백팀';
    const away = isRegular ? (finishedState.venue === 'home' ? opponentName : '폴라리스') : '청팀';
    const homeScore = finishedState.teamB.score;
    const awayScore = finishedState.teamA.score;
    
    let result = '무';
    if (isRegular) {
      const polarisScore = finishedState.venue === 'home' ? homeScore : awayScore;
      const opponentScore = finishedState.venue === 'home' ? awayScore : homeScore;
      result = polarisScore > opponentScore ? '승' : polarisScore < opponentScore ? '패' : '무';
    } else {
      result = '-';
    }
    
    const today = new Date().toISOString().slice(0, 10);
    const viewTeamKey = isRegular ? polarisTeamKey : 'teamA';
    const polarisSummary = finishedState.summary[viewTeamKey];
    const opponentSummary = finishedState.summary[isRegular ? opponentTeamKey : 'teamB'];
    const polarisPitcher = finishedState[viewTeamKey].pitcher;
    const polarisPitcherStats = finishedState[viewTeamKey].pitcherGameStats;
    const polarisPitchers = (finishedState[viewTeamKey].pitcherAppearances || []).map(appearance => ({
      name: appearance.pitcherName,
      uniformNumber: appearance.uniformNumber,
      ...appearance.stats
    }));

    const detailPayload = {
      inningScores: finishedState.inningScores,
      summary: finishedState.summary,
      opponentName,
      venue: finishedState.venue,
      playEvents: finishedState.playEvents,
      lineup: finishedState[viewTeamKey].lineup.map((player, index) => ({
        order: index + 1,
        position: player.assignedPosition || player.position,
        name: player.name,
        uniformNumber: player.uniformNumber,
        ...player.gameStats,
        seasonAvg: player.avg
      })),
      pitcher: {
        name: polarisPitcher?.name,
        uniformNumber: polarisPitcher?.uniformNumber,
        ...polarisPitcherStats
      },
      pitchers: polarisPitchers,
      officials: { recorder: 'Polaris Record Mode' },
      scoreboard: {
        polaris: isRegular ? (finishedState.venue === 'home' ? homeScore : awayScore) : awayScore,
        opponent: isRegular ? (finishedState.venue === 'home' ? awayScore : homeScore) : homeScore,
        home, away, homeScore, awayScore
      },
      statBars: [
        { label: '안타', left: opponentSummary.hits, right: polarisSummary.hits },
        { label: '홈런', left: opponentSummary.homeRuns, right: polarisSummary.homeRuns },
        { label: '도루', left: opponentSummary.steals, right: polarisSummary.steals },
        { label: '삼진', left: opponentSummary.strikeouts, right: polarisSummary.strikeouts },
        { label: '실책', left: opponentSummary.errors, right: polarisSummary.errors },
        { label: '사사구', left: opponentSummary.walks, right: polarisSummary.walks }
      ]
    };

    setGameResults(prev => ([
      {
        id: Date.now(),
        date: today,
        opponent: opponentName,
        home, away, homeScore, awayScore, result,
        detail: detailPayload
      },
      ...prev
    ]));

    setActiveTab('records');
  };

  const advanceInningScore = (state, battingTeamKey, runsScored) => {
    if (!runsScored) return state;
    const key = `${state.inning}-${state.half}`;
    return {
      ...state,
      inningScores: {
        ...state.inningScores,
        [key]: {
          ...(state.inningScores[key] || { teamA: 0, teamB: 0 }),
          [battingTeamKey]: ((state.inningScores[key] || { teamA: 0, teamB: 0 })[battingTeamKey] || 0) + runsScored
        }
      }
    };
  };

  const registerPlateAppearance = (state, battingTeamKey, currentBatter, updates) => {
    const nextTeam = { ...state[battingTeamKey] };
    nextTeam.lineup = nextTeam.lineup.map(player => {
      if (player.id !== currentBatter.id) return player;
      const gameStats = {
        ...player.gameStats,
        ...updates,
        pa: (player.gameStats.pa || 0) + 1,
        resultByInning: {
          ...player.gameStats.resultByInning,
          [`${state.inning}`]: [...(player.gameStats.resultByInning?.[`${state.inning}`] || []), updates.label || '']
        }
      };
      return { ...player, gameStats };
    });
    return { ...state, [battingTeamKey]: nextTeam };
  };

  const incrementDefenseError = (state, defenseTeamKey, position) => {
    const target = getPlayerByPosition(state[defenseTeamKey], position);
    const nextTeam = { ...state[defenseTeamKey] };
    nextTeam.lineup = nextTeam.lineup.map(player => {
      if (!target || player.id !== target.id) return player;
      return {
        ...player,
        gameStats: { ...player.gameStats, errors: (player.gameStats.errors || 0) + 1 },
        defensiveErrors: (player.defensiveErrors || 0) + 1
      };
    });
    return {
      ...state,
      [defenseTeamKey]: nextTeam,
      summary: {
        ...state.summary,
        [defenseTeamKey]: { ...state.summary[defenseTeamKey], errors: (state.summary[defenseTeamKey]?.errors || 0) + 1 }
      }
    };
  };

  const renderInningBox = (detail) => {
    const innings = Array.from({ length: 9 }, (_, i) => i + 1);
    return (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="p-3 border">Team</th>
            {innings.map(inning => <th key={inning} className="p-3 border">{inning}</th>)}
            <th className="p-3 border">R</th>
            <th className="p-3 border">H</th>
            <th className="p-3 border">E</th>
            <th className="p-3 border">B</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: detail.scoreboard.away, key: 'teamA' },
            { label: detail.scoreboard.home, key: 'teamB' }
          ].map((row, idx) => {
            const teamKey = row.key;
            const runs = idx === 0 ? detail.scoreboard.awayScore : detail.scoreboard.homeScore;
            const teamSummary = detail.summary[teamKey] || { hits: 0, errors: 0, walks: 0 };
            return (
              <tr key={row.label}>
                <td className="p-3 border font-bold text-center">{row.label}</td>
                {innings.map(inning => {
                  const halfKey = teamKey === 'teamA' ? `${inning}-top` : `${inning}-bottom`;
                  const value = detail.inningScores?.[halfKey]?.[teamKey] ?? '';
                  return <td key={halfKey} className="p-3 border text-center">{value}</td>;
                })}
                <td className="p-3 border text-center font-black">{runs}</td>
                <td className="p-3 border text-center font-black">{teamSummary.hits || 0}</td>
                <td className="p-3 border text-center font-black">{teamSummary.errors || 0}</td>
                <td className="p-3 border text-center font-black">{teamSummary.walks || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderGameResultDetail = () => {
    if (!selectedGameResult?.detail) return null;
    const detail = selectedGameResult.detail;

    return (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={() => { setSelectedGameResult(null); setDetailTab('summary'); }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
            <div>
              <p className="text-sm text-gray-500">{selectedGameResult.date}</p>
              <h3 className="text-2xl font-black text-gray-800">{selectedGameResult.away} {selectedGameResult.awayScore} : {selectedGameResult.homeScore} {selectedGameResult.home}</h3>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              {['summary', 'lineup', 'playbyplay'].map(tab => {
                const labels = { summary: '경기 요약', lineup: '라인업/기록', playbyplay: 'Play by Play' };
                return (
                  <button 
                    key={tab} 
                    onClick={() => setDetailTab(tab)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all ${detailTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {labels[tab]}
                  </button>
                )
              })}
            </div>

            <button onClick={() => { setSelectedGameResult(null); setDetailTab('summary'); }} className="hidden sm:block text-gray-500 hover:text-gray-800"><X size={28} /></button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
            {detailTab === 'summary' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-black text-gray-800 mb-4">이닝별 득점</h4>
                  <div className="overflow-x-auto">{renderInningBox(detail)}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h4 className="text-lg font-black text-gray-800 mb-4">팀 스탯 비교</h4>
                    <div className="space-y-3">
                      {detail.statBars.map(bar => (
                        <div key={bar.label} className="grid grid-cols-[30px_1fr_30px] items-center gap-3 text-sm">
                          <div className="text-right font-black text-gray-600">{bar.left}</div>
                          <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-xs">
                            <div className="absolute inset-y-0 left-0 bg-gray-400" style={{ width: `${Math.max(5, (bar.left / Math.max(bar.left + bar.right, 1)) * 100)}%` }} />
                            <div className="absolute inset-y-0 right-0 bg-blue-500" style={{ width: `${Math.max(5, (bar.right / Math.max(bar.left + bar.right, 1)) * 100)}%` }} />
                            <span className="relative z-10 text-gray-800">{bar.label}</span>
                          </div>
                          <div className="font-black text-blue-600">{bar.right}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h4 className="text-lg font-black text-gray-800 mb-4">우리 팀 투수 기록</h4>
                    <div className="space-y-3">
                      {(detail.pitchers?.length ? detail.pitchers : [detail.pitcher]).map((pitcherRow, idx) => (
                        <div key={`${pitcherRow.name}-${idx}`} className="bg-gray-50 rounded-xl p-3 text-sm flex flex-wrap gap-x-4 gap-y-2">
                          <div className="font-bold text-gray-800 w-full mb-1">{pitcherRow.name}</div>
                          <div><span className="text-gray-500 text-xs">이닝</span> <span className="font-bold">{outsToBaseballInnings(pitcherRow.inningsOuts || 0)}</span></div>
                          <div><span className="text-gray-500 text-xs">실점</span> <span className="font-bold">{pitcherRow.runsAllowed}</span></div>
                          <div><span className="text-gray-500 text-xs">자책</span> <span className="font-bold">{pitcherRow.earnedRuns}</span></div>
                          <div><span className="text-gray-500 text-xs">피안타</span> <span className="font-bold">{pitcherRow.hitsAllowed}</span></div>
                          <div><span className="text-gray-500 text-xs">볼넷</span> <span className="font-bold">{pitcherRow.walksAllowed}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'lineup' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                    <tr>
                      <th className="p-3 text-left">순번</th>
                      <th className="p-3 text-left">선수</th>
                      {[1,2,3,4,5,6,7,8,9].map(i => <th key={i} className="p-3 text-center">{i}</th>)}
                      <th className="p-3 text-center">타수</th>
                      <th className="p-3 text-center">안타</th>
                      <th className="p-3 text-center">타점</th>
                      <th className="p-3 text-center">득점</th>
                      <th className="p-3 text-center">타율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail.lineup.map(row => (
                      <tr key={`${row.order}-${row.name}`} className="hover:bg-gray-50">
                        <td className="p-3 text-center font-bold text-gray-400">{row.order}</td>
                        <td className="p-3 font-bold text-gray-800">{row.name} <span className="text-gray-400 text-xs font-medium ml-1">{row.position}</span></td>
                        {[1,2,3,4,5,6,7,8,9].map(i => (
                          <td key={i} className="p-3 text-center text-xs text-gray-500">{(row.resultByInning?.[`${i}`] || []).join(', ')}</td>
                        ))}
                        <td className="p-3 text-center font-bold bg-gray-50/50">{row.atBats}</td>
                        <td className="p-3 text-center font-bold bg-gray-50/50">{row.hits}</td>
                        <td className="p-3 text-center font-bold bg-gray-50/50">{row.rbi}</td>
                        <td className="p-3 text-center font-bold bg-gray-50/50">{row.runs}</td>
                        <td className="p-3 text-center font-black text-blue-600 bg-blue-50/30">{calculateBattingAverage(row.hits, row.atBats)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailTab === 'playbyplay' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="space-y-3">
                  {detail.playEvents.map((event, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="text-gray-300 font-black text-xs w-6 text-right">{detail.playEvents.length - index}</div>
                      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 flex-1 border border-gray-100">{event}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;
    const isPitcher = selectedPlayer.type === '투수';
    const career = selectedPlayer.career || {};

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]" onClick={() => setSelectedPlayer(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 flex items-center gap-6 relative">
            <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={28} />
            </button>
            <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/30 backdrop-blur overflow-hidden">
              {playerPhotos[getPlayerKey(selectedPlayer)] ? (
                <img src={playerPhotos[getPlayerKey(selectedPlayer)]} alt={`${selectedPlayer.name} 프로필`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black">{selectedPlayer.uniformNumber}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-blue-300 font-bold text-sm tracking-widest mb-1">POLARIS · {selectedPlayer.position}</p>
              <h2 className="text-4xl font-black mb-2">{selectedPlayer.name}</h2>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${isPitcher ? 'bg-green-500' : 'bg-blue-500'}`}>
                {selectedPlayer.type}
              </span>
              {isAdminAuth && (
                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Camera size={16} /> 프로필 사진 업로드
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePlayerPhotoUpload(selectedPlayer, e.target.files?.[0])} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto p-8 space-y-8">
            <div>
              <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-blue-600 rounded"></span> {seasonLabel} 기록</h3>
              <div className="overflow-x-auto bg-blue-50/50 rounded-xl border border-blue-100">
                <table className="w-full text-sm">
                  <thead className="text-gray-600 border-b border-blue-100">
                    <tr>
                      {isPitcher ? (
                        <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">W</th><th className="p-3 font-semibold">L</th><th className="p-3 font-semibold">SV</th><th className="p-3 font-semibold">IP</th><th className="p-3 font-semibold">SO</th><th className="p-3 font-semibold text-blue-700">ERA</th></>
                      ) : (
                        <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">AB</th><th className="p-3 font-semibold">R</th><th className="p-3 font-semibold">H</th><th className="p-3 font-semibold">HR</th><th className="p-3 font-semibold">RBI</th><th className="p-3 font-semibold text-blue-700">AVG</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 font-bold text-center">
                    <tr>
                      {isPitcher ? (
                        <><td className="p-3">{selectedPlayer.games}</td><td className="p-3">{selectedPlayer.wins}</td><td className="p-3">{selectedPlayer.losses}</td><td className="p-3">{selectedPlayer.saves}</td><td className="p-3">{selectedPlayer.innings}</td><td className="p-3">{selectedPlayer.strikeouts}</td><td className="p-3 text-blue-700 text-lg">{selectedPlayer.era}</td></>
                      ) : (
                        <><td className="p-3">{selectedPlayer.games}</td><td className="p-3">{selectedPlayer.atBats}</td><td className="p-3">{selectedPlayer.runs}</td><td className="p-3">{selectedPlayer.hits}</td><td className="p-3">{selectedPlayer.homeRuns}</td><td className="p-3">{selectedPlayer.rbi}</td><td className="p-3 text-blue-700 text-lg">{selectedPlayer.avg}</td></>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-amber-500 rounded"></span> 통산 기록 (Career)</h3>
              <div className="overflow-x-auto bg-amber-50/50 rounded-xl border border-amber-100">
                <table className="w-full text-sm">
                  <thead className="text-gray-600 border-b border-amber-100">
                    <tr>
                      {isPitcher ? (
                        <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">W</th><th className="p-3 font-semibold">L</th><th className="p-3 font-semibold">SV</th><th className="p-3 font-semibold">IP</th><th className="p-3 font-semibold">SO</th><th className="p-3 font-semibold text-amber-700">ERA</th></>
                      ) : (
                        <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">AB</th><th className="p-3 font-semibold">R</th><th className="p-3 font-semibold">H</th><th className="p-3 font-semibold">HR</th><th className="p-3 font-semibold">RBI</th><th className="p-3 font-semibold text-amber-700">AVG</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 font-bold text-center">
                    <tr>
                      {isPitcher ? (
                        <><td className="p-3">{career.games || 0}</td><td className="p-3">{career.wins || 0}</td><td className="p-3">{career.losses || 0}</td><td className="p-3">{career.saves || 0}</td><td className="p-3">{career.innings || 0}</td><td className="p-3">{career.strikeouts || 0}</td><td className="p-3 text-amber-700 text-lg">{career.era || '0.00'}</td></>
                      ) : (
                        <><td className="p-3">{career.games || 0}</td><td className="p-3">{career.atBats || 0}</td><td className="p-3">{career.runs || 0}</td><td className="p-3">{career.hits || 0}</td><td className="p-3">{career.homeRuns || 0}</td><td className="p-3">{career.rbi || 0}</td><td className="p-3 text-amber-700 text-lg">{career.avg || '0.000'}</td></>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="relative w-full h-screen flex flex-col justify-center items-center bg-black overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@900&display=swap');
          @keyframes slowZoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
          @keyframes slideInLeft {
            0% { transform: translateX(-100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInRight {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .animate-bg { 
            animation: slowZoom 15s ease-in-out infinite alternate; 
          }
          .animate-slide-left {
            animation: slideInLeft 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-slide-right {
            animation: slideInRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
        <img 
          src={customBackground} 
          alt="팀 배경 사진" 
          className="w-full h-full object-cover opacity-60 animate-bg"
          style={{ 
            objectPosition: `${bgSettings.posX}% ${bgSettings.posY}%`, 
            transform: `scale(${bgSettings.scale})`,
            transformOrigin: `${bgSettings.posX}% ${bgSettings.posY}%` 
          }}
          draggable="false"
        />
      </div>
      
      <div className="relative z-10 flex-grow flex flex-col justify-center items-center text-center w-full px-4 pt-10 pointer-events-none">
        <h1 
          className="text-white leading-tight overflow-hidden" 
          style={{ 
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 900,
            textShadow: "6px 6px 0 #000, 10px 10px 25px rgba(0,0,0,0.9)"
          }}
        >
          <span className="block text-5xl md:text-7xl lg:text-[6rem] tracking-widest mb-2 md:mb-4 text-gray-100 animate-slide-left">순천향의대</span>
          <span className="block text-5xl md:text-7xl lg:text-[6rem] tracking-widest text-gray-100 animate-slide-right">폴라리스</span>
        </h1>
      </div>

      <div className="absolute bottom-6 right-8 z-20 pointer-events-none">
        <p className="text-white/70 italic text-xs md:text-sm tracking-widest" style={{ fontFamily: "Georgia, serif" }}>
          since. 1982 SCH College of Medicine
        </p>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <Calendar size={80} className="text-gray-300 mb-6" />
        <h3 className="text-3xl font-black text-gray-800 mb-4">훈련 및 경기 일정</h3>
        <p className="text-gray-500 text-xl font-medium">캘린더 및 일정 관리 기능이 곧 업데이트될 예정입니다.</p>
      </div>
    </div>
  );

  const renderRecordsAndRankings = () => {
    const battersByAvg = [...batters].sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
    const battersByHR = [...batters].sort((a, b) => b.homeRuns - a.homeRuns);
    const battersByRBI = [...batters].sort((a, b) => b.rbi - a.rbi);
    const pitchersByERA = [...pitchers].sort((a, b) => parseFloat(a.era) - parseFloat(b.era));
    const pitchersByWins = [...pitchers].sort((a, b) => b.wins - a.wins);
    const pitchersByK = [...pitchers].sort((a, b) => b.strikeouts - a.strikeouts);

    const RankTable = ({ title, color, data, getValue, valueLabel }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`${color} px-5 py-3 font-black text-white text-lg`}>{title}</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-gray-600">
              <th className="p-3 w-12 text-center font-semibold">순위</th>
              <th className="p-3 text-left font-semibold">선수</th>
              <th className="p-3 w-20 text-right font-semibold">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.slice(0, 5).map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 text-center font-black text-gray-700">{i + 1}</td>
                <td className="p-3 font-medium"><span className="text-gray-400 mr-2">No.{p.uniformNumber}</span>{p.name}</td>
                <td className="p-3 text-right font-bold text-gray-800">{getValue(p)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-gray-400">데이터 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
            <Trophy size={32} className="text-amber-500" /> {seasonLabel} 경기 결과
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">날짜</th>
                  <th className="p-4 font-semibold">상대팀</th>
                  <th className="p-4 font-semibold text-center">홈/원정</th>
                  <th className="p-4 font-semibold text-center">스코어</th>
                  <th className="p-4 font-semibold text-center w-20">결과</th>
                  <th className="p-4 font-semibold text-center w-28">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {gameResults.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">기록된 경기가 없습니다.</td></tr>
                ) : gameResults.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => g.detail && setSelectedGameResult(g)}>
                    <td className="p-4 font-medium text-gray-500">{g.date}</td>
                    <td className="p-4 font-bold">{g.opponent}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${g.home === '폴라리스' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {g.home === '폴라리스' ? '홈' : '원정'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-black text-lg">
                      {g.home === '폴라리스' ? `${g.homeScore} : ${g.awayScore}` : `${g.awayScore} : ${g.homeScore}`}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-black px-3 py-1 rounded-full text-sm ${g.result === '승' ? 'bg-blue-600 text-white' : g.result === '패' ? 'bg-red-500 text-white' : g.result === '-' ? 'bg-gray-700 text-white' : 'bg-gray-400 text-white'}`}>
                        {g.result}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {g.detail ? (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedGameResult(g); }} className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-lg">상세보기</button>
                      ) : (
                        <span className="text-xs text-gray-400">없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3"><BarChart3 size={32} className="text-blue-500" /> 타자 랭킹</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RankTable title="타율 TOP 5" color="bg-blue-600" data={battersByAvg} getValue={p => p.avg} valueLabel="AVG" />
            <RankTable title="홈런 TOP 5" color="bg-purple-600" data={battersByHR} getValue={p => `${p.homeRuns}개`} valueLabel="HR" />
            <RankTable title="타점 TOP 5" color="bg-amber-500" data={battersByRBI} getValue={p => `${p.rbi}점`} valueLabel="RBI" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3"><BarChart3 size={32} className="text-green-500" /> 투수 랭킹</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RankTable title="평균자책점 TOP 5" color="bg-green-600" data={pitchersByERA} getValue={p => p.era} valueLabel="ERA" />
            <RankTable title="다승 TOP 5" color="bg-blue-600" data={pitchersByWins} getValue={p => `${p.wins}승`} valueLabel="W" />
            <RankTable title="탈삼진 TOP 5" color="bg-red-600" data={pitchersByK} getValue={p => `${p.strikeouts}K`} valueLabel="SO" />
          </div>
        </div>
      </div>
    );
  };

  const renderPhotos = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800">팀 갤러리</h2>
          <p className="text-gray-500 mt-2">단체 사진을 업로드하면 피드 형식으로 표시됩니다.</p>
        </div>
        {isAdminAuth && (
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-md text-center">
            단체 사진 업로드
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          </label>
        )}
      </div>
      <div className="space-y-6">
        {galleryPosts.map(post => (
          <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-black">P</div>
              <div>
                <p className="font-bold text-gray-800">폴라리스</p>
                <p className="text-xs text-gray-500">{post.createdAt}</p>
              </div>
            </div>
            <img src={post.imageUrl} alt={post.fileName} className="w-full max-h-[680px] object-cover bg-gray-100" />
            <div className="px-5 py-4">
              <p className="font-semibold text-gray-800 mb-1">{post.caption}</p>
              <p className="text-sm text-gray-500">{post.fileName}</p>
            </div>
          </article>
        ))}
        {galleryPosts.length === 0 && (
          <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <Camera size={80} className="text-gray-300 mb-6" />
            <h3 className="text-3xl font-black text-gray-800 mb-4">첫 단체 사진을 올려보세요</h3>
            <p className="text-gray-500 text-lg font-medium">관리자 모드 로그인 후 사진을 업로드할 수 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLockerRoom = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-800">팀 락커룸</h2>
          <p className="text-gray-500 font-bold">총 {allPlayers.length}명의 선수</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {allPlayers.map((player) => (
            <button key={`${player.type}-${player.id}`} onClick={() => setSelectedPlayer(player)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-lg hover:-translate-y-1 transition-all text-left">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 relative border-4 border-slate-800 overflow-hidden">
                {playerPhotos[getPlayerKey(player)] ? (
                  <img src={playerPhotos[getPlayerKey(player)]} alt={`${player.name} 프로필`} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Shirt size={48} className="text-slate-800 absolute opacity-10" />
                    <span className="text-3xl font-black text-slate-800 z-10">{player.uniformNumber}</span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{player.name}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${player.type === '타자' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{player.position}</span>
            </button>
          ))}
          {allPlayers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">락커룸이 비어 있습니다. 선수를 등록해주세요.</div>
          )}
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    if (!isAdminAuth) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">관리자 권한 필요</h2>
            <p className="text-gray-500 mb-8">선수 관리 및 기록을 위해 비밀번호를 입력해주세요.</p>
            <input 
              type="password" 
              value={adminPwd} 
              onChange={e => setAdminPwd(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              className="w-full p-4 border border-gray-200 rounded-xl mb-4 text-center font-black tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
              placeholder="비밀번호 입력" 
              autoFocus
            />
            <button onClick={handleAdminLogin} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors">인증하기</button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-gray-800">관리자 모드</h2>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center space-x-2 transition-colors shadow-md">
            <Plus size={20} /><span>선수 등록</span>
          </button>
        </div>
        <div className="flex space-x-2 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          <button onClick={() => setAdminSubTab('dashboard')} className={`px-5 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'dashboard' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>전체 요약</button>
          <button onClick={() => setAdminSubTab('batters')} className={`px-5 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'batters' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>타자 기록</button>
          <button onClick={() => setAdminSubTab('pitchers')} className={`px-5 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'pitchers' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>투수 기록</button>
          <button onClick={() => setAdminSubTab('gameRecord')} className={`px-5 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'gameRecord' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
            <div className="flex items-center space-x-1"><PlayCircle size={18} /><span>실시간 경기 기록</span></div>
          </button>
          <button onClick={() => setAdminSubTab('settings')} className={`px-5 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'settings' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <div className="flex items-center space-x-1"><Settings size={18} /><span>환경 설정</span></div>
          </button>
        </div>

        {adminSubTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">등록된 타자</p><h3 className="text-2xl font-bold text-gray-800">{batters.length}명</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Activity size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">등록된 투수</p><h3 className="text-2xl font-bold text-gray-800">{pitchers.length}명</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Trophy size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">팀 홈런</p><h3 className="text-2xl font-bold text-gray-800">{batters.reduce((sum, batter) => sum + batter.homeRuns, 0)}개</h3></div>
            </div>
          </div>
        )}

        {adminSubTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl">
            <h3 className="text-2xl font-black text-gray-800 mb-6">환경 설정</h3>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <label className="block text-sm font-bold text-gray-700">홈페이지 배경 사진 설정 (마우스나 터치로 위치 조정 가능)</label>
                <div className="flex items-center gap-3">
                  <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2 text-sm">
                    <ImageIcon size={16} /> 사진 업로드
                    <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                  </label>
                  <button onClick={saveBackgroundSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 text-sm">
                    <Save size={16} /> 설정 저장
                  </button>
                  <button onClick={resetBackground} className="text-sm text-red-500 hover:text-red-700 underline font-bold px-2">초기화</button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* 컨트롤 패널 */}
                <div className="flex flex-col gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200 lg:w-48">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">크기 조절 (확대/축소)</label>
                    <div className="flex items-center gap-2">
                      <button onClick={handleZoomOut} className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-100"><ZoomOut size={16}/></button>
                      <span className="flex-1 text-center font-bold text-sm">{(bgSettings.scale * 100).toFixed(0)}%</span>
                      <button onClick={handleZoomIn} className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-100"><ZoomIn size={16}/></button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">모바일에서는 핀치 줌 지원</p>
                  </div>
                </div>

                {/* 크롭 프레임 UI */}
                <div className="flex-1">
                  <div 
                    ref={bgContainerRef}
                    className="relative w-full aspect-video bg-gray-200 rounded-xl overflow-hidden cursor-move touch-none border-2 border-dashed border-gray-400 shadow-inner"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                      <img 
                        src={customBackground} 
                        alt="배경 미리보기" 
                        className="w-full h-full object-cover" 
                        style={{ 
                          objectPosition: `${bgSettings.posX}% ${bgSettings.posY}%`, 
                          transform: `scale(${bgSettings.scale})`,
                          transformOrigin: `${bgSettings.posX}% ${bgSettings.posY}%` 
                        }}
                        draggable="false"
                      />
                    </div>
                    
                    {/* 3x3 격자 가이드라인 */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                      <div className="border-b border-r border-white"></div>
                      <div className="border-b border-r border-white"></div>
                      <div className="border-b border-white"></div>
                      <div className="border-b border-r border-white"></div>
                      <div className="border-b border-r border-white"></div>
                      <div className="border-b border-white"></div>
                      <div className="border-r border-white"></div>
                      <div className="border-r border-white"></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminSubTab === 'batters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold w-16 text-center">No.</th>
                    <th className="p-4 font-semibold">이름</th>
                    <th className="p-4 font-semibold text-right">타율 (AVG)</th>
                    <th className="p-4 font-semibold text-right">경기 (G)</th>
                    <th className="p-4 font-semibold text-right">타수 (AB)</th>
                    <th className="p-4 font-semibold text-right">득점 (R)</th>
                    <th className="p-4 font-semibold text-right">안타 (H)</th>
                    <th className="p-4 font-semibold text-right">홈런 (HR)</th>
                    <th className="p-4 font-semibold text-right">타점 (RBI)</th>
                    <th className="p-4 font-semibold text-center w-20">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {batters.map((batter) => (
                    <tr key={batter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-400 text-center">{batter.uniformNumber}</td>
                      <td className="p-4 font-medium">{batter.name}</td>
                      <td className="p-4 text-right font-semibold text-blue-600">{batter.avg}</td>
                      <td className="p-4 text-right">{batter.games}</td>
                      <td className="p-4 text-right">{batter.atBats}</td>
                      <td className="p-4 text-right">{batter.runs}</td>
                      <td className="p-4 text-right">{batter.hits}</td>
                      <td className="p-4 text-right">{batter.homeRuns}</td>
                      <td className="p-4 text-right">{batter.rbi}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteBatter(batter.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="선수 삭제"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminSubTab === 'pitchers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold w-16 text-center">No.</th>
                    <th className="p-4 font-semibold">이름</th>
                    <th className="p-4 font-semibold text-right">ERA</th>
                    <th className="p-4 font-semibold text-right">G</th>
                    <th className="p-4 font-semibold text-right">W</th>
                    <th className="p-4 font-semibold text-right">L</th>
                    <th className="p-4 font-semibold text-right">SV</th>
                    <th className="p-4 font-semibold text-right">IP</th>
                    <th className="p-4 font-semibold text-right">SO</th>
                    <th className="p-4 font-semibold text-center w-20">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {pitchers.map((pitcher) => (
                    <tr key={pitcher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-400 text-center">{pitcher.uniformNumber}</td>
                      <td className="p-4 font-medium">{pitcher.name}</td>
                      <td className="p-4 text-right font-semibold text-green-600">{pitcher.era}</td>
                      <td className="p-4 text-right">{pitcher.games}</td>
                      <td className="p-4 text-right">{pitcher.wins}</td>
                      <td className="p-4 text-right">{pitcher.losses}</td>
                      <td className="p-4 text-right">{pitcher.saves}</td>
                      <td className="p-4 text-right">{pitcher.innings}</td>
                      <td className="p-4 text-right">{pitcher.strikeouts}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeletePitcher(pitcher.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="선수 삭제"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminSubTab === 'gameRecord' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
            {!gameState ? (
              <div className="flex flex-col items-center justify-center h-full space-y-8 py-20">
                <ClipboardList size={64} className="text-blue-500 mb-4" />
                <h2 className="text-3xl font-black text-gray-800">어떤 경기를 기록할까요?</h2>
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                  <button onClick={startScrimmageSetup} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white p-8 rounded-2xl transition-all shadow-md hover:shadow-lg flex flex-col items-center gap-4">
                    <Users size={48} className="text-blue-400" />
                    <span className="text-2xl font-bold">자체 청백전 모드</span>
                    <span className="text-gray-400 text-sm font-medium">팀 내 연습 경기용</span>
                  </button>
                  <button onClick={startRegularSetup} className="flex-1 bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-800 p-8 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-4 group">
                    <Trophy size={48} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-2xl font-bold">정규 경기 모드</span>
                    <span className="text-gray-500 text-sm font-medium">외부 팀과의 공식 시합</span>
                  </button>
                </div>
              </div>
            ) : (gameState.mode === 'scrimmage_setup' || gameState.mode === 'regular_setup') ? (
              <div>
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <h3 className="text-2xl font-black text-gray-800">{gameState.mode === 'regular_setup' ? '정규 경기 라인업 설정' : '청백전 라인업 설정'}</h3>
                  <div className="flex gap-3">
                    <button onClick={() => setGameState(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                      <ArrowLeft size={18} /> 이전
                    </button>
                    <button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md text-lg">경기 시작</button>
                  </div>
                </div>

                {gameState.mode === 'regular_setup' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                    <h4 className="text-lg font-black text-gray-800 mb-4">정규 경기 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">상대팀 이름</label>
                        <input type="text" value={gameState.opponentName} onChange={(e) => handleRegularMetaChange('opponentName', e.target.value)} placeholder="상대팀 이름 입력" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">홈/원정</label>
                        <select value={gameState.venue} onChange={(e) => handleRegularMetaChange('venue', e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                          <option value="home">홈 경기 (폴라리스 후공)</option>
                          <option value="away">원정 경기 (폴라리스 선공)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {['teamA', 'teamB'].map(teamKey => (
                    <div key={teamKey} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
                      <h4 className="text-xl font-bold text-gray-800 mb-4">{gameState[teamKey].name} 라인업</h4>
                      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-center w-24">타순/역할</th>
                              <th className="p-3">선수 선택</th>
                              <th className="p-3 w-40">수비 위치</th>
                              <th className="p-3 text-center w-16">관리</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr className="bg-blue-50/30">
                              <td className="p-3 text-center font-bold text-blue-700">선발 투수</td>
                              <td className="p-3">
                                <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={gameState[teamKey].pitcherId} onChange={(e) => handlePitcherChange(teamKey, e.target.value)}>
                                  <option value="">투수 선택...</option>
                                  {pitchers.map(p => <option key={`p-${p.id}`} value={`p-${p.id}`}>{p.name} (No.{p.uniformNumber})</option>)}
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value="투수" disabled className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" /></td>
                              <td className="p-3 text-center"></td>
                            </tr>
                            {gameState[teamKey].lineup.map((slot, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-center font-bold text-gray-600">{idx + 1}번 타자</td>
                                <td className="p-3">
                                  <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={slot.playerId} onChange={(e) => handleLineupChange(teamKey, idx, 'playerId', e.target.value)}>
                                    <option value="">타자 선택...</option>
                                    <optgroup label="타자">{batters.map(b => <option key={`b-${b.id}`} value={`b-${b.id}`}>{b.name} (No.{b.uniformNumber})</option>)}</optgroup>
                                    <optgroup label="투수 (타자로 기용)">{pitchers.map(p => <option key={`p-${p.id}`} value={`p-${p.id}`}>{p.name} (No.{p.uniformNumber})</option>)}</optgroup>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={slot.assignedPosition} onChange={(e) => handleLineupChange(teamKey, idx, 'assignedPosition', e.target.value)}>
                                    <option value="">포지션...</option>
                                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                                  </select>
                                </td>
                                <td className="p-3 text-center">
                                  {gameState[teamKey].lineup.length > 1 && (
                                    <button onClick={() => removeLineupSlot(teamKey, idx)} className="text-gray-400 hover:text-red-500 p-1"><X size={18} /></button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => addLineupSlot(teamKey)} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-5 py-2.5 rounded-full transition-colors"><Plus size={16} /> 타순 추가</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-slate-900 rounded-3xl p-6 shadow-2xl text-white">
                  <div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl mb-12 border border-slate-700">
                    <div className="text-center w-1/3">
                      <p className="text-gray-400 font-bold mb-1">{gameState.teamA.name}</p>
                      <p className="text-5xl font-black text-white">{gameState.teamA.score}</p>
                    </div>
                    <div className="text-center w-1/3 border-x border-slate-700">
                      <p className="text-2xl font-black text-blue-400 mb-1">{gameState.inning}회{gameState.half === 'top' ? '초' : '말'}</p>
                      <div className="flex justify-center gap-2 items-center">
                        <span className="text-sm font-bold text-red-500">OUT</span>
                        <div className="flex gap-1 items-center">
                          <div className={`w-3 h-3 rounded-full ${gameState.outs >= 1 ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                          <div className={`w-3 h-3 rounded-full ${gameState.outs >= 2 ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                        </div>
                      </div>
                      <button onClick={forceInningChange} className="mt-2 flex items-center gap-1 mx-auto bg-amber-600/30 hover:bg-amber-600/60 border border-amber-600/50 text-amber-200 text-xs px-2 py-1 rounded transition-colors"><FastForward size={12} /> 강제 교대</button>
                    </div>
                    <div className="text-center w-1/3">
                      <p className="text-gray-400 font-bold mb-1">{gameState.teamB.name}</p>
                      <p className="text-5xl font-black text-white">{gameState.teamB.score}</p>
                    </div>
                  </div>

                  <div className="relative w-64 h-64 mx-auto mb-8">
                    <div className="absolute inset-4 border-4 border-slate-700/50 transform rotate-45 rounded-sm z-0"></div>
                    {[0, 1, 2].map(baseIdx => {
                      const positions = ['top-1/2 right-0 -translate-y-1/2', 'top-0 left-1/2 -translate-x-1/2', 'top-1/2 left-0 -translate-y-1/2'];
                      const labels = ['1B', '2B', '3B'];
                      return (
                        <button key={baseIdx} onClick={() => handleManualBaseAssign(baseIdx)} className={`absolute ${positions[baseIdx]} w-16 h-16 flex flex-col items-center justify-center rounded font-bold text-xs z-10 transition-transform ${gameState.bases[baseIdx] ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)] cursor-pointer hover:scale-110' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
                          <span className="mb-0.5">{labels[baseIdx]}</span>
                          {gameState.bases[baseIdx] && <span className="text-[10px] truncate w-full px-1 text-center bg-black/10 rounded">{gameState.bases[baseIdx].name}</span>}
                        </button>
                      );
                    })}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-white text-black font-black text-sm z-10 border-4 border-slate-900 shadow-md">HOME</div>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl flex justify-between border border-slate-700">
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm font-bold mb-1">현재 타자 ({gameState.half === 'top' ? gameState.teamA.name : gameState.teamB.name})</p>
                      <p className="text-2xl font-black text-white">{gameState[gameState.half === 'top' ? 'teamA' : 'teamB'].lineup[gameState[gameState.half === 'top' ? 'teamA' : 'teamB'].batterIndex]?.name || '-'}</p>
                    </div>
                    <div className="flex-1 text-right border-l border-slate-700 pl-4">
                      <p className="text-slate-400 text-sm font-bold mb-1">현재 투수 ({gameState.half === 'top' ? gameState.teamB.name : gameState.teamA.name})</p>
                      {changingPitcherTeam === (gameState.half === 'top' ? 'teamB' : 'teamA') ? (
                        <select autoFocus className="w-full mt-1 p-1 bg-slate-700 border border-slate-600 text-white rounded outline-none text-sm" onChange={(e) => executePitcherChange(gameState.half === 'top' ? 'teamB' : 'teamA', e.target.value)} onBlur={() => setChangingPitcherTeam(null)}>
                          <option value="">투수 선택...</option>
                          {pitchers.map(p => <option key={p.id} value={`p-${p.id}`}>{p.name} (No.{p.uniformNumber})</option>)}
                        </select>
                      ) : (
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <p className="text-2xl font-black text-blue-300">{gameState[gameState.half === 'top' ? 'teamB' : 'teamA'].pitcher?.name || '-'}</p>
                          <button onClick={() => setChangingPitcherTeam(gameState.half === 'top' ? 'teamB' : 'teamA')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded transition-colors"><RefreshCw size={12} /> 교체</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm flex-1">
                    <h4 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><Settings size={20}/> 결과 입력</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <button onClick={() => handleGameAction('안타', false, 1)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow transition-colors">안타 (1B)</button>
                      <button onClick={() => handleGameAction('2루타', false, 2)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow transition-colors">2루타 (2B)</button>
                      <button onClick={() => handleGameAction('3루타', false, 3)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow transition-colors">3루타 (3B)</button>
                      <button onClick={() => handleGameAction('홈런', false, 4)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-4 rounded-xl shadow transition-all col-span-2 sm:col-span-1">홈런 (HR)</button>
                      
                      <button onClick={() => handleGameAction('볼넷', false, 1)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow transition-colors">볼넷 (BB)</button>
                      <button onClick={() => handleGameAction('사구', false, 1)} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 rounded-xl shadow transition-colors">사구 (HBP)</button>
                      
                      <button onClick={() => handleGameAction('실책 출루', false, 1)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow transition-colors">실책 출루</button>
                      <button onClick={() => handleGameAction('야수선택', false, 1)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow transition-colors">야수선택 (FC)</button>
                      
                      <button onClick={() => handleGameAction('땅볼 아웃', true, 0)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow transition-colors mt-2">땅볼 아웃</button>
                      <button onClick={() => handleGameAction('플라이 아웃', true, 0)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow transition-colors mt-2">플라이 아웃</button>
                      <button onClick={() => handleGameAction('병살타', true, 0)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow transition-colors mt-2">병살타 (DP)</button>
                      <button onClick={() => handleGameAction('삼진', true, 0)} className="bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-xl shadow transition-colors mt-2">삼진 (K)</button>
                      <button onClick={() => handleGameAction('희생번트', true, 0)} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-xl shadow transition-colors mt-2">희생번트</button>
                      <button onClick={() => handleGameAction('희생플라이', true, 0)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow transition-colors mt-2">희생플라이</button>

                      <div className="col-span-2 sm:col-span-3 mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-bold mb-2">실책 기록 (클릭 시 타자 1루 진루 및 해당 야수 실책 기록)</p>
                        <div className="flex flex-wrap gap-2">
                          {['투수','포수','1루수','2루수','3루수','유격수','좌익수','중견수','우익수'].map(pos => (
                            <button key={pos} onClick={() => handleGameAction(`실책-${pos}`, false, 1)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2 px-3 rounded-lg border border-amber-200 transition-colors text-xs flex-1 min-w-[70px]">
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-64 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-black text-gray-800">Play by Play</h4>
                      <button onClick={endGame} className="text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-4 py-1.5 rounded-lg transition-colors">경기 종료 및 기록 저장</button>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                      {gameState.logs.map((log, i) => (
                        <p key={i} className={`p-2 rounded-lg text-sm font-medium ${i === 0 ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-gray-50 text-gray-600'}`}>
                          {log}
                        </p>
                      ))}
                      {gameState.logs.length === 0 && <p className="text-gray-400 text-sm text-center pt-8">아직 기록된 플레이가 없습니다.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="fixed top-0 left-0 w-full h-14 bg-black/60 backdrop-blur-md text-white z-50 border-b border-white/10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => setActiveTab('landing')} className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="순천향의대 폴라리스 로고" className="h-10 object-contain drop-shadow-md" />
          </button>
          
          <div className="hidden sm:flex space-x-6 md:space-x-10 text-sm md:text-base font-black tracking-widest">
            <button onClick={() => setActiveTab('schedule')} className={`hover:text-blue-400 transition-colors ${activeTab === 'schedule' ? 'text-blue-400' : ''}`}>훈련/경기 일정</button>
            <button onClick={() => setActiveTab('records')} className={`hover:text-blue-400 transition-colors ${activeTab === 'records' ? 'text-blue-400' : ''}`}>기록</button>
            <button onClick={() => setActiveTab('photos')} className={`hover:text-blue-400 transition-colors ${activeTab === 'photos' ? 'text-blue-400' : ''}`}>사진</button>
            <button onClick={() => setActiveTab('lockerRoom')} className={`hover:text-blue-400 transition-colors ${activeTab === 'lockerRoom' ? 'text-blue-400' : ''}`}>락커룸</button>
            <button onClick={() => setActiveTab('admin')} className={`hover:text-blue-400 transition-colors flex items-center gap-1 ${activeTab === 'admin' ? 'text-blue-400' : ''}`}><Lock size={14} /> 관리자</button>
          </div>

          <div className="sm:hidden flex space-x-3 font-bold text-xs">
            <button onClick={() => setActiveTab('schedule')} className={`hover:text-blue-400 ${activeTab === 'schedule' ? 'text-blue-400' : ''}`}>일정</button>
            <button onClick={() => setActiveTab('records')} className={`hover:text-blue-400 ${activeTab === 'records' ? 'text-blue-400' : ''}`}>기록</button>
            <button onClick={() => setActiveTab('lockerRoom')} className={`hover:text-blue-400 ${activeTab === 'lockerRoom' ? 'text-blue-400' : ''}`}>락커룸</button>
            <button onClick={() => setActiveTab('admin')} className={`hover:text-blue-400 flex items-center gap-1 ${activeTab === 'admin' ? 'text-blue-400' : ''}`}><Lock size={12} /> 관리자</button>
          </div>
        </div>
      </nav>

      {activeTab === 'landing' && renderLanding()}
      
      {activeTab !== 'landing' && (
        <main className="pt-24 pb-16">
          {activeTab === 'schedule' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Calendar size={80} className="text-gray-300 mb-6" />
                <h3 className="text-3xl font-black text-gray-800 mb-4">훈련 및 경기 일정</h3>
                <p className="text-gray-500 text-xl font-medium">캘린더 및 일정 관리 기능이 곧 업데이트될 예정입니다.</p>
              </div>
            </div>
          )}
          {activeTab === 'records' && renderRecordsAndRankings()}
          {activeTab === 'photos' && renderPhotos()}
          {activeTab === 'lockerRoom' && renderLockerRoom()}
          {activeTab === 'admin' && renderAdmin()}
        </main>
      )}

      {selectedGameResult && renderGameResultDetail()}
      
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 flex items-center gap-6 relative">
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <X size={28} />
              </button>
              <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/30 backdrop-blur overflow-hidden">
                {playerPhotos[getPlayerKey(selectedPlayer)] ? (
                  <img src={playerPhotos[getPlayerKey(selectedPlayer)]} alt={`${selectedPlayer.name} 프로필`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black">{selectedPlayer.uniformNumber}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-blue-300 font-bold text-sm tracking-widest mb-1">POLARIS · {selectedPlayer.position}</p>
                <h2 className="text-4xl font-black mb-2">{selectedPlayer.name}</h2>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${selectedPlayer.type === '투수' ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {selectedPlayer.type}
                </span>
                {isAdminAuth && (
                  <div className="mt-4">
                    <label className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors">
                      <Camera size={16} /> 프로필 사진 업로드
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePlayerPhotoUpload(selectedPlayer, e.target.files?.[0])} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-y-auto p-8 space-y-8">
              <div>
                <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-blue-600 rounded"></span> {seasonLabel} 기록</h3>
                <div className="overflow-x-auto bg-blue-50/50 rounded-xl border border-blue-100">
                  <table className="w-full text-sm">
                    <thead className="text-gray-600 border-b border-blue-100">
                      <tr>
                        {selectedPlayer.type === '투수' ? (
                          <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">W</th><th className="p-3 font-semibold">L</th><th className="p-3 font-semibold">SV</th><th className="p-3 font-semibold">IP</th><th className="p-3 font-semibold">SO</th><th className="p-3 font-semibold text-blue-700">ERA</th></>
                        ) : (
                          <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">AB</th><th className="p-3 font-semibold">R</th><th className="p-3 font-semibold">H</th><th className="p-3 font-semibold">HR</th><th className="p-3 font-semibold">RBI</th><th className="p-3 font-semibold text-blue-700">AVG</th></>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 font-bold text-center">
                      <tr>
                        {selectedPlayer.type === '투수' ? (
                          <><td className="p-3">{selectedPlayer.games}</td><td className="p-3">{selectedPlayer.wins}</td><td className="p-3">{selectedPlayer.losses}</td><td className="p-3">{selectedPlayer.saves}</td><td className="p-3">{selectedPlayer.innings}</td><td className="p-3">{selectedPlayer.strikeouts}</td><td className="p-3 text-blue-700 text-lg">{selectedPlayer.era}</td></>
                        ) : (
                          <><td className="p-3">{selectedPlayer.games}</td><td className="p-3">{selectedPlayer.atBats}</td><td className="p-3">{selectedPlayer.runs}</td><td className="p-3">{selectedPlayer.hits}</td><td className="p-3">{selectedPlayer.homeRuns}</td><td className="p-3">{selectedPlayer.rbi}</td><td className="p-3 text-blue-700 text-lg">{selectedPlayer.avg}</td></>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-amber-500 rounded"></span> 통산 기록 (Career)</h3>
                <div className="overflow-x-auto bg-amber-50/50 rounded-xl border border-amber-100">
                  <table className="w-full text-sm">
                    <thead className="text-gray-600 border-b border-amber-100">
                      <tr>
                        {selectedPlayer.type === '투수' ? (
                          <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">W</th><th className="p-3 font-semibold">L</th><th className="p-3 font-semibold">SV</th><th className="p-3 font-semibold">IP</th><th className="p-3 font-semibold">SO</th><th className="p-3 font-semibold text-amber-700">ERA</th></>
                        ) : (
                          <><th className="p-3 font-semibold">G</th><th className="p-3 font-semibold">AB</th><th className="p-3 font-semibold">R</th><th className="p-3 font-semibold">H</th><th className="p-3 font-semibold">HR</th><th className="p-3 font-semibold">RBI</th><th className="p-3 font-semibold text-amber-700">AVG</th></>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 font-bold text-center">
                      <tr>
                        {selectedPlayer.type === '투수' ? (
                          <><td className="p-3">{selectedPlayer.career?.games || 0}</td><td className="p-3">{selectedPlayer.career?.wins || 0}</td><td className="p-3">{selectedPlayer.career?.losses || 0}</td><td className="p-3">{selectedPlayer.career?.saves || 0}</td><td className="p-3">{selectedPlayer.career?.innings || 0}</td><td className="p-3">{selectedPlayer.career?.strikeouts || 0}</td><td className="p-3 text-amber-700 text-lg">{selectedPlayer.career?.era || '0.00'}</td></>
                        ) : (
                          <><td className="p-3">{selectedPlayer.career?.games || 0}</td><td className="p-3">{selectedPlayer.career?.atBats || 0}</td><td className="p-3">{selectedPlayer.career?.runs || 0}</td><td className="p-3">{selectedPlayer.career?.hits || 0}</td><td className="p-3">{selectedPlayer.career?.homeRuns || 0}</td><td className="p-3">{selectedPlayer.career?.rbi || 0}</td><td className="p-3 text-amber-700 text-lg">{selectedPlayer.career?.avg || '0.000'}</td></>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">새 선수 등록</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="overflow-y-auto flex-grow p-6">
              <form id="add-record-form" onSubmit={handleAddRecord}>
                <div className="flex space-x-4 mb-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="type" checked={modalType === 'batter'} onChange={() => setModalType('batter')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span className="font-medium text-gray-700">타자</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="type" checked={modalType === 'pitcher'} onChange={() => setModalType('pitcher')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span className="font-medium text-gray-700">투수</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="col-span-2 md:col-span-3 pb-2 border-b border-gray-100 mb-2">
                    <h4 className="font-semibold text-gray-700 mb-3">기본 정보</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">선수 이름</label>
                        <input required type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="이름" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">등번호</label>
                        <input type="number" name="uniformNumber" value={formData.uniformNumber || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" placeholder="예: 7" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">포지션</label>
                        <select name="position" value={formData.position || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white">
                          <option value="">선택...</option>
                          {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors">취소</button>
              <button type="submit" form="add-record-form" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm">기록 저장</button>
            </div>
          </div>
        </div>
      )}

      {manualBaseAssign !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setManualBaseAssign(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-800 mb-1">1루 주자 배치</h3>
            <p className="text-sm text-gray-500 mb-5">현재 공격 팀 선수 중 한 명을 선택하세요.</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getCurrentOffensePlayers().map((player, idx) => (
                <button key={`${player.id}-${idx}`} onClick={() => assignRunnerToBase(player.name)} className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="font-bold text-gray-800">{player.name}</div>
                  <div className="text-xs text-gray-500">No.{player.uniformNumber} · {player.assignedPosition || player.position}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setManualBaseAssign(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors mt-4">취소</button>
          </div>
        </div>
      )}

      {runnerActionBase !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setRunnerActionBase(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-800 mb-1">{runnerActionBase + 1}루 주자 액션</h3>
            <p className="text-sm text-gray-500 mb-5">주자: <span className="font-bold text-gray-700">{gameState.bases[runnerActionBase]?.name}</span></p>
            <div className="space-y-2">
              <button onClick={() => handleRunnerAction(runnerActionBase, '도루')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">도루 (한 베이스 진루)</button>
              <button onClick={() => handleRunnerAction(runnerActionBase, '폭투')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors">폭투 (한 베이스 진루)</button>
              <button onClick={() => handleRunnerAction(runnerActionBase, '주루사')} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">주루사 (아웃)</button>
              <button onClick={() => setRunnerActionBase(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors mt-2">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}