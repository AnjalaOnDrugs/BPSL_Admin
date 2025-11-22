import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Users,
  Edit3,
  Cake,
  Settings,
  Search,
  Phone,
  ArrowRight,
  Loader,
  Wifi,
  WifiOff,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Gift,
  Sparkles,
  LayoutDashboard,
  Wand2
} from 'lucide-react';
import BirthdayCardGenerator from './BirthdayCardGenerator';

// --- MOCK DATA (Fallback) ---
const MOCK_DATA = [
  { id: 2, name: "Anjala Botejue", phone: "0714545776", status: "In Group", dateAdded: "2023-10-01", birthday: "1990-10-02", bias: "Lisa" },
  { id: 3, name: "Hashan Perera", phone: "0714500000", status: "Removed", dateAdded: "2023-10-05", birthday: "1995-10-02", bias: "Jennie" },
  { id: 4, name: "Kamal Gunaratne", phone: "0771234567", status: "No Response", dateAdded: "2023-09-28", birthday: "1988-12-15", bias: "Rose" },
  { id: 5, name: "Nimali Silva", phone: "0709988776", status: "Not Contacted", dateAdded: "2023-10-06", birthday: "1992-05-20", bias: "Jisoo" },
  { id: 6, name: "Dilshan M", phone: "0711111111", status: "In Group", dateAdded: "2023-01-01", birthday: "1994-01-15", bias: "OT4" },
];

