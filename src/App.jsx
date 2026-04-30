import React, { useState } from 'react';
import { Users, Activity, Plus, Trophy, X, Shirt, Calendar, Camera, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('batter');

  // 샘플 타자 데이터
  const [batters, setBatters] = useState([
    { id: 1, name: '김타자', uniformNumber: 15, position: '중견수', games: 120, atBats: 400, runs: 80, hits: 120, homeRuns: 20, rbi: 75, avg: '0.300' },
    { id: 2, name: '이거포', uniformNumber: 52, position: '1루수', games: 115, atBats: 380, runs: 65, hits: 95, homeRuns: 30, rbi: 90, avg: '0.250' },
    { id: 3, name: '박교타', uniformNumber: 7, position: '유격수', games: 130, atBats: 450, runs: 90, hits: 150, homeRuns: 5, rbi: 45, avg: '0.333' },
  ]);

  // 샘플 투수 데이터
  const [pitchers, setPitchers] = useState([
    { id: 1, name: '최에이스', uniformNumber: 1, position: '선발투수', games: 25, wins: 15, losses: 5, saves: 0, innings: 160, strikeouts: 150, era: '2.45' },
    { id: 2, name: '정마무리', uniformNumber: 21, position: '마무리투수', games: 50, wins: 3, losses: 2, saves: 30, innings: 55, strikeouts: 60, era: '1.85' },
  ]);

  // 새 기록 폼 상태
  const [formData, setFormData] = useState({
    name: '', uniformNumber: '', position: '', 
    games: '', atBats: '', runs: '', hits: '', homeRuns: '', rbi: '',
    wins: '', losses: '', saves: '', innings: '', strikeouts: '', era: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        avg: avg
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
        era: formData.era || '0.00'
      };
      setPitchers([...pitchers, newPitcher]);
    }
    setShowAddModal(false);
    setFormData({});
  };

  // 선수 삭제 핸들러
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
  // 1. 첫 화면 (랜딩 페이지) 렌더링
  // ----------------------------------------------------
  const renderLanding = () => (
    <div className="relative w-full h-screen flex flex-col justify-center items-center bg-black overflow-hidden">
      {/* 각이 잡히고 굵은 웹 폰트 및 역동적인 배경 애니메이션 적용 */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@900&display=swap');
          
          @keyframes slowZoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
          .animate-bg {
            animation: slowZoom 15s ease-in-out infinite alternate;
          }
        `}
      </style>

      {/* 배경 이미지 (아래 기준 정렬 및 천천히 확대되는 애니메이션 추가) */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden">
        <img 
          src="/background.JPG" 
          alt="팀 단체 배경 사진" 
          className="w-full h-full object-cover object-bottom opacity-60 animate-bg origin-bottom"
        />
      </div>
      
      {/* 중앙 거대 텍스트 (두 줄을 동일한 크기로 설정) */}
      <div className="relative z-10 flex-grow flex flex-col justify-center items-center text-center w-full px-4 pt-10">
        <h1 
          className="text-white leading-tight" 
          style={{ 
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 900,
            textShadow: "6px 6px 0 #000, 10px 10px 25px rgba(0,0,0,0.9)"
          }}
        >
          <span className="block text-5xl md:text-7xl lg:text-[6rem] tracking-widest mb-2 md:mb-4 text-gray-100">순천향의대</span>
          <span className="block text-5xl md:text-7xl lg:text-[6rem] tracking-widest text-gray-100">폴라리스</span>
        </h1>
      </div>

      {/* 우측 하단 문구 */}
      <div className="absolute bottom-6 right-8 z-20">
        <p 
          className="text-white/70 italic text-xs md:text-sm tracking-widest" 
          style={{ fontFamily: "Georgia, serif" }}
        >
          since. 1982 SCH College of Medicine
        </p>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 각 메뉴별 렌더링 함수들
  // ----------------------------------------------------
  const renderSchedule = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <Calendar size={80} className="text-gray-300 mb-6" />
        <h3 className="text-3xl font-black text-gray-800 mb-4">훈련 및 경기 일정</h3>
        <p className="text-gray-500 text-xl font-medium">캘린더 및 일정 관리 기능이 곧 업데이트될 예정입니다.</p>
      </div>
    </div>
  );

  const renderPhotos = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <Camera size={80} className="text-gray-300 mb-6" />
        <h3 className="text-3xl font-black text-gray-800 mb-4">팀 갤러리</h3>
        <p className="text-gray-500 text-xl font-medium">경기 및 훈련 사진첩 기능이 곧 업데이트될 예정입니다.</p>
      </div>
    </div>
  );

  const renderLockerRoom = () => {
    const allPlayers = [
      ...batters.map(b => ({ ...b, type: '타자' })),
      ...pitchers.map(p => ({ ...p, type: '투수' }))
    ].sort((a, b) => a.uniformNumber - b.uniformNumber); 

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-800">팀 락커룸</h2>
          <p className="text-gray-500 font-bold">총 {allPlayers.length}명의 선수</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {allPlayers.map((player) => (
            <div key={`${player.type}-${player.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 relative border-4 border-slate-800">
                <Shirt size={48} className="text-slate-800 absolute opacity-10" />
                <span className="text-3xl font-black text-slate-800 z-10">{player.uniformNumber}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{player.name}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${player.type === '타자' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {player.position}
              </span>
            </div>
          ))}
          {allPlayers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
              락커룸이 비어 있습니다. 선수를 등록해주세요.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 관리자 화면 렌더링 (대시보드, 타자, 투수 기록 통합)
  const renderAdmin = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-gray-800">관리자 모드</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center space-x-2 transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>선수/기록 등록</span>
        </button>
      </div>

      {/* 관리자 내부 탭 */}
      <div className="flex space-x-3 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
        <button onClick={() => setAdminSubTab('dashboard')} className={`px-6 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'dashboard' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>전체 요약</button>
        <button onClick={() => setAdminSubTab('batters')} className={`px-6 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'batters' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>타자 기록</button>
        <button onClick={() => setAdminSubTab('pitchers')} className={`px-6 py-2 rounded-full font-bold transition-colors whitespace-nowrap ${adminSubTab === 'pitchers' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>투수 기록</button>
      </div>

      {adminSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">등록된 타자</p>
              <h3 className="text-2xl font-bold text-gray-800">{batters.length}명</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">등록된 투수</p>
              <h3 className="text-2xl font-bold text-gray-800">{pitchers.length}명</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">팀 홈런</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {batters.reduce((sum, batter) => sum + batter.homeRuns, 0)}개
              </h3>
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
                      <button 
                        onClick={() => handleDeleteBatter(batter.id)} 
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="선수 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
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
                  <th className="p-4 font-semibold text-right">평균자책점 (ERA)</th>
                  <th className="p-4 font-semibold text-right">경기 (G)</th>
                  <th className="p-4 font-semibold text-right">승 (W)</th>
                  <th className="p-4 font-semibold text-right">패 (L)</th>
                  <th className="p-4 font-semibold text-right">세이브 (SV)</th>
                  <th className="p-4 font-semibold text-right">이닝 (IP)</th>
                  <th className="p-4 font-semibold text-right">탈삼진 (SO)</th>
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
                      <button 
                        onClick={() => handleDeletePitcher(pitcher.id)} 
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="선수 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* ----------------------------------------------------
          공통 최상단 네비게이션 바 (반투명 검은색 적용)
      ---------------------------------------------------- */}
      <nav className="fixed top-0 left-0 w-full h-14 bg-black/60 backdrop-blur-md text-white z-50 border-b border-white/10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* 좌측 로고 */}
          <button 
            onClick={() => setActiveTab('landing')}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo.png" 
              alt="순천향의대 폴라리스 로고" 
              className="h-10 object-contain drop-shadow-md"
            />
          </button>
          
          {/* 우측 메뉴들 (호버 시 밝은 파란색) */}
          <div className="hidden sm:flex space-x-6 md:space-x-12 text-sm md:text-lg font-black tracking-widest">
            <button 
              onClick={() => setActiveTab('schedule')} 
              className={`hover:text-blue-400 transition-colors ${activeTab === 'schedule' ? 'text-blue-400' : ''}`}
            >
              훈련/경기 일정
            </button>
            <button 
              onClick={() => setActiveTab('photos')} 
              className={`hover:text-blue-400 transition-colors ${activeTab === 'photos' ? 'text-blue-400' : ''}`}
            >
              사진
            </button>
            <button 
              onClick={() => setActiveTab('lockerRoom')} 
              className={`hover:text-blue-400 transition-colors ${activeTab === 'lockerRoom' ? 'text-blue-400' : ''}`}
            >
              락커룸
            </button>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`hover:text-blue-400 transition-colors ${activeTab === 'admin' ? 'text-blue-400' : ''}`}
            >
              관리자
            </button>
          </div>

          {/* 모바일용 심플 메뉴 아이콘 (화면이 작을 때 표시) */}
          <div className="sm:hidden flex space-x-4 font-bold text-sm">
            <button onClick={() => setActiveTab('schedule')} className={`hover:text-blue-400 ${activeTab === 'schedule' ? 'text-blue-400' : ''}`}>일정</button>
            <button onClick={() => setActiveTab('lockerRoom')} className={`hover:text-blue-400 ${activeTab === 'lockerRoom' ? 'text-blue-400' : ''}`}>락커룸</button>
            <button onClick={() => setActiveTab('admin')} className={`hover:text-blue-400 ${activeTab === 'admin' ? 'text-blue-400' : ''}`}>관리자</button>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------
          화면 본문 영역
      ---------------------------------------------------- */}
      {/* 랜딩 페이지일 때는 화면 전체를 사용 */}
      {activeTab === 'landing' && renderLanding()}
      
      {/* 다른 메뉴일 때는 상단 네비게이션 바 공간을 띄우고 표시 */}
      {activeTab !== 'landing' && (
        <main className="pt-24 pb-16">
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'photos' && renderPhotos()}
          {activeTab === 'lockerRoom' && renderLockerRoom()}
          {activeTab === 'admin' && renderAdmin()}
        </main>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">새 선수 및 기록 등록</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
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
                        <input type="text" name="position" value={formData.position || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" placeholder="예: 1루수" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-3">
                    <h4 className="font-semibold text-gray-700 mb-3">시즌 기록</h4>
                  </div>
                  
                  {modalType === 'batter' ? (
                    <>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">경기수</label><input type="number" name="games" value={formData.games || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">타수</label><input type="number" name="atBats" value={formData.atBats || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">안타</label><input type="number" name="hits" value={formData.hits || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">홈런</label><input type="number" name="homeRuns" value={formData.homeRuns || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">득점</label><input type="number" name="runs" value={formData.runs || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">타점</label><input type="number" name="rbi" value={formData.rbi || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                    </>
                  ) : (
                    <>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">경기수</label><input type="number" name="games" value={formData.games || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">평균자책점(ERA)</label><input type="number" step="0.01" name="era" value={formData.era || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" placeholder="예: 3.45" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">승</label><input type="number" name="wins" value={formData.wins || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">패</label><input type="number" name="losses" value={formData.losses || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">세이브</label><input type="number" name="saves" value={formData.saves || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">이닝</label><input type="number" name="innings" value={formData.innings || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">탈삼진</label><input type="number" name="strikeouts" value={formData.strikeouts || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" /></div>
                    </>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors">
                취소
              </button>
              <button type="submit" form="add-record-form" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm">
                기록 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}