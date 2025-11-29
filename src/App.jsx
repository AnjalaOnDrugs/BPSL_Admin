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
  Wand2,
  UserPlus,
  Check,
  Save,
  MessageSquare,
  Star,
  MessageCircle,
  Plus,
  Trash2,
  Bell
} from 'lucide-react';
import BirthdayCardGenerator from './BirthdayCardGenerator';
import WhatsappModal from './WhatsappModal';
import useSwipe from './hooks/useSwipe';

// --- MOCK DATA (Fallback) ---
const MOCK_DATA = [
  { id: 2, name: "Anjala Botejue", phone: "0714545776", status: "In Group", dateAdded: "2023-10-01", birthday: "1990-10-02", bias: "Lisa", score: 5, comments: "Active member" },
  { id: 3, name: "Hashan Perera", phone: "0714500000", status: "Removed", dateAdded: "2023-10-05", birthday: "1995-10-02", bias: "Jennie", score: 2, comments: "Removed due to inactivity" },
  { id: 4, name: "Kamal Gunaratne", phone: "0771234567", status: "Contacted", dateAdded: "2023-09-28", birthday: "1988-12-15", bias: "Rose", score: 3, comments: "No reply yet" },
  { id: 5, name: "Nimali Silva", phone: "0709988776", status: "Not Contacted", dateAdded: "2023-10-06", birthday: "1992-05-20", bias: "Jisoo", score: 4, comments: "To be contacted" },
  { id: 6, name: "Dilshan M", phone: "0711111111", status: "In Group", dateAdded: "2023-01-01", birthday: "1994-01-15", bias: "OT4", score: 1, comments: "Low score" },
];