// --- CONFIGURATION ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMDTDpuTGNZlFuKBdmqbAbdEFzUDgWqNG4QXWNVqb4g-cXv_PISguKITFZxhLZ5jMTtw/exec";

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'members', 'birthdays'
  const [selectedMember, setSelectedMember] = useState(null); // For side panel
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_NEW_DEPLOYMENT_ID")) {
      setConnectionStatus('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const json = await response.json();

      if (json.status === 'success') {
        setData(json.data);
        setConnectionStatus('connected');
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error(error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- UPDATE STATUS ---
  const handleUpdateStatus = async (memberId, newStatus) => {
    const updatedData = data.map(m => m.id === memberId ? { ...m, status: newStatus } : m);
    setData(updatedData);
    setSelectedMember(prev => ({ ...prev, status: newStatus }));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ id: memberId, status: newStatus }),
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to save to Google Sheet.");
    }
  };

  // --- DERIVED DATA ---
  const filteredMembers = useMemo(() => {
    return data.filter(member => {
      const name = member.name || '';
      const phone = member.phone || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone && phone.toString().includes(searchTerm));

      if (filter === 'All') return matchesSearch;
      if (filter === 'Main') return matchesSearch && member.status === 'In Group';
      if (filter === 'Pending') return matchesSearch && (member.status === 'No Response' || member.status === 'Not Contacted');
      if (filter === 'Learning') return matchesSearch && member.status === 'Removed';

      return matchesSearch;
    });
  }, [data, searchTerm, filter]);

  const waitingCount = data.filter(m => m.status === 'No Response' || m.status === 'Not Contacted').length;

  const recentlyAdded = [...data]
    .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
    .slice(0, 3);

  // Simple upcoming for dashboard preview (Top 3)
  const upcomingBirthdaysPreview = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    return data
      .filter(m => {
        const d = new Date(m.birthday);
        return !isNaN(d) && d.getMonth() >= currentMonth && m.status === 'In Group';
      })
      .sort((a, b) => new Date(a.birthday).getMonth() - new Date(b.birthday).getMonth())
      .slice(0, 3);
  }, [data]);

  // FULL Timeline Logic
  const fullBirthdayTimeline = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data
      .filter(m => m.birthday && !isNaN(new Date(m.birthday).getTime()) && m.status === 'In Group')
      .map(m => {
        const bday = new Date(m.birthday);
        const currentYear = today.getFullYear();

        // Create date object for this year's birthday
        let nextBday = new Date(currentYear, bday.getMonth(), bday.getDate());

        // If birthday has passed this year, move to next year
        if (nextBday < today) {
          nextBday.setFullYear(currentYear + 1);
        }

        const diffTime = nextBday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...m,
          nextBday,
          diffDays,
          ageTurning: nextBday.getFullYear() - bday.getFullYear()
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [data]);


  // --- UI HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Group': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]';
      case 'Removed': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
      case 'No Response': return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-gray-100 font-sans selection:bg-pink-500 selection:text-white overflow-hidden">

      {/* --- SIDEBAR --- */}
      <nav className="w-20 h-full flex flex-col items-center py-8 border-r border-gray-900/50 bg-black z-20 shadow-2xl relative">
        {/* Glow Strip */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-pink-900/40 to-transparent blur-sm"></div>

        <div className="flex flex-col space-y-10 mt-10">
          <NavIcon icon={<User size={24} />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <NavIcon icon={<LayoutDashboard size={24} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavIcon icon={<Users size={24} />} active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
          <NavIcon icon={<Edit3 size={24} />} active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
          <NavIcon icon={<Cake size={24} />} active={activeTab === 'birthdays'} onClick={() => setActiveTab('birthdays')} />
          <NavIcon icon={<Settings size={24} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="mt-auto mb-4">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto relative z-10">

          {/* Header */}
          <header className="mb-10 flex justify-between items-center">
            <h1 className="text-xl tracking-[0.2em] text-pink-200/80 font-light uppercase">
              {activeTab === 'dashboard' ? 'Dashboard' :
                activeTab === 'birthdays' ? 'Celebration Timeline' : 'Members'}
            </h1>
            {loading && <Loader className="animate-spin text-cyan-500" size={20} />}
          </header>

          {/* ==================== DASHBOARD VIEW ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* KPI Card */}
                <div
                  onClick={() => { setFilter('Pending'); setActiveTab('members'); }}
                  className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-6 rounded-sm relative group hover:border-pink-500/30 transition-colors duration-500 cursor-pointer"
                >
                  <div className="absolute top-4 right-4 text-gray-500 group-hover:text-pink-400 transition-colors">
                    <Edit3 size={20} />
                  </div>
                  <div className="flex items-baseline space-x-3 mt-4">
                    <span className="text-6xl font-light text-white">{waitingCount}</span>
                    <span className="text-lg tracking-widest text-gray-400 uppercase">Waiting</span>
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                    View <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>

                {/* Recently Added */}
                <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-6 rounded-sm relative">
                  <div className="absolute top-4 right-4 text-gray-500">
                    <Users size={20} />
                  </div>
                  <h3 className="text-xs tracking-widest text-pink-200/70 uppercase mb-6">Recently Added</h3>
                  <div className="space-y-4">
                    {recentlyAdded.map((user, i) => (
                      <div key={user.id || i} className="flex justify-between items-center border-b border-gray-800/50 pb-2 last:border-0">
                        <div>
                          <div className="text-sm text-gray-200">{user.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{user.phone}</div>
                        </div>
                        <button onClick={() => setSelectedMember(user)} className="text-cyan-400 text-xs hover:text-white">View</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('members')} className="absolute bottom-4 right-4 flex items-center text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                    View <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Birthdays Preview */}
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-8 rounded-sm relative">
                <div className="absolute top-6 right-6 text-pink-400">
                  <Cake size={24} />
                </div>
                <h3 className="text-xs tracking-widest text-pink-200/70 uppercase mb-8">Upcoming Birthdays</h3>
                <div className="space-y-6 border-l border-cyan-900/50 ml-2 pl-6 relative">
                  {upcomingBirthdaysPreview.map((user, i) => {
                    const date = new Date(user.birthday);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const day = date.getDate();
                    return (
                      <div key={user.id || i} className="relative group cursor-pointer" onClick={() => setSelectedMember(user)}>
                        <div className="absolute -left-[27.5px] top-1 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-cyan-500 mr-3 uppercase">{month} {day}</span>
                            <span className="text-gray-300 font-light">{user.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setActiveTab('birthdays')} className="absolute bottom-6 right-6 flex items-center text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                  View Full Timeline <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ==================== MEMBERS VIEW ==================== */}
          {activeTab === 'members' && (
            <div className="animate-in fade-in duration-500">
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search .."
                  className="w-full bg-gray-900/30 border border-gray-700 rounded-full py-3 pl-12 pr-4 text-gray-300 focus:outline-none focus:border-pink-500/50 transition-colors placeholder-gray-600 font-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {['All', 'Learning', 'Main', 'Pending'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1 rounded-full text-xs md:text-sm transition-all duration-300 ${filter === f
                      ? 'bg-green-500 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredMembers.map((member, i) => (
                  <div key={member.id || i} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-800 bg-gray-900/20 p-3 rounded-md hover:border-gray-700 hover:bg-gray-900/40 transition-all duration-300 gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 w-full sm:w-auto overflow-hidden">
                      <div className="text-gray-400 group-hover:text-pink-400 transition-colors shrink-0">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 text-sm truncate">{member.name || 'Unknown'}</div>
                        <div className="flex items-center text-gray-500 text-xs font-mono mt-0.5">
                          <Phone size={12} className="mr-1" />
                          {member.phone || '--'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto space-x-4 pl-8 sm:pl-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(member.status)} transition-all duration-500 shrink-0`}></div>
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="bg-gradient-to-r from-cyan-900/40 to-cyan-600/20 hover:from-cyan-500 hover:to-cyan-400 text-cyan-400 hover:text-black border border-cyan-500/30 hover:border-cyan-400 px-4 py-1 rounded text-[10px] sm:text-xs uppercase tracking-wider font-medium transition-all duration-300 flex items-center shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== NEW BIRTHDAY TIMELINE VIEW ==================== */}
          {activeTab === 'birthdays' && (
            <div className="animate-in fade-in duration-500 relative">

              {fullBirthdayTimeline.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">No birthday data available.</div>
              ) : (
                <div className="relative max-w-3xl mx-auto pb-20">

                  {/* The Infinite Neon Line */}
                  <div className="absolute left-[27px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-pink-500 to-purple-900 opacity-50"></div>

                  <div className="space-y-8">
                    {fullBirthdayTimeline.map((member, index) => {
                      const isNext = index === 0; // The very next birthday
                      const date = member.nextBday;
                      const month = date.toLocaleString('default', { month: 'short' });
                      const day = date.getDate();
                      const dayOfWeek = date.toLocaleString('default', { weekday: 'long' });

                      return (
                        <div key={member.id} className="relative pl-20">

                          {/* Timeline Node */}
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center border-4 z-10 bg-gray-900 transition-all duration-500 ${isNext ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110' : 'border-gray-800 group-hover:border-pink-500'
                            }`}>
                            <div className="text-center leading-none">
                              <div className={`text-[9px] font-bold uppercase ${isNext ? 'text-cyan-400' : 'text-gray-500'}`}>{month}</div>
                              <div className={`text-lg font-bold ${isNext ? 'text-white' : 'text-gray-300'}`}>{day}</div>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div
                            onClick={() => setSelectedMember(member)}
                            className={`p-6 rounded-xl border relative overflow-hidden cursor-pointer transition-all duration-500 group ${isNext
                              ? 'bg-gradient-to-r from-gray-900 to-cyan-900/20 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-105'
                              : 'bg-gray-900/40 border-gray-800 hover:border-pink-500/30 hover:bg-gray-900/60'
                              }`}>

                            {isNext && (
                              <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                            )}

                            <div className="flex justify-between items-center relative z-10">
                              <div>
                                {isNext && (
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                      Up Next
                                    </span>
                                    <span className="text-cyan-400 text-xs font-mono">
                                      {member.diffDays === 0 ? "TODAY!" : `In ${member.diffDays} days`}
                                    </span>
                                  </div>
                                )}

                                <h3 className={`text-lg font-light ${isNext ? 'text-white' : 'text-gray-200'}`}>{member.name}</h3>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <Gift size={14} className="mr-2" />
                                  Turning {member.ageTurning} on {dayOfWeek}
                                </div>
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-cyan-400">
                                  <ChevronRight size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom of Timeline */}
                  <div className="text-center mt-12 text-gray-600 text-sm italic flex flex-col items-center">
                    <div className="w-0.5 h-12 bg-gradient-to-b from-purple-900 to-transparent mb-4"></div>
                    <Sparkles size={16} className="mb-2 text-purple-500" />
                    End of upcoming celebrations
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* --- SIDE PANEL (Existing) --- */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedMember(null)}
          ></div>

          <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-black/40">
              <div>
                <h2 className="text-2xl text-white font-light">{selectedMember.name}</h2>
                <p className="text-cyan-500 font-mono mt-1">{selectedMember.phone}</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Status</label>
                <StatusSelector
                  currentStatus={selectedMember.status}
                  onUpdate={(newStatus) => handleUpdateStatus(selectedMember.id, newStatus)}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DetailItem icon={<Calendar size={16} />} label="Birthday" value={selectedMember.birthday ? new Date(selectedMember.birthday).toLocaleDateString() : '--'} />
                <DetailItem icon={<Clock size={16} />} label="Added On" value={selectedMember.dateAdded ? new Date(selectedMember.dateAdded).toLocaleDateString() : '--'} />
              </div>

              <div className="pt-6 border-t border-gray-800">
                <button
                  onClick={() => setShowGenerator(true)}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-500/20 transition-all transform active:scale-95 flex items-center justify-center"
                >
                  <Wand2 size={18} className="mr-2" /> Generate Birthday Wish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerator && selectedMember && (
        <BirthdayCardGenerator
          member={selectedMember}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-all duration-300 relative group ${active ? 'text-pink-500' : 'text-gray-500 hover:text-gray-300'
      }`}
  >
    {active && <div className="absolute inset-0 bg-pink-500/10 rounded-xl blur-md"></div>}
    <div className="relative z-10">{icon}</div>
  </button>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-1 text-gray-600">{icon}</div>
    <div>
      <label className="text-[10px] font-bold text-gray-600 uppercase block">{label}</label>
      <span className="text-gray-300 text-sm">{value}</span>
    </div>
  </div>
);

const StatusSelector = ({ currentStatus, onUpdate }) => {
  const statuses = [
    { id: 'Not Contacted', label: 'Not Contacted', color: 'bg-white' },
    { id: 'No Response', label: 'No Response', color: 'bg-yellow-400' },
    { id: 'In Group', label: 'In Group', color: 'bg-green-500' },
    { id: 'Removed', label: 'Removed', color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 gap-2">
      {statuses.map(s => (
        <button
          key={s.id}
          onClick={() => onUpdate(s.id)}
          className={`flex items-center justify-between p-3 rounded border transition-all ${currentStatus === s.id
            ? 'bg-gray-800 border-cyan-500 ring-1 ring-cyan-500/50'
            : 'bg-black/20 border-gray-800 hover:bg-gray-800'
            }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${s.color} shadow-[0_0_8px_currentColor]`}></div>
            <span className={`text-sm ${currentStatus === s.id ? 'text-white' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {currentStatus === s.id && <CheckCircle size={16} className="text-cyan-500" />}
        </button>
      ))}
    </div>
  );
}

export default App;