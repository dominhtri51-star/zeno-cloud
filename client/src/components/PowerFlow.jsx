import React from 'react';
import { Sun, BatteryCharging, Home, Zap, ArrowRight, Activity } from 'lucide-react';
import InverterUnit from './InverterUnit';

export default function PowerFlow({
  pvPower = 12.4,
  batteryPower = -1.2,
  loadPower = 4.6,
  gridPower = -6.6,
  batterySoc = 88,
  batteryVoltage = 52.52,
  gridVoltage = 225.5
}) {
  const isCharging = batteryPower < 0;
  const isFeedingGrid = gridPower < 0;

  return (
    <div className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Sơ Đồ Dòng Năng Lượng Thời Gian Thực (Power Flow)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400">Giám sát chu trình tạo, nạp pin, tiêu thụ và phát lưới điện</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Đang hoạt động ổn định
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative py-4">
        {/* 1. Solar PV */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-lg shadow-amber-500/5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
            <Sun className="w-7 h-7 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-300">Tấm Pin Năng Lượng</span>
          <span className="text-lg font-extrabold text-amber-400 mt-1">{pvPower} kW</span>
          <span className="text-[10px] text-amber-300/70 font-medium">Phát điện mặt trời</span>
        </div>

        {/* Arrow 1 */}
        <div className="hidden md:flex flex-col items-center text-amber-400">
          <span className="text-[10px] font-mono mb-1">{pvPower} kW</span>
          <div className="w-full h-1 bg-amber-500/40 relative overflow-hidden rounded">
            <div className="absolute inset-0 bg-amber-400 animate-pulse"></div>
          </div>
          <ArrowRight className="w-5 h-5 mt-1" />
        </div>

        {/* 2. Official Zeno Hybrid Inverter (Center) */}
        <div className="flex flex-col items-center justify-center scale-105 z-10">
          <InverterUnit
            batteryVoltage={batteryVoltage}
            gridVoltage={gridVoltage}
            state="RUNNING"
            className="w-40 sm:w-44"
          />
        </div>

        {/* Arrow 2 */}
        <div className="hidden md:flex flex-col items-center text-cyan-400">
          <span className="text-[10px] font-mono mb-1">{loadPower} kW</span>
          <div className="w-full h-1 bg-cyan-500/40 relative overflow-hidden rounded">
            <div className="absolute inset-0 bg-cyan-400 animate-pulse"></div>
          </div>
          <ArrowRight className="w-5 h-5 mt-1" />
        </div>

        {/* 3. Home Load */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900/90 border border-teal-500/30 shadow-lg shadow-teal-500/5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
            <Home className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-300">Tải Tiêu Thụ Nhà</span>
          <span className="text-lg font-extrabold text-teal-400 mt-1">{loadPower} kW</span>
          <span className="text-[10px] text-teal-300/70 font-medium">Hộ gia đình sử dụng</span>
        </div>
      </div>

      {/* Bottom Sub-systems (Battery & Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
        {/* Battery BMS Pack */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Khối Pin Lưu Trữ BMS (LiFePO4)</div>
              <div className="text-xs text-slate-400">Trạng thái: {isCharging ? 'Đang Sạc Năng Lượng' : 'Đang Xả Nguồn'} ({Math.abs(batteryPower)} kW)</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-emerald-400">{batterySoc}%</div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${batterySoc}%` }}></div>
            </div>
          </div>
        </div>

        {/* Power Grid */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Lưới Điện Quốc Gia (EVN)</div>
              <div className="text-xs text-slate-400">
                {isFeedingGrid ? `Phát ngược lên lưới: ${Math.abs(gridPower)} kW` : `Mua từ lưới điện: ${gridPower} kW`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isFeedingGrid ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-300'}`}>
              {isFeedingGrid ? 'Xuất Lưới' : 'Nhập Lưới'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