// --- CONFIGURATION ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMDTDpuTGNZlFuKBdmqbAbdEFzUDgWqNG4QXWNVqb4g-cXv_PISguKITFZxhLZ5jMTtw/exec";

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'members', 'birthdays'
  const [selectedMember, setSelectedMember] = useState(null); // For side panel
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Main');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Editable fields state
  const [editName, setEditName] = useState('');
  const [editComments, setEditComments] = useState('');

  // WhatsApp & Admin State
  const [whatsappConfig, setWhatsappConfig] = useState({
    initialMessages: [],
    categories: []
  });
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // --- SWIPE LOGIC ---
  const tabOrder = ['dashboard', 'members', 'birthdays', 'edit'];

  const handleSwipeLeft = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const swipeHandlers = useSwipe({ onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight });

  useEffect(() => {
    const savedName = localStorage.getItem('bpsl_admin_name');
    if (savedName) {
      setAdminName(savedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

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
        if (json.whatsappConfig) {
          setWhatsappConfig({
            initialMessages: [],
            categories: [],
            ...json.whatsappConfig
          });
        }
        if (json.notificationEnabled !== undefined) {
          setNotificationEnabled(json.notificationEnabled);
        }
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

  // Sync local edit state when selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      setEditName(selectedMember.name || '');
      setEditComments(selectedMember.comments || '');
    }
  }, [selectedMember]);

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

  // --- UPDATE MEMBER DETAILS (Name, Comments) ---
  const handleUpdateMemberDetails = async () => {
    if (!selectedMember) return;

    const updatedMember = { ...selectedMember, name: editName, comments: editComments };

    // Optimistic update
    const updatedData = data.map(m => m.id === selectedMember.id ? updatedMember : m);
    setData(updatedData);
    setSelectedMember(updatedMember);

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: 'updateMemberDetails',
          id: selectedMember.id,
          name: editName,
          comments: editComments
        }),
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.error("Update details failed", error);
      alert("Failed to save details.");
    }
  };

  // --- SAVE CONTACT ---
  const handleSaveContact = async (member) => {
    if (!member.phone) {
      alert("No phone number to save.");
      return;
    }

    try {
      // Optimistic update
      const updatedData = data.map(m => m.id === member.id ? { ...m, isSaved: true } : m);
      setData(updatedData);
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember(prev => ({ ...prev, isSaved: true }));
      }

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'saveContact', name: member.name, phone: member.phone }),
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" }
      });

    } catch (error) {
      console.error("Save contact failed", error);
      alert("Failed to save contact.");
    }
  };

  // --- SAVE WHATSAPP CONFIG ---
  const handleSaveWhatsappConfig = async (newConfig) => {
    setWhatsappConfig(newConfig); // Optimistic update

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'updateWhatsappConfig', config: newConfig }),
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.error("Save config failed", error);
      alert("Failed to save configuration.");
    }
  };

  const handleSaveAdminName = () => {
    if (adminName.trim()) {
      localStorage.setItem('bpsl_admin_name', adminName);
      setShowNamePrompt(false);
    } else {
      alert("Please enter your name.");
    }
  };

  // --- NOTIFICATION SETUP ---
  // --- NOTIFICATION SETUP ---
  const handleToggleNotifications = async (enabled) => {
    // Optimistic update
    setNotificationEnabled(enabled);

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'setNotifications', enabled: enabled }),
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" }
      });
      // Since no-cors, we can't read response, but we assume success or catch error
    } catch (error) {
      console.error("Toggle notifications failed", error);
      alert("Failed to update notification settings.");
      setNotificationEnabled(!enabled); // Revert on error
    }
  };

  // --- DERIVED DATA ---
  const filteredMembers = useMemo(() => {
    return data.filter(member => {
      const name = member.name || '';
      const phone = member.phone || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone && phone.toString().includes(searchTerm));

      if (!matchesSearch) return false;

      if (filter === 'Main') return member.status === 'In Group';
      if (filter === 'Contacted') return member.status === 'Contacted';
      if (filter === 'Pending') return member.status === 'Not Contacted';
      if (filter === 'Removed') return member.status === 'Removed';

      return true;
    });
  }, [data, searchTerm, filter]);

  const waitingCount = data.filter(m => m.status === 'Contacted' || m.status === 'Not Contacted').length;

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
      case 'Contacted': return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-black font-sans text-gray-300 overflow-hidden selection:bg-pink-500/30">

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 flex justify-around items-center z-50 px-2">
        <NavIcon icon={<LayoutDashboard size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={<Users size={20} />} active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
        <NavIcon icon={<Cake size={20} />} active={activeTab === 'birthdays'} onClick={() => setActiveTab('birthdays')} />
        <NavIcon icon={<Edit3 size={20} />} active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-20 bg-gray-900 border-r border-gray-800 items-center py-8 space-y-8 z-50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="font-bold text-white text-xl">N</span>
        </div>
        <div className="flex flex-col space-y-4 w-full px-2">
          <NavIcon icon={<LayoutDashboard size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavIcon icon={<Users size={20} />} active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
          <NavIcon icon={<Cake size={20} />} active={activeTab === 'birthdays'} onClick={() => setActiveTab('birthdays')} />
          <NavIcon icon={<Edit3 size={20} />} active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
        </div>
        <div className="mt-auto pb-4">
          <button className="p-3 text-gray-600 hover:text-gray-400 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto pb-24 md:pb-8 relative" {...swipeHandlers}>

        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-thin text-white tracking-tight">
              Good Evening, <span className="text-cyan-400 font-normal">{adminName || 'Admin'}</span>
            </h1>
            <p className="text-gray-500 mt-2 flex items-center text-sm">
              {loading ? (
                <><Loader size={14} className="animate-spin mr-2" /> Syncing...</>
              ) : (
                <>
                  {connectionStatus === 'connected' ? <Wifi size={14} className="mr-2 text-green-500" /> : <WifiOff size={14} className="mr-2 text-red-500" />}
                  {connectionStatus === 'connected' ? 'System Online' : 'Connection Error'}
                  <span className="mx-2">-</span>
                  {lastRefreshed ? `Last synced: ${lastRefreshed.toLocaleTimeString()}` : ''}
                </>
              )}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{data.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">Total Members</div>
            </div>
          </div>
        </header>

        {/* ==================== DASHBOARD VIEW ==================== */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500 space-y-6">
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
              </div >

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
              </div >
            </div >

            {/* Bottom Row: Birthdays Preview */}
            < div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-8 rounded-sm relative" >
              <div className="absolute top-6 right-6 text-pink-400">
                <Cake size={24} />
              </div>
              <h3 className="text-xs tracking-widest text-pink-200/70 uppercase mb-8">Upcoming Birthdays</h3>
              <div className="space-y-6 border-l border-cyan-900/50 ml-2 pl-6 relative mb-6">
                {upcomingBirthdaysPreview.map((user, i) => {
                  const date = new Date(user.birthday);
                  const month = date.toLocaleString('default', { month: 'short' });
                  const day = date.getDate();
                  return (
                    <div key={user.id || i} className="relative group cursor-pointer" onClick={() => setSelectedMember(user)}>
                      <div className="absolute -left-[27.5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
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
              <div className="flex justify-end">
                <button onClick={() => setActiveTab('birthdays')} className="flex items-center text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                  View Full Timeline <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div >
          </div >
        )}

        {/* ==================== MEMBERS VIEW ==================== */}
        {
          activeTab === 'members' && (
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

              {/* TABS */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {[
                  { id: 'Main', label: 'In Group', color: 'text-green-500' },
                  { id: 'Contacted', label: 'Contacted', color: 'text-yellow-400' },
                  { id: 'Pending', label: 'Not Contacted', color: 'text-gray-400' },
                  { id: 'Removed', label: 'Removed', color: 'text-red-500' }
                ].map(tab => {
                  // Calculate count for this tab
                  const count = data.filter(m => {
                    if (tab.id === 'Main') return m.status === 'In Group';
                    if (tab.id === 'Contacted') return m.status === 'Contacted';
                    if (tab.id === 'Pending') return m.status === 'Not Contacted';
                    if (tab.id === 'Removed') return m.status === 'Removed';
                    return false;
                  }).length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm transition-all duration-300 border ${filter === tab.id
                        ? 'bg-gray-900 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'bg-gray-900/40 border-gray-800 hover:border-gray-600'
                        }`}
                    >
                      <span className={`font-medium ${filter === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 ${tab.color}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {filteredMembers.map((member, i) => (
                  <div key={member.id || i} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-800 bg-gray-900/20 p-3 rounded-md hover:border-gray-700 hover:bg-gray-900/40 transition-all duration-300 gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 w-full sm:w-auto overflow-hidden">
                      <div className="text-gray-400 group-hover:text-pink-400 transition-colors shrink-0">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="text-gray-200 text-sm truncate font-medium">{member.name || 'Unknown'}</div>
                          {/* Score Display */}
                          {member.score && (
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${member.score <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                              {member.score}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-gray-500 text-xs font-mono mt-0.5">
                          <Phone size={12} className="mr-1" />
                          {member.phone || '--'}
                          {member.bias && (
                            <span className="ml-2 text-pink-500/70">â€¢ {member.bias}</span>
                          )}
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
          )
        }

        {/* ==================== NEW BIRTHDAY TIMELINE VIEW ==================== */}
        {
          activeTab === 'birthdays' && (
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
          )
        }
        {/* ==================== EDIT VIEW (WhatsApp Config) ==================== */}
        {activeTab === 'edit' && (
          <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-12 pb-20">



            {/* Initial Messages Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-xl font-light text-green-400 flex items-center">
                  <MessageCircle className="mr-3" size={24} /> Initial Messages
                </h3>
                <button
                  onClick={() => {
                    const newConfig = { ...whatsappConfig };
                    newConfig.initialMessages.push("New message template...");
                    handleSaveWhatsappConfig(newConfig);
                  }}
                  className="flex items-center text-xs font-bold uppercase tracking-wider bg-green-500/10 hover:bg-green-500/20 text-green-500 px-4 py-2 rounded-full transition-colors"
                >
                  <Plus size={14} className="mr-2" /> Add Template
                </button>
              </div>

              <div className="grid gap-4">
                {whatsappConfig?.initialMessages.map((msg, i) => (
                  <div key={i} className="group relative bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all">
                    <textarea
                      value={msg}
                      onChange={(e) => {
                        const newConfig = { ...whatsappConfig };
                        newConfig.initialMessages[i] = e.target.value;
                        setWhatsappConfig(newConfig); // Optimistic
                      }}
                      onBlur={() => handleSaveWhatsappConfig(whatsappConfig)} // Save on blur
                      className="w-full bg-transparent text-gray-300 text-sm focus:outline-none resize-none min-h-[60px]"
                      placeholder="Enter message template..."
                    />
                    <button
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          const newConfig = { ...whatsappConfig };
                          newConfig.initialMessages.splice(i, 1);
                          handleSaveWhatsappConfig(newConfig);
                        }
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="mt-2 text-[10px] text-gray-600 font-mono">
                      Use <span className="text-green-500">{`{{ Name }}`}</span> for admin name placeholder
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-xl font-light text-pink-400 flex items-center">
                  <MessageSquare className="mr-3" size={24} /> Questions & Categories
                </h3>
                <button
                  onClick={() => {
                    const name = prompt("Enter new category name:");
                    if (name) {
                      const newConfig = { ...whatsappConfig };
                      newConfig.categories.push({ name, questions: [] });
                      handleSaveWhatsappConfig(newConfig);
                    }
                  }}
                  className="flex items-center text-xs font-bold uppercase tracking-wider bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 px-4 py-2 rounded-full transition-colors"
                >
                  <Plus size={14} className="mr-2" /> Add Category
                </button>
              </div>

              <div className="grid gap-8">
                {whatsappConfig?.categories.map((cat, catIndex) => (
                  <div key={catIndex} className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <span className="text-pink-500 font-medium uppercase tracking-widest text-sm">{cat.name}</span>
                        <span className="bg-gray-800 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{cat.questions.length} Questions</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}" and all its questions?`)) {
                            const newConfig = { ...whatsappConfig };
                            newConfig.categories.splice(catIndex, 1);
                            handleSaveWhatsappConfig(newConfig);
                          }
                        }}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 pl-4 border-l-2 border-gray-800">
                      {cat.questions.map((q, qIndex) => (
                        <div key={qIndex} className="group flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-pink-500 transition-colors"></div>
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => {
                              const newConfig = { ...whatsappConfig };
                              newConfig.categories[catIndex].questions[qIndex] = e.target.value;
                              setWhatsappConfig(newConfig);
                            }}
                            onBlur={() => handleSaveWhatsappConfig(whatsappConfig)}
                            className="flex-1 bg-transparent border-b border-transparent focus:border-pink-500/50 text-gray-300 text-sm py-1 focus:outline-none transition-colors"
                          />
                          <button
                            onClick={() => {
                              const newConfig = { ...whatsappConfig };
                              newConfig.categories[catIndex].questions.splice(qIndex, 1);
                              handleSaveWhatsappConfig(newConfig);
                            }}
                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newConfig = { ...whatsappConfig };
                          newConfig.categories[catIndex].questions.push("New question...");
                          handleSaveWhatsappConfig(newConfig);
                        }}
                        className="mt-4 flex items-center text-xs text-gray-500 hover:text-pink-400 transition-colors"
                      >
                        <Plus size={12} className="mr-1" /> Add Question
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications Section (Moved to Bottom) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-xl font-light text-purple-400 flex items-center">
                  <Bell className="mr-3" size={24} /> Birthday Notifications
                </h3>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-medium mb-1">Daily Email Alerts</h4>
                  <p className="text-sm text-gray-500">
                    Receive an email at 10:00 PM if any member has a birthday tomorrow.
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationEnabled}
                      onChange={(e) => handleToggleNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300">
                      {notificationEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}


      </main >

      {/* --- SIDE PANEL --- */}
      {
        selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSelectedMember(null)}
            ></div>

            <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-black/40">
                <div className="w-full">
                  {/* Editable Name */}
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-transparent text-2xl text-white font-light border-b border-transparent focus:border-cyan-500 focus:outline-none w-full mr-2"
                      placeholder="Name"
                    />
                    <button onClick={handleUpdateMemberDetails} className="text-cyan-500 hover:text-cyan-400">
                      <Save size={20} />
                    </button>
                  </div>

                  <p className="text-cyan-500 font-mono mt-1">{selectedMember.phone}</p>

                  {/* Contact Status Badge */}
                  <div className="mt-2 flex items-center space-x-2">
                    {selectedMember.isSaved ? (
                      <span className="inline-flex items-center text-green-500 text-xs font-bold uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-full">
                        <Check size={12} className="mr-1" /> Contact Saved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSaveContact(selectedMember)}
                        className="inline-flex items-center text-pink-400 hover:text-pink-300 text-xs font-bold uppercase tracking-wider bg-pink-500/10 hover:bg-pink-500/20 px-2 py-1 rounded-full transition-colors"
                      >
                        <UserPlus size={12} className="mr-1" /> Save Contact
                      </button>
                    )}

                    {/* WhatsApp Trigger */}
                    <button
                      onClick={() => setShowWhatsappModal(true)}
                      className="inline-flex items-center text-green-400 hover:text-green-300 text-xs font-bold uppercase tracking-wider bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded-full transition-colors"
                    >
                      <MessageCircle size={12} className="mr-1" /> WhatsApp
                    </button>
                  </div>
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

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem icon={<Calendar size={16} />} label="Birthday" value={selectedMember.birthday ? new Date(selectedMember.birthday).toLocaleDateString() : '--'} />
                  <DetailItem icon={<Clock size={16} />} label="Added On" value={selectedMember.dateAdded ? new Date(selectedMember.dateAdded).toLocaleDateString() : '--'} />
                  <DetailItem icon={<Star size={16} />} label="Score" value={selectedMember.score || '--'} />
                  <DetailItem icon={<User size={16} />} label="Bias" value={selectedMember.bias || '--'} />
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <MessageSquare size={14} className="mr-2" /> Comments
                  </label>
                  <textarea
                    value={editComments}
                    onChange={(e) => setEditComments(e.target.value)}
                    className="w-full bg-black/20 border border-gray-800 rounded-lg p-3 text-gray-300 text-sm focus:border-cyan-500 focus:outline-none min-h-[100px]"
                    placeholder="Add comments..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdateMemberDetails}
                      className="text-xs text-cyan-500 hover:text-cyan-400 font-medium uppercase tracking-wider"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800">
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="w-full bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-pink-500/50 text-gray-400 hover:text-pink-400 font-medium py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center uppercase tracking-wider text-xs"
                  >
                    <Wand2 size={16} className="mr-2" /> Generate Birthday Wish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* --- MODALS --- */}
      {
        showGenerator && selectedMember && (
          <BirthdayCardGenerator
            member={selectedMember}
            onClose={() => setShowGenerator(false)}
          />
        )
      }

      {
        showWhatsappModal && selectedMember && (
          <WhatsappModal
            member={selectedMember}
            config={whatsappConfig}
            onClose={() => setShowWhatsappModal(false)}
            onSave={handleSaveWhatsappConfig}
            adminName={adminName}
          />
        )
      }

      {/* Name Prompt Modal */}
      {
        showNamePrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-light text-white mb-4">Welcome, Admin</h2>
              <p className="text-gray-400 mb-6">Please enter your name to personalize messages.</p>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none mb-6"
                placeholder="Your Name"
              />
              <button
                onClick={handleSaveAdminName}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )
      }

    </div >
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
    { id: 'Contacted', label: 'Contacted', color: 'bg-yellow-400' },
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
