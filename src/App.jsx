import React, { useState } from 'react';
import { Home, Users, Activity, Plus, Trophy, X, Shirt } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('batter');

  // 샘플 타자 데이터 (등번호, 포지션 추가)
  const [batters, setBatters] = useState([
    { id: 1, name: '김타자', uniformNumber: 15, position: '중견수', games: 120, atBats: 400, runs: 80, hits: 120, homeRuns: 20, rbi: 75, avg: '0.300' },
    { id: 2, name: '이거포', uniformNumber: 52, position: '1루수', games: 115, atBats: 380, runs: 65, hits: 95, homeRuns: 30, rbi: 90, avg: '0.250' },
    { id: 3, name: '박교타', uniformNumber: 7, position: '유격수', games: 130, atBats: 450, runs: 90, hits: 150, homeRuns: 5, rbi: 45, avg: '0.333' },
  ]);

  // 샘플 투수 데이터 (등번호, 포지션 추가)
  const [pitchers, setPitchers] = useState([
    { id: 1, name: '최에이스', uniformNumber: 1, position: '선발투수', games: 25, wins: 15, losses: 5, saves: 0, innings: 160, strikeouts: 150, era: '2.45' },
    { id: 2, name: '정마무리', uniformNumber: 21, position: '마무리투수', games: 50, wins: 3, losses: 2, saves: 30, innings: 55, strikeouts: 60, era: '1.85' },
  ]);

  // 새 기록 폼 상태 (등번호, 포지션 추가)
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
    setFormData({}); // 폼 초기화
  };

  // 대시보드 렌더링
  const renderDashboard = () => (
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
  );

  // 락커룸 렌더링
  const renderLockerRoom = () => {
    const allPlayers = [
      ...batters.map(b => ({ ...b, type: '타자' })),
      ...pitchers.map(p => ({ ...p, type: '투수' }))
    ].sort((a, b) => a.uniformNumber - b.uniformNumber); // 등번호 순 정렬

    return (
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
    );
  };

  const renderBatterTable = () => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPitcherTable = () => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              {/* 팀 로고 이미지 부분 */}
              <img 
                src="/logo.png" 
                alt="순천향의대 폴라리스 로고" 
                className="w-10 h-10 rounded-full border-2 border-blue-400 object-contain bg-white p-0.5"
              />
              <span className="text-xl font-bold tracking-tight">순천향의대 폴라리스</span>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus size={18} />
              <span>선수 등록</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-200/50 p-1 rounded-xl inline-flex overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">대시보드</span>
          </button>
          <button
            onClick={() => setActiveTab('lockerRoom')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'lockerRoom' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shirt size={18} />
            <span className="hidden sm:inline">락커룸</span>
          </button>
          <button
            onClick={() => setActiveTab('batters')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'batters' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            <span className="hidden sm:inline">타자 기록</span>
          </button>
          <button
            onClick={() => setActiveTab('pitchers')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'pitchers' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity size={18} />
            <span className="hidden sm:inline">투수 기록</span>
          </button>
        </div>

        {/* Dynamic Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'lockerRoom' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">팀 락커룸</h2>
              <p className="text-gray-500">총 {batters.length + pitchers.length}명의 선수</p>
            </div>
            {renderLockerRoom()}
          </div>
        )}
        {activeTab === 'batters' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">타자 상세 기록</h2>
            {renderBatterTable()}
          </div>
        )}
        {activeTab === 'pitchers' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">투수 상세 기록</h2>
            {renderPitcherTable()}
          </div>
        )}

      </main>

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
                  {/* 기본 정보 */}
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

                  {/* 기록 정보 */}
                  <div className="col-span-2 md:col-span-3">
                    <h4 className="font-semibold text-gray-700 mb-3">시즌 기록</h4>
                  </div>
                  
                  {modalType === 'batter' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">경기수</label>
                        <input type="number" name="games" value={formData.games || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">타수</label>
                        <input type="number" name="atBats" value={formData.atBats || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">안타</label>
                        <input type="number" name="hits" value={formData.hits || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">홈런</label>
                        <input type="number" name="homeRuns" value={formData.homeRuns || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">득점</label>
                        <input type="number" name="runs" value={formData.runs || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">타점</label>
                        <input type="number" name="rbi" value={formData.rbi || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">경기수</label>
                        <input type="number" name="games" value={formData.games || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">평균자책점(ERA)</label>
                        <input type="number" step="0.01" name="era" value={formData.era || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" placeholder="예: 3.45" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">승</label>
                        <input type="number" name="wins" value={formData.wins || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">패</label>
                        <input type="number" name="losses" value={formData.losses || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">세이브</label>
                        <input type="number" name="saves" value={formData.saves || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이닝</label>
                        <input type="number" name="innings" value={formData.innings || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">탈삼진</label>
                        <input type="number" name="strikeouts" value={formData.strikeouts || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" min="0" />
                      </div>
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