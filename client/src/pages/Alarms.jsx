import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Clock, MapPin, Cpu } from 'lucide-react';
import { monitoringService } from '../services/api';

export default function Alarms() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" /> Trung Tâm Cảnh Báo & Xử Lý Sự Cố
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi cảnh báo nhiệt độ BMS, điện áp cell pin và sự cố lưới điện từ trạm của khách hàng.
          </p>
        </div>

        <button
          onClick={loadAlarms}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tất cả ({alarms.length})
        </button>
        <button
          onClick={() => setFilter('UNPROCESSED')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'UNPROCESSED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chưa xử lý ({alarms.filter(a => !a.isProcessed).length})
        </button>
        <button
          onClick={() => setFilter('PROCESSED')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'PROCESSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Đã xử lý ({alarms.filter(a => a.isProcessed).length})
        </button>
      </div>

      {/* Alarms List */}
      <div className="space-y-3">
        {filteredAlarms.map((a) => (
          <div
            key={a.alarmId}
            className={`glass-card p-5 rounded-2xl border transition ${
              !a.isProcessed
                ? 'border-rose-500/40 bg-rose-950/10'
                : 'border-slate-800 opacity-70'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    a.level === 'WARNING'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100">{a.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.level === 'WARNING'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {a.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{a.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {a.stationName} ({a.customerName})
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" /> SN: {a.deviceSn}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {a.time}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {a.isProcessed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Đã kiểm tra
                  </span>
                ) : (
                  <button
                    onClick={() => handleResolve(a.alarmId)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold text-xs transition"
                  >
                    Xác Nhận Xử Lý
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
