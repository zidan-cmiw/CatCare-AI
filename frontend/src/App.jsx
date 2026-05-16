import React, { useState, useRef, useEffect } from 'react';
import { Home, Stethoscope, MessageSquare, History, Settings, LogOut, Menu, X, Activity, Droplet, Cat } from 'lucide-react'; 
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('screening');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gejala, setGejala] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [visionResponse, setVisionResponse] = useState(null); // Full hybrid analysis response

  // Add missing state for Chat and Dark Mode
  const [chatMessages, setChatMessages] = useState([{ role: 'bot', text: 'Halo! Saya Dr. CatCare, dokter hewan virtual spesialis kucing. Ada yang bisa saya bantu hari ini?' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // NEW: Mood/Condition State
  const [moodPet, setMoodPet] = useState({
    health: 100,
    happiness: 90,
    energy: 80,
    status: 'Kondisi Prima', // e.g. Kondisi Prima, Sakit, Ngantuk, Moody
    emoji: '😺',
    media: '/pets/kicau_mania.mp4', // Default to video since healthy
    mediaType: 'video' 
  });

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodForm, setMoodForm] = useState({
    condition: 'sehat', // sehat, sakit, ngantuk
    energy: 'aktif', // aktif, malas, biasa
    appetite: 'normal' // normal, kurang, rakus
  });
  
  const handleMoodSubmit = (e) => {
    e.preventDefault();
    let newHealth = moodPet.health;
    let newHappiness = moodPet.happiness;
    let newEnergy = moodPet.energy;
    let newStatus = 'Baik';
    let newEmoji = '😺';
    // default to video if health is alright
    let newMedia = '/pets/kicau_mania.mp4';
    let newMediaType = 'video';

    if (moodForm.condition === 'sakit') {
      newHealth -= 15;
      newHappiness -= 20;
      newEnergy -= 30;
      newStatus = 'Kurang Sehat';
      newEmoji = '😿';
      newMedia = '/pets/sakit.png'; 
      newMediaType = 'image';
    } else if (moodForm.condition === 'ngantuk') {
      newEnergy -= 40;
      newHappiness -= 5;
      newStatus = 'Ngantuk';
      newEmoji = '😴';
      newMedia = '/pets/ngantuk.jpg';
      newMediaType = 'image';
    } else {
      newStatus = 'Kondisi Prima';
      newHappiness += 5;
      newEnergy += 10;
      // Gunakan video lucu/kicau mania jika kondisi sangat baik
      newMedia = '/pets/kicau_mania.mp4';
      newMediaType = 'video';
    }
    
    if (moodForm.energy === 'malas') {
      newEnergy -= 10;
    } else if (moodForm.energy === 'aktif') {
      newEnergy += 5;
    }

    if (moodForm.appetite === 'kurang') {
      newHealth -= 10;
      if (newStatus === 'Kondisi Prima') newStatus = 'Butuh Perhatian';
      newEmoji = '🙀';
    } else if (moodForm.appetite === 'rakus') {
      newHappiness += 10;
      newEmoji = '😻';
    }

    newHealth = Math.max(0, Math.min(100, newHealth));
    newHappiness = Math.max(0, Math.min(100, newHappiness));
    newEnergy = Math.max(0, Math.min(100, newEnergy));

    setMoodPet({
      health: newHealth,
      happiness: newHappiness,
      energy: newEnergy,
      status: newStatus,
      emoji: newEmoji,
      media: newMedia,
      mediaType: newMediaType
    });
    setShowMoodModal(false);
  };


  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Handle Predict
  const handleScreening = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Harap pilih foto terlebih dahulu.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('foto', file);
    formData.append('gejala', gejala);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      // Fake delay for animation
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      alert("Terjadi kesalahan koneksi ke server AI.");
      console.error(err);
      setLoading(false);
    }
  };

  // Handle Chat
  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();
      
      setChatMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.' }]);
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    // Add or remove dark mode class from body element 
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkModeEnabled]);

  const navItems = [
    { id: 'dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { id: 'screening', icon: <Stethoscope size={20} />, label: 'Screening AI' },
    { id: 'chat', icon: <MessageSquare size={20} />, label: 'Tanya Dokter' },
    { id: 'history', icon: <History size={20} />, label: 'Riwayat' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Pengaturan' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col shadow-lg md:shadow-none`}>
        
        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white dark:text-slate-900 p-2 rounded-lg flex items-center justify-center">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
            CatCare AI
          </span>
          <button className="md:hidden ml-auto text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {setActiveTab(item.id); setSidebarOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        
        {/* Top Header Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Cat size={24} className="text-cyan-500" />
            <span className="font-bold text-lg dark:text-white">CatCare AI</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg dark:text-slate-400"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-4 md:p-8">
          
          <div className="w-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {activeTab === 'dashboard' && 'Beranda Utama'}
              {activeTab === 'screening' && 'Screening AI'}
              {activeTab === 'chat' && 'Konsultasi Dokter AI'}
              {activeTab === 'history' && 'Riwayat Pemeriksaan'}
              {activeTab === 'settings' && 'Pengaturan Akun'}
            </h2>

            {/* TAB CONTENT: SCREENING */}
            {activeTab === 'screening' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm animate-fade-in transition-colors duration-300 w-full overflow-hidden">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                    <Activity size={20} className="text-cyan-500" />
                    Analisis Kesehatan Hybrid
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">Deteksi dini penyakit berdasarkan gejala yang dialami kucingmu.</p>
                </div>

                <form onSubmit={handleScreening} className="space-y-6">
                  {/* Foto Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">1. Unggah Foto Kucing (Opsional)</label>
                    <div 
                      className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
                      onClick={() => document.getElementById('foto').click()}
                    >
                      {preview ? (
                        <div className="relative">
                          <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <span className="text-white font-medium">Ganti Foto</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center pointer-events-none py-6">
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent p-3 rounded-full inline-block mb-3 shadow-sm dark:shadow-none transition-colors duration-300">
                            <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline transition-colors duration-300">Klik untuk pilih gambar</p>
                          <p className="text-xs text-slate-500 mt-1">atau tarik gambar ke area ini</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="foto" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  {/* Gejala */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">2. Deskripsikan Gejalanya <span className="text-red-500 dark:text-red-400">*</span></label>
                    <textarea 
                      rows="4" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" 
                      placeholder="Contoh: Dia muntah kuning, badannya panas, dan seharian tidak mau makan..."
                      required
                      value={gejala}
                      onChange={(e) => setGejala(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menganalisis Data AI...</span>
                      </div>
                    ) : (
                      <span>Mulai Analisis Medis</span>
                    )}
                  </button>
                </form>

                {/* Result Area */}
                {result && !loading && (
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-8 animate-fade-in transition-colors duration-300">
                    <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-cyan-200 dark:border-cyan-500/30 overflow-hidden transition-colors duration-300">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-300">
                        <div>
                          <p className="text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">Hasil Diagnosa AI</p>
                          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{result.disease}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl flex flex-col items-end shrink-0 transition-colors duration-300">
                          <span className="text-slate-500 dark:text-slate-400 text-xs">Confidence Score</span>
                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{result.confidence_score || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                            <Droplet size={16} className="text-blue-500 dark:text-blue-400" />
                            Gejala Terdeteksi
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.symptoms?.map((sym, i) => (
                              <span key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm transition-colors duration-300">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 transition-colors duration-300">
                          <h4 className="text-blue-700 dark:text-blue-400 font-bold flex items-center gap-2 mb-2 transition-colors duration-300">
                            <span className="text-xl">💡</span> Rekomendasi Tindakan Awal
                          </h4>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed transition-colors duration-300">{result.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CHAT */}
            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col h-[600px] animate-fade-in transition-colors duration-300">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
                  <div className="relative">
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-200 dark:border-cyan-500/50 transition-colors duration-300">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full transition-colors duration-300"></span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Dr. CatCare</h2>
                    <p className="text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-1 transition-colors duration-300">
                      <Settings size={12} className="animate-spin-slow" />
                      Virtual Specialist Online
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-tl-sm transition-colors duration-300'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 text-sm flex items-center gap-2 transition-colors duration-300">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="relative flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 px-5 py-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 h-14" 
                    placeholder="Tanyakan keluhan atau nama penyakit..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    disabled={chatLoading}
                  />
                  <button 
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-900 font-bold px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl animate-fade-in transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 transition-colors duration-300">
                      <History className="text-cyan-500 dark:text-cyan-400" />
                      Riwayat Aktivitas
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">Catatan histori screening dan chat medis AI.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { type: 'Screening', date: '15 Mei 2026', title: 'Screening: Muntah & Diare', desc: 'Kemungkinan Panleukopenia. Rekomendasi: Segera ke klinik hewan.', icon: <Activity size={20} />, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/20' },
                    { type: 'Konsultasi', date: '13 Mei 2026', title: 'Tanya Dokter: Jadwal Vaksin', desc: 'Konsultasi mengenai jadwal vaksin F3 untuk anak kucing usia 3 bulan.', icon: <MessageSquare size={20} />, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/20' },
                    { type: 'Screening', date: '05 Mei 2026', title: 'Screening: Bulu Rontok', desc: 'Kemungkinan Infeksi Jamur (Ringworm). Rekomendasi: Jaga kebersihan dan gunakan salep.', icon: <Activity size={20} />, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/20' },
                    { type: 'Konsultasi', date: '21 Apr 2026', title: 'Tanya Dokter: Makanan Kucing', desc: 'Rekomendasi takaran makanan basah dan kering sehari-hari.', icon: <MessageSquare size={20} />, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/20' }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                      <div className={`${item.bg} ${item.color} p-3 rounded-xl shrink-0 self-start sm:self-center transition-colors duration-300`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white transition-colors duration-300">{item.title}</h4>
                          <span className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm font-medium">{item.date}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors duration-300">{item.desc}</p>
                      </div>
                      <button className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 text-sm font-medium whitespace-nowrap self-start sm:self-center mt-2 sm:mt-0 transition-colors duration-300">
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl animate-fade-in max-w-3xl mx-auto transition-colors duration-300">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 transition-colors duration-300">
                    <Settings className="text-cyan-500 dark:text-cyan-400" />
                    Pengaturan
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">Kelola profil dan preferensi akun CatCare Anda.</p>
                </div>
                
                <div className="space-y-6">
                  {/* Profile Settings */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors duration-300">
                    <h4 className="text-slate-900 dark:text-white font-bold mb-4 transition-colors duration-300">Profil Pengguna</h4>
                    <div className="flex flex-col sm:flex-row gap-6 mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white dark:text-slate-900 shrink-0 transition-colors duration-300">
                        RC
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1 transition-colors duration-300">Nama Lengkap</label>
                          <input type="text" defaultValue="RadenCat" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-colors duration-300" />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1 transition-colors duration-300">Email</label>
                          <input type="email" defaultValue="radencat@example.com" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Preferences */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 transition-colors duration-300">
                    <h4 className="text-slate-900 dark:text-white font-bold mb-2 transition-colors duration-300">Preferensi Aplikasi</h4>
                    
                    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm font-medium transition-colors duration-300">Notifikasi Push</p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs transition-colors duration-300">Terima pengingat kesehatan kucing</p>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm font-medium transition-colors duration-300">Dark Mode</p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs transition-colors duration-300">Tampilan gelap aplikasi</p>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${darkModeEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${darkModeEnabled ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button className="bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-900 font-bold px-6 py-2 rounded-xl transition-all duration-300">
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Virtual Pet Status / Gamification */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-300">
                  {/* Decorative background circle */}
                  <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-3xl transition-colors duration-300"></div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-40 h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-900 rounded-full border-4 border-white dark:border-slate-600 flex items-center justify-center shadow-lg relative shrink-0 transition-colors duration-300 overflow-hidden">
                      {moodPet.mediaType === 'video' ? (
                        <video 
                          src={moodPet.media} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-full h-full object-cover scale-[1.35] translate-y-1"
                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                        />
                      ) : (
                        <img 
                          src={moodPet.media} 
                          alt={moodPet.status} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                        />
                      )}
                      
                      {/* Fallback Emoji if media is not found */}
                      <span className="text-6xl hidden absolute">{moodPet.emoji}</span>
                      
                      {/* Status indicator bubble */}
                      <div className={`absolute bottom-2 right-2 ${moodPet.health > 70 ? 'bg-emerald-500' : moodPet.health > 40 ? 'bg-amber-500' : 'bg-red-500'} w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 animate-pulse transition-colors duration-300`}></div>
                    </div>
                    
                    <div className="flex-1 w-full relative z-10">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Status Anabul Virtual</h3>
                          <button onClick={() => setShowMoodModal(true)} className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white text-xs px-2 py-1 rounded-md transition-colors shadow">Catat Kondisi Hari Ini</button>
                        </div>
                        <span className={`${moodPet.health > 70 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : moodPet.health > 40 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'} text-xs px-3 py-1 rounded-full border transition-colors duration-300`}>{moodPet.status}</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors duration-300"><span className="text-red-500 dark:text-red-400">❤️</span> Nyawa Kucing</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold transition-colors duration-300">{moodPet.health} / 100 HP</span>
                          </div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors duration-300">
                            <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full" style={{ width: `${moodPet.health}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors duration-300"><span className="text-yellow-500 dark:text-yellow-400">✨</span> Level Kebahagiaan</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold transition-colors duration-300">{moodPet.happiness} / 100 XP</span>
                          </div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors duration-300">
                            <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${moodPet.happiness}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors duration-300"><span className="text-blue-500 dark:text-blue-400">⚡</span> Energi</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold transition-colors duration-300">{moodPet.energy} / 100</span>
                          </div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors duration-300">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" style={{ width: `${moodPet.energy}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mood Modal Overlay */}
                {showMoodModal && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 animate-fade-in relative z-[60]">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity size={24} className="text-cyan-500" /> Jurnal Kucing Hari Ini
                        </h3>
                        <button onClick={() => setShowMoodModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleMoodSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Kondisi Umum</label>
                          <select 
                            value={moodForm.condition} 
                            onChange={(e) => setMoodForm({...moodForm, condition: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <option value="sehat">😺 Ceria & Sehat</option>
                            <option value="sakit">😿 Kurang Sehat / Sakit</option>
                            <option value="ngantuk">😴 Ngantuk / Lelah</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tingkat Energi</label>
                          <select 
                            value={moodForm.energy} 
                            onChange={(e) => setMoodForm({...moodForm, energy: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <option value="aktif">⚡ Sangat Aktif (Lari-lari)</option>
                            <option value="biasa">🚶 Biasa Saja (Jalan santai)</option>
                            <option value="malas">🛋️ Malas / Suka Tiduran</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nafsu Makan</label>
                          <select 
                            value={moodForm.appetite} 
                            onChange={(e) => setMoodForm({...moodForm, appetite: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <option value="normal">🍗 Normal</option>
                            <option value="rakus">🤤 Rakus Banget</option>
                            <option value="kurang">🤢 Susah Makan / Mogok</option>
                          </select>
                        </div>

                        <div className="pt-4 flex gap-3 justify-end">
                          <button type="button" onClick={() => setShowMoodModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                          <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95">Simpan Catatan</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (2 span) - Stats & History */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-center shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400 transition-colors duration-300">
                          <Stethoscope size={18} />
                          <span className="text-sm font-medium">Total Screening</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">12 <span className="text-sm text-slate-500 font-normal">kali</span></span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-center shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 transition-colors duration-300">
                          <MessageSquare size={18} />
                          <span className="text-sm font-medium">Konsultasi AI</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">8 <span className="text-sm text-slate-500 font-normal">sesi</span></span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-center col-span-2 md:col-span-1 shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400 transition-colors duration-300">
                          <span className="text-lg leading-none">🏆</span>
                          <span className="text-sm font-medium">Level Kamu</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Lv. 3 <span className="text-sm text-slate-500 font-normal">Novice</span></span>
                      </div>
                    </div>

                    {/* Recent History */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                          <History size={20} className="text-slate-500 dark:text-slate-400 transition-colors duration-300" />
                          Aktivitas Terakhir
                        </h4>
                        <button onClick={() => setActiveTab('history')} className="text-cyan-600 dark:text-cyan-400 text-sm hover:underline transition-colors duration-300">Lihat Semua</button>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center group hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 p-2 rounded-lg transition-colors duration-300"><Activity size={18} /></div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-medium text-sm transition-colors duration-300">Screening: Muntah & Diare</p>
                              <p className="text-slate-500 text-xs">Kemungkinan Panleukopenia</p>
                            </div>
                          </div>
                          <span className="text-slate-500 text-xs lg:text-sm">Hari ini</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center group hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-2 rounded-lg transition-colors duration-300"><MessageSquare size={18} /></div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-medium text-sm transition-colors duration-300">Tanya Dokter: Jadwal Vaksin</p>
                              <p className="text-slate-500 text-xs">Konsultasi umum</p>
                            </div>
                          </div>
                          <span className="text-slate-500 text-xs lg:text-sm">2 hr lalu</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Actions & Widgets */}
                  <div className="space-y-6">
                    {/* Actions Card */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col gap-3 shadow-sm dark:shadow-none transition-colors duration-300">
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors duration-300"><span className="text-yellow-500 dark:text-yellow-400">⚡</span> Aksi Cepat</h4>
                      
                      <button onClick={() => setActiveTab('screening')} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-slate-800 flex items-center justify-between p-4 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="text-cyan-600 dark:text-cyan-400 transition-colors duration-300"><Stethoscope size={20} /></div>
                          <span className="text-slate-700 dark:text-slate-200 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">Mulai Screening Baru</span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-600 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">→</span>
                      </button>
                      
                      <button onClick={() => setActiveTab('chat')} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between p-4 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="text-blue-600 dark:text-blue-400 transition-colors duration-300"><MessageSquare size={20} /></div>
                          <span className="text-slate-700 dark:text-slate-200 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">Chat Dr. CatCare</span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">→</span>
                      </button>
                    </div>

                    {/* Tip of the day */}
                    <div className="bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-slate-800 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 transition-colors duration-300">
                      <div className="flex gap-3 mb-2">
                        <span className="text-emerald-500 dark:text-emerald-400 text-xl leading-none transition-colors duration-300">💡</span>
                        <h4 className="flex-1 text-emerald-700 dark:text-emerald-400 font-bold text-sm transition-colors duration-300">Tip Hari Ini</h4>
                      </div>
                      <p className="text-emerald-800/80 dark:text-slate-300 text-sm leading-relaxed pl-8 transition-colors duration-300">
                        Pastikan anak bulumu mendapat air minum segar setiap hari! Kucing rentan dehidrasi yang bisa memicu penyakit ginjal di kemudian hari.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
