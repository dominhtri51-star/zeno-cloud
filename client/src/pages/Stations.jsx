import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, BatteryCharging, Sun, Home, MapPin, Activity, 
  CheckCircle, RefreshCw, Sliders, Radio, ArrowRight, Eye, 
  Cpu, Server, ChevronRight, ShieldCheck, Users, PlusCircle, Wifi,
  Trash2, AlertOctagon, Search, X, Filter, Hash, Tag, Check, Sparkles,
  ArrowUpDown, Layers, Share2, UserCheck, ArrowRightLeft
} from 'lucide-react';
import api, { monitoringService, authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import RemoteConfigModal from '../components/RemoteConfigModal';
import ClaimDeviceModal from '../components/ClaimDeviceModal';
import StationSettingsModal from '../components/StationSettingsModal';
import ShareStationModal from '../components/ShareStationModal';
import ReassignDealerModal from '../components/ReassignDealerModal';
import SafeDeleteModal from '../components/SafeDeleteModal';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Stations({ onNavigate, onSelectDevice }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configStation, setConfigStation] = useState(null);
  
  // Modal Chia Sẻ Trạm Cho Đại Lý (Dành Cho Chủ Nhà / Người Dùng Cuối)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedStationForShare, setSelectedStationForShare] = useState(null);

  // 👑 Modal Phân Bổ / Đổi Đại Lý Quản Lý (Dành Cho Tài Khoản Tổng Master)
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignStation, setReassignStation] = useState(null);
  const [reassignDevice, setReassignDevice] = useState(null);

  // 🔒 Modal Xóa An Toàn (Master nhập mật khẩu sungo123, Dealer nhập Serial Number)
  const [isSafeDeleteOpen, setIsSafeDeleteOpen] = useState(false);
  const [safeDeleteTarget, setSafeDeleteTarget] = useState(null);

  // Bộ lọc & Tìm kiếm nhanh
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('ALL'); // 'ALL' | 'NAME' | 'SN' | 'DTU'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'MULTI'
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'CAPACITY_DESC'

  // Modal Cài Đặt Dự Án / Trạm
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [selectedStationForSettings, setSelectedStationForSettings] = useState(null);

  // Modal Thêm Thiết Bị / Cấu hình WiFi
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  const isDistributor = user?.userType === 1 || user?.account === 'sungo.vn' || user?.account === 'admin' || user?.account === 'zeno_admin';
  const isInstaller = user?.userType === 2 && !isDistributor;
  const isHomeowner = user?.userType === 3 && !isDistributor && !isInstaller;

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const res = await monitoringService.getStations();
      const list = res.stations || [];
      setStations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = (st, e) => {
    if (e) e.stopPropagation();
    if (isHomeowner) return; // Chủ nhà không thể mở
    setConfigStation(st);
    setIsConfigOpen(true);
  };

  const handleOpenProjectSettings = (st, e) => {
    if (e) e.stopPropagation();
    setSelectedStationForSettings(st);
    setIsProjectSettingsOpen(true);
  };

  const handleOpenShareModal = (st, e) => {
    if (e) e.stopPropagation();
    setSelectedStationForShare(st);
    setIsShareModalOpen(true);
  };

  // Mở modal Đổi Đại Lý (Master)
  const handleOpenReassign = (st, dev, e) => {
    if (e) e.stopPropagation();
    setReassignStation(st);
    setReassignDevice(dev || null);
    setIsReassignOpen(true);
  };

  // Mở modal Xóa Trạm An Toàn (Master)
  const handleDeleteStationClick = (st, e) => {
    if (e) e.stopPropagation();
    setSafeDeleteTarget({
      type: 'station',
      id: st.stationId,
      name: st.stationName,
      title: 'Xác Nhận Xóa Trạm Năng Lượng'
    });
    setIsSafeDeleteOpen(true);
  };

  // Mở modal Xóa Thiết Bị An Toàn (Master hoặc Dealer)
  const handleDeleteDeviceClick = (st, dev, e) => {
    if (e) e.stopPropagation();
    setSafeDeleteTarget({
      type: 'device',
      id: dev.deviceId || dev.serialNumber,
      name: `Inverter ${dev.deviceName || ''} (${dev.serialNumber})`,
      serialNumber: dev.serialNumber,
      stationId: st?.stationId,
      title: isDistributor ? 'Xác Nhận Xóa Thiết Bị Vĩnh Viễn' : 'Xác Nhận Xóa Thiết Bị Khỏi Đại Lý'
    });
    setIsSafeDeleteOpen(true);
  };

  const handleExecuteSafeDelete = async ({ adminPassword, confirmSn }) => {
    if (!safeDeleteTarget) return;
    if (safeDeleteTarget.type === 'station') {
      await monitoringService.deleteStation(safeDeleteTarget.id, adminPassword);
    } else if (safeDeleteTarget.type === 'device') {
      await monitoringService.deleteDeviceSafe({
        deviceId: safeDeleteTarget.id,
        confirmSn,
        adminPassword
      });
    }
    await loadStations();
  };

  const handleDeviceClick = async (st, dev) => {
    try {
      // Tự động làm mới Token Cloud trước khi mở Inverter để tài khoản Đại Lý & Khách hàng luôn kết nối Live 100%
      const res = await authService.refreshToken(user?.account);
      if (res?.token) {
        localStorage.setItem('zeno_token', res.token);
      }
    } catch (e) {
      console.warn('[Stations] Refresh token warn:', e.message);
    }
    if (onSelectDevice) {
      onSelectDevice(st.stationId, dev.deviceId);
    } else if (onNavigate) {
      onNavigate('dashboard', { stationId: st.stationId, deviceId: dev.deviceId });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchScope('ALL');
    setStatusFilter('ALL');
    setSortBy('DEFAULT');
  };

  // Logic lọc và sắp xếp danh sách trạm & thiết bị
  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = stations.filter((st) => {
      // 1. Kiểm tra từ khóa tìm kiếm theo Scope
      let matchQuery = true;
      if (query) {
        const nameMatch = (st.stationName && st.stationName.toLowerCase().includes(query)) ||
                          (st.stationId && String(st.stationId).toLowerCase().includes(query)) ||
                          (st.address && st.address.toLowerCase().includes(query)) ||
                          (st.ownerName && st.ownerName.toLowerCase().includes(query));

        const snMatch = Array.isArray(st.devices) && st.devices.some(
          (d) => d.serialNumber && d.serialNumber.toLowerCase().includes(query)
        );

        const dtuMatch = Array.isArray(st.devices) && st.devices.some(
          (d) => d.dtuCode && d.dtuCode.toLowerCase().includes(query)
        );

        const devNameMatch = Array.isArray(st.devices) && st.devices.some(
          (d) => d.deviceName && d.deviceName.toLowerCase().includes(query)
        );

        if (searchScope === 'NAME') {
          matchQuery = nameMatch;
        } else if (searchScope === 'SN') {
          matchQuery = snMatch;
        } else if (searchScope === 'DTU') {
          matchQuery = dtuMatch;
        } else {
          // 'ALL'
          matchQuery = nameMatch || snMatch || dtuMatch || devNameMatch;
        }
      }

      if (!matchQuery) return false;

      // 2. Kiểm tra bộ lọc trạng thái (Status Filter)
      if (statusFilter === 'ONLINE') {
        const hasOnline = Array.isArray(st.devices) && st.devices.some((d) => d.isOnline !== false);
        if (!hasOnline && st.devices && st.devices.length > 0) return false;
      } else if (statusFilter === 'MULTI') {
        if (!st.devices || st.devices.length < 2) return false;
      }

      return true;
    });

    // 3. Sắp xếp danh sách (Sort)
    if (sortBy === 'NAME_ASC') {
      result.sort((a, b) => (a.stationName || '').localeCompare(b.stationName || ''));
    } else if (sortBy === 'NAME_DESC') {
      result.sort((a, b) => (b.stationName || '').localeCompare(a.stationName || ''));
    } else if (sortBy === 'CAPACITY_DESC') {
      result.sort((a, b) => (parseFloat(b.capacityKw || 0) - parseFloat(a.capacityKw || 0)));
    }

    return result;
  }, [stations, searchQuery, searchScope, statusFilter, sortBy]);

  const cleanQuery = searchQuery.trim().toLowerCase();
  const isFiltering = !!cleanQuery || searchScope !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'DEFAULT';

  // Dynamic placeholder text
  const getSearchPlaceholder = () => {
    if (searchScope === 'NAME') return 'Nhập tên dự án / trạm để tìm kiếm...';
    if (searchScope === 'SN') return 'Nhập số Serial SN biến tần (VD: 3528214760-1, 6074969919-1)...';
    if (searchScope === 'DTU') return 'Nhập mã DTU truyền thông (VD: 35282147608648059097)...';
    return 'Tìm nhanh dự án theo Tên dự án, Mã SN (Serial), Mã DTU hoặc ID trạm...';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in pb-16">
      
      {/* 1. Header Trang */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-5 rounded-2xl shadow-xl transition-colors duration-300`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5`}>
            <Zap className="w-6 h-6 text-amber-500" />
            {isHomeowner ? 'Hệ Thống Thiết Bị & Pin Lưu Trữ' : isDistributor ? 'Giám Sát Trạm & Kho Máy Biến Tần' : 'Trạm Phụ Trách & Cấu Hình Biến Tần'}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isHomeowner
              ? '🏠 Quyền Người Tiêu Dùng Cuối: Bấm vào thiết bị Inverter bên dưới để mở Bảng Điều Khiển hoặc bấm "Chia Sẻ Cho Đại Lý" để ủy quyền quản trị.'
              : isDistributor
              ? '👑 Quyền Tổng Phân Phối (sungo.vn): Full quyền quản trị toàn bộ trạm trên hệ thống và phân bổ cho Đại lý.'
              : '🏢 Quyền Đại Lý: Quản trị các trạm phụ trách hoặc trạm được Người tiêu dùng cuối chia sẻ, cài đặt thông số biến tần từ xa.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Thêm & Cấu Hình WiFi Thiết Bị (CHỈ HIỂN THỊ DUY NHẤT Ở TÀI KHOẢN NGƯỜI TIÊU DÙNG CUỐI) */}
          {isHomeowner && (
            <button
              onClick={() => setIsClaimOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 text-slate-950 transition text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Wifi className="w-4 h-4" />
              <span>+ Cấu Hình WiFi & Liên Kết Thiết Bị</span>
            </button>
          )}

          <button
            onClick={loadStations}
            className={`px-3.5 py-2 rounded-xl border transition text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm & Bộ Lọc Nhanh Dự Án (Dành cho Admin Tổng Phân Phối & Kỹ Thuật Đại Lý) */}
      <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border p-4 rounded-2xl shadow-lg space-y-3.5 transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Ô Nhập Tìm Kiếm Tức Thì */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} pointer-events-none`} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              className={`w-full pl-10 pr-10 py-2.5 ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
              } border focus:border-cyan-500 rounded-xl text-xs focus:outline-none transition font-medium`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-3 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} p-0.5 rounded-md transition cursor-pointer`}
                title="Xóa từ khóa (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Chọn Phạm Vi Tìm Kiếm (Scope) */}
          <div className={`flex items-center gap-1 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'} border p-1 rounded-xl text-[11px] sm:text-xs shrink-0 overflow-x-auto max-w-full`}>
            <button
              onClick={() => setSearchScope('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                searchScope === 'ALL'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tất Cả</span>
            </button>

            <button
              onClick={() => setSearchScope('NAME')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                searchScope === 'NAME'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Tên Dự Án</span>
            </button>

            <button
              onClick={() => setSearchScope('SN')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                searchScope === 'SN'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Mã SN</span>
            </button>

            <button
              onClick={() => setSearchScope('DTU')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                searchScope === 'DTU'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Mã DTU</span>
            </button>
          </div>

          {/* Sắp Xếp (Sort Dropdown) */}
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800 shadow-sm'} border rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer w-full sm:w-auto`}
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="NAME_ASC">Tên dự án (A → Z)</option>
              <option value="NAME_DESC">Tên dự án (Z → A)</option>
              <option value="CAPACITY_DESC">Công suất (Lớn nhất)</option>
            </select>
          </div>
        </div>

        {/* Hàng Phụ: Bộ Lọc Trạng Thái & Thống Kê Số Lượng */}
        <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'} text-xs`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-wider flex items-center gap-1`}>
              <Filter className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`} />
              Lọc nhanh:
            </span>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] cursor-pointer ${
                statusFilter === 'ALL'
                  ? isDark ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              Tất cả ({stations.length})
            </button>

            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ONLINE'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900 border border-transparent' : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Trực Tuyến (Online)</span>
            </button>

            <button
              onClick={() => setStatusFilter('MULTI')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'MULTI'
                  ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-300 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-900 border border-transparent' : 'text-slate-600 hover:text-amber-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Đa Inverter (≥2 máy)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
              Hiển thị: <strong className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'} font-mono`}>{filteredStations.length}</strong> / {stations.length} dự án
            </span>
          </div>
        </div>
      </div>

      {/* 3. Danh sách các Trạm & Thiết Bị (Stations & Inverters) */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Đang quét trạm & thiết bị từ Cloud...</p>
        </div>
      ) : stations.length === 0 ? (
        <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-10 text-center space-y-3`}>
          <Server className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-400'} mx-auto`} />
          <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Chưa tìm thấy trạm nào</h3>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} max-w-sm mx-auto`}>
            Tài khoản hiện chưa có trạm năng lượng nào được đăng ký trên hệ thống.
          </p>
        </div>
      ) : filteredStations.length === 0 ? (
        /* Giao diện khi tìm kiếm không có kết quả */
        <div className={`${isDark ? 'bg-[#0b101e] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-10 text-center space-y-4 shadow-xl animate-fade-in`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Không tìm thấy dự án nào phù hợp</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              Không có dự án nào khớp với từ khóa <strong className="text-cyan-500 font-mono font-bold">"{searchQuery}"</strong> trong phạm vi đã chọn.
            </p>
          </div>
          <div>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              Đặt Lại Tìm Kiếm & Xem Toàn Bộ
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStations.map((st) => (
            <div 
              key={st.stationId}
              className={`${isDark ? 'bg-[#0b101e] border-slate-800/90 hover:border-slate-700/80' : 'bg-white border-slate-200 hover:border-cyan-400 shadow-md'} border rounded-2xl p-5 shadow-2xl space-y-5 relative overflow-hidden transition-all`}
            >
              {/* Header Trạm */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-wide`}>
                      {st.stationName}
                    </h2>
                    <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-cyan-700 bg-cyan-50 border-cyan-200'} border px-2 py-0.5 rounded-md`}>
                      ID: {st.stationId}
                    </span>
                    {st.ownerName && (
                      <span className={`text-[11px] font-medium border px-2 py-0.5 rounded-md ${isDark ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                        Chủ: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{st.ownerName}</span>
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{st.address || 'Hồ Chí Minh, Vietnam'}</span>
                  </div>

                  {/* Danh sách đại lý được ủy quyền (nếu có) */}
                  {Array.isArray(st.sharedDealers) && st.sharedDealers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                        Đại lý ủy quyền:
                      </span>
                      {st.sharedDealers.map((sh) => (
                        <span
                          key={sh.shareId || sh.dealerAccount}
                          onClick={(e) => isHomeowner && handleOpenShareModal(st, e)}
                          className={`px-2 py-0.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          } ${isHomeowner ? 'cursor-pointer hover:border-cyan-500/50 hover:text-cyan-400 transition' : ''}`}
                          title={isHomeowner ? 'Bấm để quản lý quyền ủy quyền đại lý' : ''}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sh.dealerName || sh.dealerAccount}</span>
                          <span className="text-[10px] text-cyan-500 font-mono">({sh.dealerAccount})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs">
                  <div className={`border px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-right ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <span className={`text-[9px] sm:text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block font-semibold`}>Công Suất Lắp Đặt</span>
                    <span className="font-extrabold text-amber-500 font-mono text-xs sm:text-sm">{st.installedCapacity || `${st.capacityKw} kWp`}</span>
                  </div>

                  {/* 👑 Nút Đổi Đại Lý (Dành Cho Master) */}
                  {isDistributor && (
                    <button
                      onClick={(e) => handleOpenReassign(st, null, e)}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 hover:border-cyan-500/50 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer shadow-sm"
                      title="Chuyển giao hoặc gán lại Đại Lý quản lý trạm này"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Đổi Đại Lý</span>
                    </button>
                  )}

                  {/* Nút Chia Sẻ Cho Đại Lý (Dành Cho Chủ Nhà) */}
                  {isHomeowner && (
                    <button
                      onClick={(e) => handleOpenShareModal(st, e)}
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-amber-500/20 hover:from-teal-500/30 text-cyan-500 border border-cyan-500/40 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer shadow-md shadow-cyan-500/10"
                      title="Chia sẻ quyền quản trị cho Đại lý"
                    >
                      <Share2 className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Chia Sẻ Đại Lý</span>
                    </button>
                  )}

                  {/* Nút Cài Đặt Dự Án */}
                  <button
                    onClick={(e) => handleOpenProjectSettings(st, e)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500/40' 
                        : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300 shadow-sm hover:border-cyan-500'
                    }`}
                    title="Cài đặt đơn giá tiền điện, công suất PV và pin lưu trữ của dự án này"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Cài đặt dự án</span>
                  </button>

                  {/* Nút Cấu Hình Inverter */}
                  {!isHomeowner && (
                    <button
                      onClick={(e) => handleOpenConfig(st, e)}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
                      }`}
                      title="Cấu hình Inverter từ xa"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cấu hình</span>
                    </button>
                  )}

                  {/* Nút Xóa Trạm (Master - Bắt buộc nhập mật khẩu sungo123) */}
                  {isDistributor && (
                    <button
                      onClick={(e) => handleDeleteStationClick(st, e)}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:border-rose-500/50 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer"
                      title="Xóa trạm năng lượng (yêu cầu mật khẩu sungo123)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Xóa Trạm</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách Thiết Bị (Devices / Inverters) của Trạm */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  <span>Thiết Bị Inverter Trong Trạm ({(st.devices && st.devices.length) || 1})</span>
                  <span className="text-cyan-500 lowercase text-[10px] sm:text-[11px] font-medium">• Bấm để xem Bảng Điều Khiển</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {(st.devices && st.devices.length > 0 ? st.devices : [
                    {
                      deviceId: '465132145264787456',
                      deviceName: 'sungo',
                      serialNumber: '3528214760-1',
                      dtuCode: '35282147608648059097',
                      ratedPower: '12.0 kW',
                      machineType: 'MEGA-ECO 12kW'
                    }
                  ]).map((dev) => {
                    const isSnMatch = cleanQuery && dev.serialNumber && dev.serialNumber.toLowerCase().includes(cleanQuery);
                    const isDtuMatch = cleanQuery && dev.dtuCode && dev.dtuCode.toLowerCase().includes(cleanQuery);
                    const isNameMatch = cleanQuery && dev.deviceName && dev.deviceName.toLowerCase().includes(cleanQuery);
                    const isDeviceMatched = isSnMatch || isDtuMatch || isNameMatch;

                    return (
                      <div
                        key={dev.deviceId}
                        onClick={() => handleDeviceClick(st, dev)}
                        className={`group p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                          isDeviceMatched
                            ? isDark
                              ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-[#0d1424] border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                              : 'bg-gradient-to-br from-cyan-50 via-white to-teal-50 border-2 border-cyan-500 shadow-xl shadow-cyan-500/10'
                            : isDark
                              ? 'bg-gradient-to-br from-slate-900 to-[#0d1424] hover:from-slate-850 hover:to-[#111a30] border border-slate-800/90 hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10'
                              : 'bg-gradient-to-br from-slate-50 to-white hover:from-cyan-50/40 hover:to-white border border-slate-200 hover:border-cyan-400 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Match Tags Badge nếu khớp từ khóa tìm kiếm */}
                        {isDeviceMatched && (
                          <div className="absolute -top-2.5 right-4 z-10 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-[10px] font-black shadow-md uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            <span>{isSnMatch ? '✓ Khớp mã SN' : isDtuMatch ? '✓ Khớp mã DTU' : '✓ Khớp thiết bị'}</span>
                          </div>
                        )}

                        <div className="space-y-2.5 sm:space-y-3">
                          {/* Top device info */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5 sm:space-x-3">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition shrink-0 ${
                                isDeviceMatched 
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400 shadow-sm'
                                  : 'bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-500'
                              }`}>
                                <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className={`font-extrabold text-xs sm:text-sm truncate ${
                                    isDeviceMatched 
                                      ? 'text-cyan-500' 
                                      : isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-600'
                                  }`}>
                                    {dev.deviceName || 'Inverter'}
                                  </h3>
                                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                                    Online
                                  </span>
                                </div>
                                <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono truncate`}>
                                  {dev.machineType || 'Hybrid Inverter'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition" />
                            </div>
                          </div>

                          {/* Hardware Identifiers */}
                          <div className={`border rounded-xl p-2 sm:p-2.5 space-y-1 text-xs font-mono transition ${
                            isDeviceMatched 
                              ? isDark ? 'bg-slate-950/90 border-cyan-500/40' : 'bg-white border-cyan-400 shadow-sm'
                              : isDark ? 'bg-[#0b101e] border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className={`flex items-center justify-between gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'} text-[11px]`}>
                              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 shrink-0`}>
                                <Hash className="w-3 h-3 text-slate-400" />
                                Số Serial:
                              </span>
                              <span className={`font-bold font-mono truncate text-right ${isSnMatch ? 'text-amber-500 bg-amber-500/15 px-1 rounded border border-amber-500/30' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                {dev.serialNumber}
                              </span>
                            </div>
                            <div className={`flex items-center justify-between gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'} text-[11px]`}>
                              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 shrink-0`}>
                                <Radio className="w-3 h-3 text-slate-400" />
                                Mã DTU:
                              </span>
                              <span className={`font-bold font-mono truncate text-right text-[10px] sm:text-[11px] ${isDtuMatch ? 'text-cyan-500 bg-cyan-500/15 px-1 rounded border border-cyan-500/30' : 'text-cyan-500'}`}>
                                {dev.dtuCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action trigger button */}
                        <div className={`mt-3 pt-2.5 border-t ${isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'} flex items-center justify-between text-xs`}>
                          <div className="flex items-center gap-1.5">
                            {/* Nút Đổi Đại Lý Cho Riêng Máy Này (Master) */}
                            {isDistributor && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenReassign(st, dev, e)}
                                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                title="Đổi đại lý phụ trách máy này"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Đổi ĐL</span>
                              </button>
                            )}

                            {/* Nút Xóa Thiết Bị (Dành Cho Master hoặc Đại Lý) */}
                            {(isDistributor || isInstaller) && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDeviceClick(st, dev, e)}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                title={isDistributor ? 'Xóa vĩnh viễn thiết bị khỏi hệ thống' : 'Xóa thiết bị khỏi danh sách đại lý (nhập SN)'}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa máy</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 font-bold text-cyan-500 group-hover:text-cyan-600 text-[11px] sm:text-xs shrink-0">
                            <span>Mở Bảng Điều Khiển</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remote Configuration Modal (Chỉ mở khi có quyền) */}
      {!isHomeowner && (
        <RemoteConfigModal
          station={configStation}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
        />
      )}

      {/* Claim Device & WiFi Provisioning Modal (Mở cho tất cả các vai trò: Tổng PP, Thợ & Chủ Nhà) */}
      <ClaimDeviceModal
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
        onSuccess={loadStations}
      />

      {/* Station Project Settings Modal (Đơn giá tiền điện, PV, Pin lưu trữ riêng của trạm) */}
      <StationSettingsModal
        isOpen={isProjectSettingsOpen}
        station={selectedStationForSettings}
        onClose={() => setIsProjectSettingsOpen(false)}
        onSaved={loadStations}
      />

      {/* Share Station to Dealer Modal (Dành riêng cho Chủ Nhà / Người Dùng Cuối) */}
      <ShareStationModal
        isOpen={isShareModalOpen}
        station={selectedStationForShare}
        onClose={() => setIsShareModalOpen(false)}
        onShared={loadStations}
      />

      {/* 👑 Reassign Dealer Modal (Dành Cho Master) */}
      <ReassignDealerModal
        isOpen={isReassignOpen}
        station={reassignStation}
        device={reassignDevice}
        onClose={() => setIsReassignOpen(false)}
        onSuccess={loadStations}
      />

      {/* 🔒 Safe Delete Modal (Master nhập sungo123, Dealer nhập Serial Number) */}
      <SafeDeleteModal
        isOpen={isSafeDeleteOpen}
        onClose={() => setIsSafeDeleteOpen(false)}
        onConfirm={handleExecuteSafeDelete}
        title={safeDeleteTarget?.title}
        itemName={safeDeleteTarget?.name}
        itemId={safeDeleteTarget?.id}
        itemType={safeDeleteTarget?.type}
        serialNumber={safeDeleteTarget?.serialNumber}
        isMaster={isDistributor}
        isDealer={isInstaller}
      />
    </div>
  );
}
