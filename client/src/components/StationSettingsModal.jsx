import React, { useState, useEffect } from 'react';
import { 
  X, Settings, DollarSign, Sun, Battery, Save, CheckCircle2, 
  AlertCircle, Zap, Shield, HelpCircle, Building
} from 'lucide-react';
import { monitoringService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function StationSettingsModal({ isOpen, onClose, station, onSaved }) {
  const { isDark } = useTheme();
  if (!isOpen || !station) return null;

  const stationId = station.stationId || station.id || 'ST-001';
  const stationName = station.stationName || station.name || 'Trạm năng lượng';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [settings, setSettings] = useState({
    electricityPrice: 2800,
    tariffType: 'FLAT',
    peakPrice: 3450,
    normalPrice: 1850,
    offPeakPrice: 1250,
    feedInTariff: 1000,
    currency: 'VND',

    installedCapacityKw: parseFloat(station.installedCapacity) || parseFloat(station.capacityKw) || 12.0,
    pv1CapacityKw: 6.0,
    pv2CapacityKw: 6.0,
    solarPanelType: 'Mono Perc Tier 1 (550W)',
    panelEfficiency: 98,

    batteryType: 'LiFePO4',
    batteryCapacityKwh: 10.24,
    batteryAh: 200,
    batteryVoltageNominal: 51.2,
    minSoc: 20,
    maxSoc: 100
  });

  useEffect(() => {
    if (isOpen && stationId) {
      loadStationConfig();
    }
  }, [isOpen, stationId]);

  const loadStationConfig = async () => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await monitoringService.getStationSettings(stationId);
      const data = res?.data || res;
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (e) {
      console.warn('Lỗi đọc cấu hình trạm:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAhChange = (ahVal) => {
    const ah = parseFloat(ahVal) || 0;
    const v = parseFloat(settings.batteryVoltageNominal) || 51.2;
    const kwh = Number(((ah * v) / 1000).toFixed(2));
    setSettings(prev => ({
      ...prev,
      batteryAh: ah,
      batteryCapacityKwh: kwh
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await monitoringService.updateStationSettings(stationId, settings);
      setStatusMsg({
        type: 'success',
        text: `✅ Đã lưu thành công đơn giá tiền điện & thông số dự án [${stationName}]!`
      });
      if (onSaved) {
        onSaved(settings);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Lỗi lưu cấu hình trạm, vui lòng thử lại!'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-2xl ${isDark ? 'bg-[#0b101e] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] transition-colors duration-300`}>
        
        {/* Modal Header */}
        <div className={`p-3.5 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50/90'} flex items-center justify-between shrink-0`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black flex items-center gap-1.5 flex-wrap">
                <span className={isDark ? 'text-white' : 'text-slate-900'}>Cài Đặt Thông Số Dự Án</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 font-mono font-bold">
                  ID: {stationId}
                </span>
              </h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                Thiết lập đơn giá & công suất cho <b className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stationName}</b>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'} flex items-center justify-center transition cursor-pointer shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 custom-scrollbar">
          
          {statusMsg.text && (
            <div className={`p-3 sm:p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* 1. KHỐI ĐƠN GIÁ TIỀN ĐIỆN CHO TRẠM NÀY */}
          <div className={`${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4`}>
            <div className={`flex items-center gap-2.5 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Đơn Giá Tiền Điện Áp Dụng (EVN Tariff)</h3>
                <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dùng để tính toán số tiền điện tiết kiệm thực tế cho ngôi nhà này</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Biểu Giá Điện</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, tariffType: 'FLAT' }))}
                  className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    settings.tariffType === 'FLAT'
                      ? isDark 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm' 
                        : 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm'
                      : isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Giá Cố Định (Flat)
                </button>

                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, tariffType: 'TOU' }))}
                  className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    settings.tariffType === 'TOU'
                      ? isDark 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm' 
                        : 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm'
                      : isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Biểu Giá 3 Giá (TOU)
                </button>
              </div>
            </div>

            {settings.tariffType === 'FLAT' ? (
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Đơn Giá Điện Bình Quân (VNĐ / kWh)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.electricityPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, electricityPrice: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3.5 py-2.5 font-mono font-bold text-sm focus:outline-none transition`}
                    placeholder="2800"
                  />
                  <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>VNĐ/kWh</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Giờ Bình Thường</label>
                  <input
                    type="number"
                    value={settings.normalPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, normalPrice: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-2.5 py-2 font-mono font-bold text-xs focus:outline-none`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-500">Giờ Cao Điểm</label>
                  <input
                    type="number"
                    value={settings.peakPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, peakPrice: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-2.5 py-2 font-mono font-bold text-xs focus:outline-none`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-emerald-500">Giờ Thấp Điểm</label>
                  <input
                    type="number"
                    value={settings.offPeakPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, offPeakPrice: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-2.5 py-2 font-mono font-bold text-xs focus:outline-none`}
                  />
                </div>
              </div>
            )}

            <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Đơn Giá Bán Điện Lên Lưới (FIT)</label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.feedInTariff}
                  onChange={(e) => setSettings(prev => ({ ...prev, feedInTariff: parseFloat(e.target.value) || 0 }))}
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3.5 py-2 font-mono font-bold text-xs focus:outline-none`}
                  placeholder="1000"
                />
                <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>VNĐ/kWh</span>
              </div>
            </div>
          </div>

          {/* 2. KHỐI CÔNG SUẤT PIN MẶT TRỜI PV */}
          <div className={`${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4`}>
            <div className={`flex items-center gap-2.5 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Công Suất Dàn Pin Mặt Trời (PV)</h3>
                <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cấu hình công suất lắp đặt theo thực tế thi công tại công trình</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tổng Công Suất (kWp)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.installedCapacityKw}
                    onChange={(e) => setSettings(prev => ({ ...prev, installedCapacityKw: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3 py-2 font-mono font-bold text-sm focus:outline-none`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500 font-mono">kWp</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chuỗi PV1 (String 1)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.pv1CapacityKw}
                    onChange={(e) => setSettings(prev => ({ ...prev, pv1CapacityKw: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3 py-2 font-mono font-bold text-xs focus:outline-none`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>kWp</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chuỗi PV2 (String 2)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.pv2CapacityKw}
                    onChange={(e) => setSettings(prev => ({ ...prev, pv2CapacityKw: parseFloat(e.target.value) || 0 }))}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3 py-2 font-mono font-bold text-xs focus:outline-none`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>kWp</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chủng Loại Tấm Pin Lắp Đặt</label>
              <input
                type="text"
                value={settings.solarPanelType}
                onChange={(e) => setSettings(prev => ({ ...prev, solarPanelType: e.target.value }))}
                className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'} border rounded-xl px-3.5 py-2 text-xs focus:outline-none`}
                placeholder="Mono Perc Tier 1 (550W)"
              />
            </div>
          </div>

          {/* 3. KHỐI PIN LƯU TRỮ LITHIUM */}
          <div className={`${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} border rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4`}>
            <div className={`flex items-center gap-2.5 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Battery className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pin Lưu Trữ Lithium (Battery Storage)</h3>
                <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cấu hình dung lượng Ah, kWh và ngưỡng bảo vệ an toàn cell pin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Công Nghệ Pin</label>
                <select
                  value={settings.batteryType}
                  onChange={(e) => setSettings(prev => ({ ...prev, batteryType: e.target.value }))}
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'} border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer`}
                >
                  <option value="LiFePO4">LiFePO4 Lithium (Smart BMS Tier 1)</option>
                  <option value="Lead-Acid">Ắc quy Gel / Axit Chì (Lead-Acid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dung Lượng (Ah)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.batteryAh}
                    onChange={(e) => handleAhChange(e.target.value)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'} border rounded-xl px-3 py-2 font-mono font-bold text-sm focus:outline-none`}
                    placeholder="200"
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>Ah</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-500">Tổng Dung Lượng</label>
                <div className={`${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border rounded-xl px-3 py-2 flex items-center justify-between`}>
                  <span className={`font-mono font-black text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{settings.batteryCapacityKwh}</span>
                  <span className="text-xs font-bold text-emerald-500 font-mono">kWh</span>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Ngưỡng Xả Bảo Vệ (Min SOC):</span>
                  <span className="text-emerald-500 font-mono font-extrabold">{settings.minSoc}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={settings.minSoc}
                  onChange={(e) => setSettings(prev => ({ ...prev, minSoc: parseInt(e.target.value, 10) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Ngưỡng Sạc Đầy (Max SOC):</span>
                  <span className="text-emerald-500 font-mono font-extrabold">{settings.maxSoc}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={settings.maxSoc}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxSoc: parseInt(e.target.value, 10) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} text-xs font-bold transition cursor-pointer`}
            >
              Đóng
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Cài Đặt Dự Án Này'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
