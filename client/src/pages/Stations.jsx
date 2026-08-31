import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, BatteryCharging, Sun, Home, MapPin, Activity, 
  CheckCircle, RefreshCw, Sliders, Radio, ArrowRight, Eye, 
  Cpu, Server, ChevronRight, ShieldCheck, Users, PlusCircle, Wifi,
  Trash2, AlertOctagon, Search, X, Filter, Hash, Tag, Check, Sparkles,
  ArrowUpDown, Layers, Share2, UserCheck
} from 'lucide-react';
import api, { monitoringService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RemoteConfigModal from '../components/RemoteConfigModal';
import ClaimDeviceModal from '../components/ClaimDeviceModal';
import StationSettingsModal from '../components/StationSettingsModal';
import ShareStationModal from '../components/ShareStationModal';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Stations({ onNavigate, onSelectDevice }) {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configStation, setConfigStation] = useState(null);
  
  // Modal Chia Sẻ Trạm Cho Đại Lý (Dành Cho Chủ Nhà / Người Dùng Cuối)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedStationForShare, setSelectedStationForShare] = useState(null);

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

  // Modal Xóa Trạm (Admin Master)
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isHomeowner = user?.userType === 3;
  const isDistributor = user?.userType === 1;
  const isInstaller = user?.userType === 2;

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
    e.stopPropagation();
    if (isHomeowner) return; // Chủ nhà không thể mở
    setConfigStation(st);
    setIsConfigOpen(true);
  };

  const handleOpenProjectSettings = (st, e) => {
    e.stopPropagation();
    setSelectedStationForSettings(st);
    setIsProjectSettingsOpen(true);
  };

  const handleOpenShareModal = (st, e) => {
    e.stopPropagation();
    setSelectedStationForShare(st);
    setIsShareModalOpen(true);
  };

  const handleDeleteStationClick = (st, e) => {
    e.stopPropagation();
    setStationToDelete(st);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stationToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await monitoringService.deleteStation(stationToDelete.stationId);
      setIsDeleteModalOpen(false);
      setStationToDelete(null);
      await loadStations();
    } catch (err) {
      setDeleteError(err.message || 'Lỗi khi xóa trạm');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeviceClick = (st, dev) => {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b101e] border border-slate-800/90 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            {isHomeowner ? 'Hệ Thống Thiết Bị & Pin Lưu Trữ' : isDistributor ? 'Giám Sát Trạm & Kho Máy Biến Tần' : 'Trạm Phụ Trách & Cấu Hình Biến Tần'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isHomeowner
              ? '🏠 Quyền Người Tiêu Dùng Cuối: Bấm vào thiết bị Inverter bên dưới để mở Bảng Điều Khiển hoặc bấm "Chia Sẻ Cho Đại Lý" để ủy quyền quản trị.'
              : isDistributor
              ? '👑 Quyền Tổng Phân Phối (sungo.vn): Full quyền quản trị toàn bộ trạm trên hệ thống và phân bổ cho Đại lý.'
              : '🏢 Quyền Đại Lý: Quản trị các trạm phụ trách hoặc trạm được Người tiêu dùng cuối chia sẻ, cài đặt thông số biến tần từ xa.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Thêm & Cấu Hình WiFi Thiết Bị (Mở cho toàn bộ các cấp: Tổng PP, Thợ & Chủ Nhà) */}
          <button
            onClick={() => setIsClaimOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 text-slate-950 transition text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Wifi className="w-4 h-4" />
            <span>+ Cấu Hình WiFi & Thêm Thiết Bị</span>
          </button>

          <button
            onClick={loadStations}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm & Bộ Lọc Nhanh Dự Án (Dành cho Admin Tổng Phân Phối & Kỹ Thuật Đại Lý) */}
      <div className="bg-[#0b101e] border border-slate-800/90 p-4 rounded-2xl shadow-lg space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Ô Nhập Tìm Kiếm Tức Thì */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition cursor-pointer"
                title="Xóa từ khóa (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Chọn Phạm Vi Tìm Kiếm (Scope) */}
          <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl text-[11px] sm:text-xs shrink-0 overflow-x-auto max-w-full">
            <button
              onClick={() => setSearchScope('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                searchScope === 'ALL'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="NAME_ASC">Tên dự án (A → Z)</option>
              <option value="NAME_DESC">Tên dự án (Z → A)</option>
              <option value="CAPACITY_DESC">Công suất (Lớn nhất)</option>
            </select>
          </div>
        </div>

        {/* Hàng Phụ: Bộ Lọc Trạng Thái & Thống Kê Số Lượng */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              Lọc nhanh:
            </span>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              Tất cả ({stations.length})
            </button>

            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ONLINE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Trực Tuyến (Online)</span>
            </button>

            <button
              onClick={() => setStatusFilter('MULTI')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'MULTI'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Đa Inverter (≥2 máy)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Hiển thị: <strong className="text-cyan-400 font-mono">{filteredStations.length}</strong> / {stations.length} dự án
            </span>

            {isFiltering && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Xóa toàn bộ bộ lọc và từ khóa"
              >
                <X className="w-3 h-3" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Danh sách các Trạm & Thiết Bị (Stations & Inverters) */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Đang quét trạm & thiết bị từ Cloud...</p>
        </div>
      ) : stations.length === 0 ? (
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-10 text-center space-y-3">
          <Server className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Chưa tìm thấy trạm nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tài khoản hiện chưa có trạm năng lượng nào được đăng ký trên hệ thống.
          </p>
        </div>
      ) : filteredStations.length === 0 ? (
        /* Giao diện khi tìm kiếm không có kết quả */
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-10 text-center space-y-4 shadow-xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-200">Không tìm thấy dự án nào phù hợp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Không có dự án nào khớp với từ khóa <strong className="text-cyan-400 font-mono font-bold">"{searchQuery}"</strong> trong phạm vi đã chọn.
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 max-w-md mx-auto text-left space-y-1">
            <span className="font-bold text-slate-400 block mb-1">💡 Gợi ý tìm kiếm nhanh:</span>
            <p>• Nhập chính xác hoặc 1 phần tên dự án (VD: <span className="text-slate-300 font-mono">Kho trung châu</span>, <span className="text-slate-300 font-mono">sungoPlant</span>)</p>
            <p>• Nhập số Serial SN biến tần (VD: <span className="text-slate-300 font-mono">3528214760-1</span>, <span className="text-slate-300 font-mono">6074969919-1</span>)</p>
            <p>• Nhập mã DTU truyền thông (VD: <span className="text-slate-300 font-mono">35282147608648059097</span>)</p>
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
              className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-5 relative overflow-hidden transition-all hover:border-slate-700/80"
            >
              {/* Header Trạm */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h2 className="text-lg font-black text-white tracking-wide">
                      {st.stationName}
                    </h2>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                      ID: {st.stationId}
                    </span>
                    {st.ownerName && (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                        Chủ: <span className="text-slate-200 font-semibold">{st.ownerName}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
                          className={`px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 ${
                            isHomeowner ? 'cursor-pointer hover:border-cyan-500/50 hover:text-cyan-300 transition' : ''
                          }`}
                          title={isHomeowner ? 'Bấm để quản lý quyền ủy quyền đại lý' : ''}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="font-bold text-white">{sh.dealerName || sh.dealerAccount}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">({sh.dealerAccount})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-right">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold">Công Suất Lắp Đặt</span>
                    <span className="font-extrabold text-amber-400 font-mono text-xs sm:text-sm">{st.installedCapacity || `${st.capacityKw} kWp`}</span>
                  </div>

                  {/* Nút Chia Sẻ Cho Đại Lý */}
                  {isHomeowner && (
                    <button
                      onClick={(e) => handleOpenShareModal(st, e)}
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-amber-500/20 hover:from-teal-500/30 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer shadow-md shadow-cyan-500/10"
                      title="Chia sẻ quyền quản trị cho Đại lý"
                    >
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Chia Sẻ Đại Lý</span>
                    </button>
                  )}

                  {/* Nút Cài Đặt Dự Án */}
                  <button
                    onClick={(e) => handleOpenProjectSettings(st, e)}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer"
                    title="Cài đặt đơn giá tiền điện, công suất PV và pin lưu trữ của dự án này"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cài đặt dự án</span>
                  </button>

                  {/* Nút Cấu Hình Inverter */}
                  {!isHomeowner && (
                    <button
                      onClick={(e) => handleOpenConfig(st, e)}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer"
                      title="Cấu hình Inverter từ xa"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cấu hình</span>
                    </button>
                  )}

                  {/* Nút Xóa Trạm */}
                  {isDistributor && (
                    <button
                      onClick={(e) => handleDeleteStationClick(st, e)}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition flex items-center gap-1 font-bold text-[11px] sm:text-xs cursor-pointer"
                      title="Xóa trạm tạo sai"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách Thiết Bị (Devices / Inverters) của Trạm */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Thiết Bị Inverter Trong Trạm ({(st.devices && st.devices.length) || 1})</span>
                  <span className="text-cyan-400 lowercase text-[10px] sm:text-[11px] font-medium">• Bấm để xem Bảng Điều Khiển</span>
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
                        className={`group p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                          isDeviceMatched
                            ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-[#0d1424] border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                            : 'bg-gradient-to-br from-slate-900 to-[#0d1424] hover:from-slate-850 hover:to-[#111a30] border border-slate-800/90 hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10'
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
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-sm'
                                  : 'bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400'
                              }`}>
                                <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className={`font-extrabold text-xs sm:text-sm truncate ${
                                    isDeviceMatched ? 'text-cyan-300' : 'text-white group-hover:text-cyan-300'
                                  }`}>
                                    {dev.deviceName || 'Inverter'}
                                  </h3>
                                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                    Online
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                                  {dev.machineType || 'Hybrid Inverter'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                            </div>
                          </div>

                          {/* Hardware Identifiers */}
                          <div className={`border rounded-lg p-2 sm:p-2.5 space-y-1 text-xs font-mono transition ${
                            isDeviceMatched 
                              ? 'bg-slate-950/90 border-cyan-500/40' 
                              : 'bg-[#0b101e] border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-2 text-slate-300 text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1 shrink-0">
                                <Hash className="w-3 h-3 text-slate-500" />
                                Số Serial:
                              </span>
                              <span className={`font-bold font-mono truncate text-right ${isSnMatch ? 'text-amber-300 bg-amber-500/20 px-1 rounded border border-amber-500/40' : 'text-white'}`}>
                                {dev.serialNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-slate-300 text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1 shrink-0">
                                <Radio className="w-3 h-3 text-slate-500" />
                                Mã DTU:
                              </span>
                              <span className={`font-bold font-mono truncate text-right text-[10px] sm:text-[11px] ${isDtuMatch ? 'text-cyan-300 bg-cyan-500/20 px-1 rounded border border-cyan-500/40' : 'text-cyan-300'}`}>
                                {dev.dtuCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action trigger button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Viễn trắc realtime</span>
                          <div className="flex items-center gap-1 font-bold text-cyan-400 group-hover:text-cyan-300 text-[11px] sm:text-xs shrink-0">
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

      {/* Delete Station Confirmation Modal (Chỉ Admin / Master) */}
      {isDeleteModalOpen && stationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-rose-500/10 space-y-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Xác Nhận Xóa Trạm Năng Lượng</h3>
                <p className="text-xs text-rose-300 font-medium">Quyền Quản Trị: Hành động không thể hoàn tác!</p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tên trạm:</span>
                <span className="font-bold text-white">{stationToDelete.stationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mã ID Trạm:</span>
                <span className="font-mono font-bold text-cyan-400">{stationToDelete.stationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số Inverter liên kết:</span>
                <span className="font-bold text-amber-400">{(stationToDelete.devices && stationToDelete.devices.length) || 0} Inverter</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn đang thực hiện xóa vĩnh viễn trạm <strong className="text-white">{stationToDelete.stationName}</strong> khỏi hệ thống quản trị Zeno. Toàn bộ thiết bị Inverter liên kết sai hoặc tạo nhầm sẽ được gỡ bỏ ngay lập tức.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
