import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Clock, MapPin, Cpu } from 'lucide-react';
import { monitoringService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function Alarms() {
  const { isDark } = useTheme();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      setLoading(true);
      const res = await monitoringService.getAlarms();
      setAlarms(res.alarms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alarmId) => {
    try {
      const res = await monitoringService.resolveAlarm(alarmId);
      if (res.success) {
        setAlarms(alarms.map(a => a.alarmId === alarmId ? { ...a, isProcessed: true } : a));
      }
    } catch (e) {
      alert(e.message || 'Lỗi xử lý cảnh báo');
    }
  };

  const filteredAlarms = alarms.filter(a => {
    if (filter === 'UNPROCESSED') return !a.isProcessed;
    if (filter === 'PROCESSED') return a.isProcessed;
    return true;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        isDark ? 'bg-[#0b101e] border-slate-800/90 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5`}>
            <AlertTriangle className="w-6 h-6 text-rose-500" /> Trung Tâm Cảnh Báo & Xử Lý Sự Cố
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Theo dõi cảnh báo nhiệt độ BMS, điện áp cell pin và sự cố lưới điện từ trạm của khách hàng.
          </p>
        </div>

        <button
          onClick={loadAlarms}
          className={`p-2.5 rounded-xl border transition self-start sm:self-auto cursor-pointer ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center gap-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-3`}>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'ALL' 
              ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất cả ({alarms.length})
        </button>
        <button
          onClick={() => setFilter('UNPROCESSED')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'UNPROCESSED' 
              ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Chưa xử lý ({alarms.filter(a => !a.isProcessed).length})
        </button>
        <button
          onClick={() => setFilter('PROCESSED')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'PROCESSED' 
              ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đã xử lý ({alarms.filter(a => a.isProcessed).length})
        </button>
      </div>

      {/* Alarms List */}
      <div className="space-y-3">
        {filteredAlarms.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-[#0b101e] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
            Không có cảnh báo nào trong danh mục này.
          </div>
        ) : (
          filteredAlarms.map((a) => (
            <div
              key={a.alarmId}
              className={`p-4 sm:p-5 rounded-2xl border transition-colors duration-200 ${
                !a.isProcessed
                  ? isDark ? 'border-rose-500/40 bg-rose-950/10' : 'border-rose-300 bg-rose-50/70 shadow-sm'
                  : isDark ? 'border-slate-800 bg-[#0b101e] opacity-75' : 'border-slate-200 bg-white opacity-80 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.level === 'WARNING'
                        ? isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-600 border border-rose-200'
                        : isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-200'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          a.level === 'WARNING'
                            ? isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {a.level}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>{a.message}</p>
                    
                    <div className={`flex flex-wrap items-center gap-4 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {a.stationName} ({a.customerName})
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Cpu className="w-3.5 h-3.5" /> SN: {a.deviceSn}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {a.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {a.isProcessed ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                      isDark ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" /> Đã kiểm tra
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolve(a.alarmId)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-cyan-500/10"
                    >
                      Xác Nhận Xử Lý
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
