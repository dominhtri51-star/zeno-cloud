import React, { useState, useEffect } from 'react';
import { AreaChart, Sun, BatteryCharging, Home, Zap, Radio, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function PowerChart24h() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fastTele, setFastTele] = useState(false);
  const [fastStatus, setFastStatus] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/stations/history-24h');
      // res is either { data: { labels: ... } } or { labels: ... } due to axios interceptor
      const chartData = res?.data || res;
      if (chartData && chartData.labels) {
        setData(chartData);
      } else {
        // Fallback default 24h data
        setData(generateDefault24hData());
      }
    } catch (e) {
      console.warn('[Fetch History Warn]:', e);
      setData(generateDefault24hData());
    }
  };

  const generateDefault24hData = () => {
    const labels = [];
    const pvData = [];
    const loadData = [];
    const batteryData = [];
    const gridData = [];

    for (let h = 0; h <= 23; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`);
      let pv = 0;
      if (h >= 6 && h <= 18) {
        pv = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * 7.5);
      }
      pvData.push(Number(pv.toFixed(2)));

      let load = 0.8;
      if (h >= 6 && h <= 8) load = 2.2 + Math.sin(((h - 6) / 2) * Math.PI) * 0.8;
      else if (h >= 9 && h <= 17) load = 1.8 + (h % 3) * 0.4;
      else if (h >= 18 && h <= 22) load = 3.5 + Math.sin(((h - 18) / 4) * Math.PI) * 1.5;
      loadData.push(Number(load.toFixed(2)));

      let batt = 0;
      if (pv > load) batt = Math.min(3.0, pv - load);
      else batt = -Math.min(2.5, load - pv);
      batteryData.push(Number(batt.toFixed(2)));

      let grid = pv - load - batt;
      gridData.push(Number(grid.toFixed(2)));
    }
    return { labels, pvData, loadData, batteryData, gridData };
  };

  const handleToggleFastReport = async () => {
    try {
      setFastTele(true);
      setFastStatus('Đang kích hoạt đường truyền 1s...');
      const res = await api.post('/stations/fast-report/start', { deviceId: 'INV-DEMO-001' });
      setFastStatus(res?.message || 'Đã bật chế độ 1s');
      setTimeout(() => setFastStatus(''), 4000);
    } catch (e) {
      setFastStatus('Lỗi kích hoạt');
    }
  };

  const chartData = data || generateDefault24hData();
  const { labels, pvData, loadData, batteryData, gridData } = chartData;
  const maxVal = Math.max(...pvData, ...loadData, 8);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Đồ Thị Sản Lượng & Tiêu Thụ Năng Lượng 24H</h3>
              <p className="text-xs text-slate-400">Cập nhật liên tục theo chu kỳ phát điện quang điện PV & Pin lưu trữ</p>
            </div>
          </div>
        </div>

        {/* Action button & badges */}
        <div className="flex items-center space-x-2">
          {fastStatus && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-fade-in font-medium">
              {fastStatus}
            </span>
          )}
          <button
            onClick={handleToggleFastReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Bật Truyền Siêu Tốc 1s</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></div>
          <span className="text-slate-300 font-medium">Quang điện PV (kW)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50"></div>
          <span className="text-slate-300 font-medium">Tải Tiêu Thụ (kW)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></div>
          <span className="text-slate-300 font-medium">Pin Nạp / Xả (kW)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
          <span className="text-slate-300 font-medium">Lưới EVN (kW)</span>
        </div>
      </div>

      {/* Chart Visual Bar Chart */}
      <div className="h-48 flex items-end space-x-1 sm:space-x-2 pt-6 pb-2 border-b border-slate-800">
        {labels.map((hour, idx) => {
          const pv = pvData[idx] || 0;
          const load = loadData[idx] || 0;
          const pvHeight = (pv / maxVal) * 100;
          const loadHeight = (load / maxVal) * 100;

          return (
            <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-800 border border-slate-700 text-[10px] p-2 rounded-lg z-20 whitespace-nowrap shadow-xl">
                <span className="font-bold text-white mb-0.5">{hour}</span>
                <span className="text-amber-400">PV: {pv} kW</span>
                <span className="text-rose-400">Tải: {load} kW</span>
                <span className="text-cyan-400">Pin: {batteryData[idx]} kW</span>
              </div>

              {/* Bars */}
              <div className="w-full flex items-end justify-center space-x-0.5 h-full">
                {/* PV Bar */}
                <div
                  style={{ height: `${pvHeight}%` }}
                  className="w-1.5 sm:w-2 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                ></div>
                {/* Load Bar */}
                <div
                  style={{ height: `${loadHeight}%` }}
                  className="w-1.5 sm:w-2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                ></div>
              </div>
              {/* Hour text */}
              <span className="text-[9px] text-slate-500 mt-1.5 font-mono hidden sm:inline-block">
                {idx % 3 === 0 ? hour.slice(0, 2) : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
