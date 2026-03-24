import React, { useState } from 'react';
import { ArrowLeft, Volume2, Star, Play, Info, Clock, AlertCircle, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestPage = () => {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  // Toggle dark mode
  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <div className={`bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-300 font-sarabun`}
      style={{ fontFamily: 'Sarabun, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Mitr:wght@400;500;600&display=swap');
        .font-display { font-family: 'Mitr', 'Sarabun', sans-serif; }
        .font-sarabun { font-family: 'Sarabun', sans-serif; }
        .bg-background-light { background: #eff6ff; }
        .bg-background-dark { background: #0f172a; }
        .bg-card-light { background: #fff; }
        .bg-card-dark { background: #1e293b; }
        .bg-primary { background: #2563eb; }
        .text-primary { color: #2563eb; }
        .rounded-2xl { border-radius: 2rem; }
        .rounded-lg { border-radius: 1.5rem; }
        .shadow-xl { box-shadow: 0 8px 32px rgba(0,0,0,0.13); }
        .shadow-2xl { box-shadow: 0 16px 48px rgba(0,0,0,0.18); }
        .transition-all { transition: all 0.15s; }
        .active-scale-95:active { transform: scale(0.95); }
        .drop-shadow-md { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.12)); }
        .dark .text-slate-800 { color: #f1f5f9; }
        .dark .bg-card-light { background: #1e293b; }
        .dark .bg-blue-50 { background: #334155; }
        .dark .border-blue-100 { border-color: #334155; }
        .dark .text-slate-700 { color: #f1f5f9; }
        .dark .text-slate-600 { color: #cbd5e1; }
        .dark .text-slate-400 { color: #64748b; }
        .dark .text-slate-100 { color: #f1f5f9; }
        .dark .text-slate-200 { color: #e2e8f0; }
        .dark .text-slate-300 { color: #cbd5e1; }
        .dark .bg-slate-100 { background: #f1f5f9; }
        .dark .bg-slate-800 { background: #1e293b; }
        .dark .text-slate-800 { color: #f1f5f9; }
      `}</style>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl min-h-screen flex flex-col items-center">
        <div className="w-full flex items-center mb-8 relative">
          <button
            className="bg-primary hover:bg-blue-700 text-white p-4 rounded-2xl shadow-lg transition-transform active-scale-95 flex items-center justify-center"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={32} />
          </button>
          <div className="flex-grow text-center">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-slate-800 dark:text-slate-100">
              บทที่ 1 รู้จักพยัญชนะ ก-ง
            </h1>
          </div>
          <div className="w-16"></div>
        </div>
        <div className="w-full max-w-2xl bg-card-light dark:bg-card-dark rounded-lg shadow-2xl p-10 md:p-16 flex flex-col items-center text-center transition-colors duration-300">
          <div className="mb-8">
            <Star size={96} color="#ffd600" fill="#ffd600" className="drop-shadow-md" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-slate-700 dark:text-slate-200 mb-8">
            แบบทดสอบก่อนเรียนบทที่ 1
          </h2>
          <div className="w-full bg-blue-50 dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 flex items-center justify-center gap-4 mb-12 border border-blue-100 dark:border-slate-700">
            <div className="bg-primary p-3 rounded-full flex items-center justify-center text-white shadow-md">
              <Volume2 size={32} />
            </div>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium">
              แบบทดสอบ 3 ข้อ เลือกคำตอบที่ถูกต้อง
            </p>
          </div>
          <button className="bg-primary hover:bg-blue-700 text-white font-display text-3xl px-16 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active-scale-95 group flex items-center gap-3">
            เริ่ม
            <Play size={32} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="mt-auto py-8 text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
          <Info size={20} />
          <span>เรียนรู้ภาษาไทยแสนสนุกไปกับเรา</span>
        </div>
      </div>
      <div className="fixed bottom-6 right-6">
        <button
          className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 p-3 rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={() => setDark(d => !d)}
        >
          <Moon size={24} />
        </button>
      </div>
    </div>
  );
};

export default TestPage;
