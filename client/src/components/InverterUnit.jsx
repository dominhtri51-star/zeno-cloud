import React from 'react';

export default function InverterUnit({
  state = 'RUNNING',
  className = ''
}) {
  return (
    <div className={`relative inline-block select-none transition-transform hover:scale-105 duration-300 ${className}`}>
      {/* 1. Official Zeno Hybrid Inverter Product Chassis */}
      <img
        src="/zeno_inverter.png"
        alt="Zeno Hybrid Inverter"
        className="w-36 sm:w-40 md:w-44 h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)] relative z-10"
        draggable={false}
      />

      {/* 2. Embedded Smart Digital Running LCD Screen */}
      <div 
        className="absolute z-20 top-[14%] left-[26%] w-[48%] h-[27%] rounded-xl overflow-hidden bg-[#182338]/95 border border-slate-700/80 shadow-2xl flex flex-col items-center justify-center py-1.5 px-1 backdrop-blur-md gap-1"
        style={{
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), 0 6px 16px rgba(0,0,0,0.4), 0 0 12px rgba(6,182,212,0.25)'
        }}
      >
        {/* Glass Screen Sheen Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none rounded-xl"></div>

        {/* Status Header (RUNNING) */}
        <div className="text-[9px] sm:text-[10px] font-black text-[#38bdf8] tracking-widest uppercase font-mono flex items-center gap-1 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
          {state}
        </div>

        {/* 4-Color Waveform Bars */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 z-10">
          <div 
            className="w-1 sm:w-1.5 bg-[#f59e0b] rounded-full animate-bounce"
            style={{ height: '10px', animationDuration: '0.9s' }}
          ></div>
          <div 
            className="w-1 sm:w-1.5 bg-[#06b6d4] rounded-full animate-bounce"
            style={{ height: '14px', animationDuration: '1.2s', animationDelay: '0.15s' }}
          ></div>
          <div 
            className="w-1 sm:w-1.5 bg-[#10b981] rounded-full animate-bounce"
            style={{ height: '9px', animationDuration: '0.8s', animationDelay: '0.3s' }}
          ></div>
          <div 
            className="w-1 sm:w-1.5 bg-[#a855f7] rounded-full animate-bounce"
            style={{ height: '12px', animationDuration: '1.1s', animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
