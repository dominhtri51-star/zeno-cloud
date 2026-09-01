import React, { useState, useEffect } from 'react';
import { 
  X, Cpu, Layers, CheckCircle2, Zap, Globe, Share2, 
  ArrowRight, ShieldCheck, Check, Radio, Sparkles
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ClusterFleetModal({ isOpen, onClose, station, onConfirmFleet }) {
  const { isDark } = useTheme();

  // Kiểu cụm: '3PHASE' (Điện 3 Pha L1-L2-L3) | 'PARALLEL' (1 Pha Song Song Đa Biến Tần)
  const [clusterType, setClusterType] = useState('3PHASE');

  // Danh sách thiết bị của trạm
  const devices = Array.isArray(station?.devices) && station.devices.length > 0 
    ? station.devices 
    : [
        {
          deviceId: 'dev-1',
          serialNumber: station?.serialNumber || '3528214760-1',
          dtuCode: station?.dtuCode || '35282147608648059097',
          deviceName: 'Inverter #1 (Master)'
        }
      ];

  // Gán pha cho chế độ 3 Pha
  const [phase1Sn, setPhase1Sn] = useState('');
  const [phase2Sn, setPhase2Sn] = useState('');
  const [phase3Sn, setPhase3Sn] = useState('');

  // Danh sách SN được tích chọn cho chế độ 1 Pha Song Song
  const [parallelSns, setParallelSns] = useState([]);

  useEffect(() => {
    if (isOpen && station) {
      const devs = Array.isArray(station.devices) && station.devices.length > 0 ? station.devices : [];
      const baseSn = devs[0]?.serialNumber || '3528214760-1';
      const cleanBase = baseSn.includes('-') ? baseSn.split('-')[0] : baseSn;

      const sn1 = devs[0]?.serialNumber || `${cleanBase}-1`;
      const sn2 = devs[1]?.serialNumber || `${cleanBase}-2`;
      const sn3 = devs[2]?.serialNumber || `${cleanBase}-3`;

      setPhase1Sn(sn1);
      setPhase2Sn(sn2);
      setPhase3Sn(sn3);

      if (devs.length >= 2) {
        setParallelSns(devs.map(d => d.serialNumber));
      } else {
        setParallelSns([sn1, sn2, sn3]);
      }
    }
  }, [isOpen, station]);

  if (!isOpen || !station) return null;

  // Toggle chọn SN trong chế độ Song Song
  const toggleParallelSn = (sn) => {
    if (parallelSns.includes(sn)) {
      if (parallelSns.length <= 1) return; // Giữ lại ít nhất 1 máy
      setParallelSns(parallelSns.filter(s => s !== sn));
    } else {
      setParallelSns([...parallelSns, sn]);
    }
  };

  const handleLaunchFleet = () => {
    const fleetConfig = {
      isFleet: true,
      stationId: station.stationId,
      stationName: station.stationName,
      clusterType,
      phases: clusterType === '3PHASE' ? {
        L1: phase1Sn,
        L2: phase2Sn,
        L3: phase3Sn
      } : null,
      parallelSns: clusterType === 'PARALLEL' ? parallelSns : null,
      deviceCount: clusterType === '3PHASE' ? 3 : parallelSns.length
    };

    if (onConfirmFleet) {
      onConfirmFleet(fleetConfig);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0c1322] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/90 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <Layers className="w-5 h-5 text-cyan-500" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Cấu Hình Xem Gộp Cụm Trạm
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Dự án: <strong className="text-cyan-500 font-mono">{station.stationName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung cấu hình */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Chọn kiểu cụm: 3 Pha hoặc 1 Pha Song Song */}
          <div className="space-y-2">
            <label className={`text-xs font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              1. Chọn Mô Hình Đấu Nối Cụm:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setClusterType('3PHASE')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative ${
                  clusterType === '3PHASE'
                    ? 'bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-transparent border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                    : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {clusterType === '3PHASE' && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className={`w-4 h-4 ${clusterType === '3PHASE' ? 'text-cyan-500' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs sm:text-sm">Điện 3 Pha</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-tight`}>
                  3 biến tần tạo điện 380V (L1 - L2 - L3)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setClusterType('PARALLEL')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative ${
                  clusterType === 'PARALLEL'
                    ? 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                    : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {clusterType === 'PARALLEL' && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className={`w-4 h-4 ${clusterType === 'PARALLEL' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs sm:text-sm">1 Pha Song Song</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-tight`}>
                  Nhiều máy 220V đấu song song tăng công suất
                </p>
              </button>
            </div>
          </div>

          {/* 2. Cấu hình gán Mã SN theo Pha (nếu chọn 3 Pha) */}
          {clusterType === '3PHASE' && (
            <div className="space-y-3 animate-fade-in">
              <label className={`text-xs font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                2. Tích Chọn Mã SN Cho Từng Pha (L1 - L2 - L3):
              </label>

              {/* Pha 1 (L1 / Master) */}
              <div className={`p-3 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-extrabold font-mono text-[10px] border border-amber-500/30">
                      PHA 1 (L1 - MASTER)
                    </span>
                    <span className="font-bold text-slate-300 text-xs">Máy chủ điều phối</span>
                  </div>
                  <span className="text-[10px] text-slate-500">220V Phase A</span>
                </div>
                <input
                  type="text"
                  value={phase1Sn}
                  onChange={(e) => setPhase1Sn(e.target.value)}
                  placeholder="Nhập mã SN Pha 1 (VD: 3528214760-1)"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Pha 2 (L2 / Slave 1) */}
              <div className={`p-3 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-extrabold font-mono text-[10px] border border-cyan-500/30">
                      PHA 2 (L2 - SLAVE 1)
                    </span>
                    <span className="font-bold text-slate-300 text-xs">Máy phụ 1</span>
                  </div>
                  <span className="text-[10px] text-slate-500">220V Phase B</span>
                </div>
                <input
                  type="text"
                  value={phase2Sn}
                  onChange={(e) => setPhase2Sn(e.target.value)}
                  placeholder="Nhập mã SN Pha 2 (VD: 3528214760-2)"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Pha 3 (L3 / Slave 2) */}
              <div className={`p-3 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-extrabold font-mono text-[10px] border border-purple-500/30">
                      PHA 3 (L3 - SLAVE 2)
                    </span>
                    <span className="font-bold text-slate-300 text-xs">Máy phụ 2</span>
                  </div>
                  <span className="text-[10px] text-slate-500">220V Phase C</span>
                </div>
                <input
                  type="text"
                  value={phase3Sn}
                  onChange={(e) => setPhase3Sn(e.target.value)}
                  placeholder="Nhập mã SN Pha 3 (VD: 3528214760-3)"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* 3. Cấu hình tích chọn SN cho chế độ Song Song */}
          {clusterType === 'PARALLEL' && (
            <div className="space-y-3 animate-fade-in">
              <label className={`text-xs font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                2. Tích Chọn Các Thiết Bị Đấu Song Song:
              </label>

              <div className="space-y-2">
                {[
                  { sn: phase1Sn || '3528214760-1', role: 'Máy #1 (Master)', tag: 'Master' },
                  { sn: phase2Sn || '3528214760-2', role: 'Máy #2 (Slave 1)', tag: 'Slave 1' },
                  { sn: phase3Sn || '3528214760-3', role: 'Máy #3 (Slave 2)', tag: 'Slave 2' }
                ].map((item, idx) => {
                  const isChecked = parallelSns.includes(item.sn);
                  return (
                    <div
                      key={item.sn}
                      onClick={() => toggleParallelSn(item.sn)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? isDark ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                          : isDark ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isChecked 
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                            : isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold">{item.role}</strong>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                              {item.tag}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            SN: {item.sn}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${isChecked ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {isChecked ? 'Đã gộp' : 'Không gộp'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800/90 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleLaunchFleet}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>🚀 Mở Bảng Điều Khiển Cụm Gộp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
