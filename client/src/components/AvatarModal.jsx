import React, { useState } from 'react';
import { 
  X, Check, Sparkles, Upload, Image, User, Zap, Sun, Shield, 
  Crown, Flame, Rocket, Diamond, BatteryCharging, Feather, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Danh sách các mẫu Avatar cực ngầu phong cách Solar & Cyberpunk
const PRESET_AVATARS = [
  { id: 'solar-king', label: '👑 Solar King', icon: Crown, bg: 'from-amber-500 to-yellow-300', text: 'text-amber-950', border: 'border-yellow-400' },
  { id: 'cyber-solar', label: '⚡ Cyber Tech', icon: Zap, bg: 'from-cyan-500 to-blue-600', text: 'text-slate-950', border: 'border-cyan-400' },
  { id: 'sun-god', label: '☀️ Thái Dương', icon: Sun, bg: 'from-orange-500 to-amber-400', text: 'text-orange-950', border: 'border-orange-400' },
  { id: 'bms-master', label: '🔋 BMS Master', icon: BatteryCharging, bg: 'from-emerald-500 to-teal-400', text: 'text-emerald-950', border: 'border-emerald-400' },
  { id: 'diamond-vip', label: '💎 VIP Pro', icon: Diamond, bg: 'from-purple-600 to-pink-500', text: 'text-white', border: 'border-pink-400' },
  { id: 'falcon-eco', label: '🦅 Falcon Solar', icon: Feather, bg: 'from-sky-500 to-indigo-600', text: 'text-white', border: 'border-sky-400' },
  { id: 'solar-future', label: '🚀 Solar Future', icon: Rocket, bg: 'from-indigo-600 via-purple-500 to-rose-500', text: 'text-white', border: 'border-purple-400' },
  { id: 'fire-energy', label: '🔥 Siêu Năng Lượng', icon: Flame, bg: 'from-rose-600 to-amber-500', text: 'text-white', border: 'border-rose-400' }
];

export default function AvatarModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'upload' | 'url'
  const [selectedPreset, setSelectedPreset] = useState(user?.avatarPreset || 'cyber-solar');
  const [customImageUrl, setCustomImageUrl] = useState(user?.avatarUrl || '');
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');
  const [customText, setCustomText] = useState(user?.avatarInitial || (user?.userName ? user.userName.charAt(0).toUpperCase() : 'Z'));

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result;
        setPreviewUrl(base64);
        setCustomImageUrl(base64);
        setActiveTab('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedData = {};
    if (activeTab === 'preset') {
      updatedData.avatarType = 'preset';
      updatedData.avatarPreset = selectedPreset;
      updatedData.avatarUrl = null;
      updatedData.avatar = null;
    } else if (activeTab === 'upload' || activeTab === 'url') {
      updatedData.avatarType = 'image';
      updatedData.avatarUrl = previewUrl || customImageUrl;
      updatedData.avatar = previewUrl || customImageUrl;
    }
    updatedData.avatarInitial = customText;

    if (updateUser) {
      updateUser(updatedData);
    }
    
    // Lưu vào localStorage riêng theo tài khoản
    if (user?.account) {
      localStorage.setItem(`zeno_avatar_${user.account}`, JSON.stringify(updatedData));
    }

    onClose();
  };

  const activePresetObj = PRESET_AVATARS.find(p => p.id === selectedPreset) || PRESET_AVATARS[1];
  const IconComp = activePresetObj.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-lg ${isDark ? 'bg-[#0d1527] border-slate-700/80 text-white shadow-cyan-950/50' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'} rounded-3xl p-5 sm:p-7 border shadow-2xl transition-all duration-300 max-h-[92vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {/* Nút Đóng (X) */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'} transition cursor-pointer`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center space-x-3 border-b pb-4 border-slate-700/40">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className={`w-full h-full ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-[14px] flex items-center justify-center`}>
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <span>Đổi Avatar Cá Nhân Siêu Ngầu</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40">
                PRO
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tùy biến ảnh đại diện cho tài khoản <strong>@{user?.account || user?.userName}</strong>
            </p>
          </div>
        </div>

        {/* KHUNG PREVIEW TRỰC QUAN LIVE */}
        <div className={`my-5 p-4 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3.5">
            {/* Avatar Preview Sphere */}
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 shadow-xl shadow-cyan-500/30 flex items-center justify-center">
                {activeTab === 'preset' ? (
                  <div className={`w-full h-full rounded-[14px] bg-gradient-to-br ${activePresetObj.bg} flex items-center justify-center shadow-inner`}>
                    <IconComp className={`w-8 h-8 sm:w-10 sm:h-10 ${activePresetObj.text}`} />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-800 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white font-mono">{customText}</span>
                    )}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <div>
              <span className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-slate-900'} block`}>
                {user?.userName || 'Chủ Trạm'}
              </span>
              <span className="text-[11px] font-bold text-cyan-400 block font-mono">
                @{user?.account}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold inline-block mt-1">
                ● {activeTab === 'preset' ? activePresetObj.label : 'Ảnh Tùy Chọn'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>Xem trước</span>
            <span className="text-xs font-mono font-bold text-amber-400">Live Header Ready</span>
          </div>
        </div>

        {/* CÁC TABS LỰA CHỌN PHƯƠNG THỨC */}
        <div className={`flex rounded-xl border p-1 mb-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mẫu Siêu Ngầu</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh Lên</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Dán Link Ảnh</span>
          </button>
        </div>

        {/* TAB 1: KHO MẪU AVATAR SIÊU NGẦU */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider block`}>
              CHỌN MẪU BIỂU TƯỢNG PHONG CÁCH NĂNG LƯỢNG:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map(p => {
                const ItemIcon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/80 shadow-lg shadow-cyan-500/20'
                        : isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.bg} flex items-center justify-center shadow-md`}>
                      <ItemIcon className={`w-6 h-6 ${p.text}`} />
                    </div>
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-cyan-400 font-extrabold' : isDark ? 'text-slate-300' : 'text-slate-700'} truncate w-full text-center`}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: TẢI ẢNH TỪ MÁY TÍNH / ĐIỆN THOẠI */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'} text-center space-y-3`}>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Nhấp để tải ảnh từ máy tính hoặc điện thoại
                </p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                  Hỗ trợ định dạng PNG, JPG, JPEG, WEBP (Tối đa 3MB)
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn Tệp Ảnh</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: DÁN LINK URL ẢNH */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} block`}>
              Dán đường dẫn ảnh đại diện (Image URL):
            </label>
            <input
              type="url"
              placeholder="https://example.com/my-cool-avatar.jpg"
              value={customImageUrl}
              onChange={(e) => {
                setCustomImageUrl(e.target.value);
                setPreviewUrl(e.target.value);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        )}

        {/* NÚT LƯU VÀ ÁP DỤNG */}
        <div className="mt-6 pt-4 border-t border-slate-700/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Lưu & Áp Dụng Ngay</span>
          </button>
        </div>

      </div>
    </div>
  );
}
