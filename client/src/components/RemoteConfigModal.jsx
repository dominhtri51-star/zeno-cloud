import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, X, Sliders, Shield, Zap, RefreshCw, 
  CheckCircle2, CheckCircle, AlertTriangle, Battery, Clock, 
  Cpu, Radio, Activity, Check, Gauge, ChevronDown, 
  Sparkles, Layers, ChevronRight, HelpCircle, Save,
  Flame, Power, Wrench, RotateCcw
} from 'lucide-react';
import api from '../services/api';

export default function RemoteConfigModal({ station, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'advanced'

  // ================= 1. CÀI ĐẶT NHANH (MẶC ĐỊNH CHUẨN XÁC THEO HÌNH) =================
  const [workMode, setWorkMode] = useState('SELF_CONSUMPTION'); // Tự Dùng Tối Đa
  const [pvEnergyModel, setPvEnergyModel] = useState('LOAD_FIRST'); // Ưu Tiên Tải Đầu Tiên
  const [ctMeterType, setCtMeterType] = useState('CT'); // Kẹp Dòng CT
  const [syncVnTime, setSyncVnTime] = useState(true); // Tự đồng bộ UTC+7 (VN)
  const [batteryType, setBatteryType] = useState('lithium'); // Mặc định: lithium (Lithium BMS CAN/485)
  const [liProtocol, setLiProtocol] = useState('1'); // Mặc định: 1: CANBUS (CANBUS Lithium BMS)

  // Giao diện cố định 10/10 Quản Lý Pin (Mặc định chuẩn theo hình)
  const [chargeCurrent, setChargeCurrent] = useState(60); // 60 A
  const [dischargeCurrent, setDischargeCurrent] = useState(100); // 100 A
  const [dischargeInGridCurrent, setDischargeInGridCurrent] = useState(80); // 80 A (BatteryDischargeCurrentInGrid)
  const [cutoffSoc, setCutoffSoc] = useState(20); // 20 %

  // ================= 2. CÀI ĐẶT NÂNG CAO (41 THANH GHI MODBUS) =================
  const [advConfig, setAdvConfig] = useState({
    // Nhóm 1: Chế Độ Nguồn & Vận Hành
    outputSourcePrioritySetting: '4',
    chargerSourcePrioritySetting: '2',
    gridTieOperationSetting: '0',
    OnlyPVSell: '0',
    machineNotAllowOutput: '0',

    // Nhóm 2: Đo Đếm & Bám Tải
    CT_MeterSetting: '1',
    CTRatio: '2500',
    ZeroToGrid: '0',
    FeedPower: '0',

    // Nhóm 3: Cấu Hình Pin & BMS Lithium
    batteryTypeSettings: '3',
    LiActive: '1',
    LiProtocol: '1',
    BMSAddress: '0',
    BMSError: '0',
    timeSetting: '',
    TOUEnable: '0',

    // Nhóm 4: Quản Lý Dòng & Ngưỡng Dung Lượng Pin
    maxTotalChargeCurrentSetting: '60',
    maxUtilityChargeCurrentSetting: '60',
    MaximumBatteryDischargeCurrent: '100',
    BatteryDischargeCurrentInGrid: '80',
    StopDischargeSOC: '20',
    UnderSOC: '10',
    RedischargeSOC: '20',
    MaxChargeSOC: '100',
    EPSOffSOC: '15',

    // Nhóm 5: Cài Đặt Điện Áp Sạc/Xả Theo Volt
    bulkChargingVoltageSetting: '55.8',
    flotingChargingVoltageSetting: '54.0',
    LowBatteryCutOffVoltageSetting: '48',
    comebackBatteryModeVolSBUPriority: '52.0',
    comebackUtilityModeVolSBUPriority: '46.0',
    batteryEqualizationVoltageSetting: '56.4',
    batteryEqualizationIntervalSetting: '30',
    batteryEqualizationTimeoutSetting: '120',

    // Nhóm 6: Lưới Điện AC & Tiêu Chuẩn Hòa Lưới
    acInputRangeSetting: '1',
    outputVoltageSettings: '230',
    outputFrequencySetting: '0',
    GridCode: '0',
    GFCICheck: '1',
    ParallelModel: '0',

    // Nhóm 7: Nguồn Dự Phòng EPS & Bảo Vệ Tự Động
    DualOutputSwitch: '0',
    EnterDualOutputFunctionalVoltage: '48.0',
    epsOnSOC: '25',
    epsOnVoltage: '48.0',
    epsPower: '100',
    overloadAutoRestartStatusSetting: '1',
    overTemperatureAutoRestartStatusSetting: '1',
    transferToBypassOverloadStatusSetting: '1',
    ledPatternLightSetting: '1'
  });

  const [expandedSections, setExpandedSections] = useState({
    group1: true,
    group2: false,
    group3: false,
    group4: false,
    group5: false,
    group6: false,
    group7: false
  });

  const toggleSection = (grp) => {
    setExpandedSections(prev => ({ ...prev, [grp]: !prev[grp] }));
  };

  const handleAdvChange = (key, val) => {
    setAdvConfig(prev => ({ ...prev, [key]: val }));
    if (key === 'batteryTypeSettings') {
      if (val === '2') setBatteryType('use');
      else if (val === '0') setBatteryType('agm');
      else if (val === '1') setBatteryType('fld');
      else if (val === '3') setBatteryType('lithium');
    } else if (key === 'outputSourcePrioritySetting' || key === 'outputSourcePriority') {
      let mappedWorkMode = 'SELF_CONSUMPTION';
      if (val === '4' || val === 'self' || val === 'SELF') mappedWorkMode = 'SELF_CONSUMPTION';
      else if (val === '1' || val === 'solar_first') mappedWorkMode = 'BATTERY_FIRST';
      else if (val === '2' || val === 'utility_first') mappedWorkMode = 'BACKUP_UPS';
      else if (val === '3' || val === 'sub' || val === 'SUB') mappedWorkMode = 'FEED_IN_GRID';
      setWorkMode(mappedWorkMode);
      setAdvConfig(prev => ({
        ...prev,
        outputSourcePrioritySetting: val,
        outputSourcePriority: val
      }));
    } else if (key === 'chargerSourcePrioritySetting') {
      if (val === '2') setPvEnergyModel('LOAD_FIRST');
      else if (val === '1') setPvEnergyModel('BATTERY_FIRST');
      else if (val === '3') setPvEnergyModel('GRID_FIRST');
    } else if (key === 'CT_MeterSetting') {
      setCtMeterType(val === '1' ? 'CT' : 'METER');
    } else if (key === 'maxTotalChargeCurrentSetting') {
      setChargeCurrent(parseInt(val, 10) || 60);
    } else if (key === 'MaximumBatteryDischargeCurrent') {
      setDischargeCurrent(parseInt(val, 10) || 100);
    } else if (key === 'BatteryDischargeCurrentInGrid') {
      setDischargeInGridCurrent(parseInt(val, 10) || 80);
    } else if (key === 'StopDischargeSOC') {
      setCutoffSoc(parseInt(val, 10) || 20);
    }
  };

  const handleBatteryTypeChange = (val) => {
    setBatteryType(val);
    let numVal = '3';
    let liActive = '1';
    let liProt = liProtocol || '1';
    if (val === 'use') { numVal = '2'; liActive = '0'; }
    else if (val === 'agm') { numVal = '0'; liActive = '0'; }
    else if (val === 'fld') { numVal = '1'; liActive = '0'; }
    else if (val === 'pylon485') { numVal = '3'; liProt = '0'; liActive = '1'; }
    else if (val === 'lithium') { numVal = '3'; liProt = '1'; liActive = '1'; }
    setAdvConfig(prev => ({
      ...prev,
      batteryTypeSettings: numVal,
      LiActive: liActive,
      LiProtocol: liProt
    }));
  };

  const handleWorkModeChange = (val) => {
    setWorkMode(val);
    let numVal = '4';
    if (val === 'BATTERY_FIRST' || val === '1') numVal = '1';
    else if (val === 'BACKUP_UPS' || val === '2') numVal = '2';
    else if (val === 'FEED_IN_GRID' || val === '3') numVal = '3';
    else if (val === 'SELF_CONSUMPTION' || val === '4' || val === 'self') numVal = '4';
    setAdvConfig(prev => ({
      ...prev,
      outputSourcePrioritySetting: numVal,
      outputSourcePriority: numVal
    }));
  };

  const handlePvModelChange = (val) => {
    setPvEnergyModel(val);
    let numVal = '2';
    if (val === 'BATTERY_FIRST') numVal = '1';
    else if (val === 'GRID_FIRST') numVal = '3';
    setAdvConfig(prev => ({ ...prev, chargerSourcePrioritySetting: numVal }));
  };

  const handleCtMeterChange = (val) => {
    setCtMeterType(val);
    setAdvConfig(prev => ({ ...prev, CT_MeterSetting: val === 'CT' ? '1' : '2' }));
  };

  const handleLiProtocolChange = (val) => {
    setLiProtocol(val);
    setAdvConfig(prev => ({ ...prev, LiProtocol: String(val), LiActive: '1' }));
  };

  const handleChargeCurrentChange = (val) => {
    setChargeCurrent(val);
    setAdvConfig(prev => ({ ...prev, maxTotalChargeCurrentSetting: String(val), maxUtilityChargeCurrentSetting: String(val) }));
  };

  const handleDischargeCurrentChange = (val) => {
    setDischargeCurrent(val);
    setAdvConfig(prev => ({ ...prev, MaximumBatteryDischargeCurrent: String(val) }));
  };

  const handleDischargeInGridCurrentChange = (val) => {
    setDischargeInGridCurrent(val);
    setAdvConfig(prev => ({ ...prev, BatteryDischargeCurrentInGrid: String(val) }));
  };

  const handleCutoffSocChange = (val) => {
    setCutoffSoc(val);
    setAdvConfig(prev => ({ ...prev, StopDischargeSOC: String(val) }));
  };

  const [currentTimeVn, setCurrentTimeVn] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [presetAppliedToast, setPresetAppliedToast] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + ' ' + now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      setCurrentTimeVn(timeStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const prevOpenRef = useRef(false);
  const initialConfigRef = useRef({});

  // Tự động tải trạng thái hiện tại thực tế của Inverter chỉ 1 lần duy nhất khi mở Modal
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      loadCurrentConfig();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const loadCurrentConfig = async () => {
    setLoadingCurrent(true);
    try {
      const deviceId = station?.devices?.[0]?.deviceId || '465132145264787456';
      const res = await api.get(`/stations/config/current?deviceId=${deviceId}`);
      // Hỗ trợ cả trường hợp response đã được unwrap bởi axios interceptor lẫn raw response
      const payload = res?.quick ? res : (res?.data?.quick ? res.data : (res?.data || res));
      if (payload && (payload.quick || payload.advanced)) {
        const { quick, advanced } = payload;
        const initialMap = {};

        if (quick) {
          if (quick.workMode) { setWorkMode(quick.workMode); initialMap.workMode = quick.workMode; }
          if (quick.pvEnergyModel) { setPvEnergyModel(quick.pvEnergyModel); initialMap.pvEnergyModel = quick.pvEnergyModel; }
          if (quick.ctMeterType) { setCtMeterType(quick.ctMeterType); initialMap.ctMeterType = quick.ctMeterType; }
          if (quick.batteryType) { setBatteryType(quick.batteryType); initialMap.batteryType = quick.batteryType; }
          if (quick.liProtocol) { setLiProtocol(String(quick.liProtocol)); initialMap.liProtocol = String(quick.liProtocol); }
          if (quick.chargeCurrent !== undefined) { setChargeCurrent(Number(quick.chargeCurrent)); initialMap.chargeCurrent = Number(quick.chargeCurrent); }
          if (quick.dischargeCurrent !== undefined) { setDischargeCurrent(Number(quick.dischargeCurrent)); initialMap.dischargeCurrent = Number(quick.dischargeCurrent); }
          if (quick.dischargeInGridCurrent !== undefined) { setDischargeInGridCurrent(Number(quick.dischargeInGridCurrent)); initialMap.dischargeInGridCurrent = Number(quick.dischargeInGridCurrent); }
          if (quick.cutoffSoc !== undefined) { setCutoffSoc(Number(quick.cutoffSoc)); initialMap.cutoffSoc = Number(quick.cutoffSoc); }
        }
        if (advanced) {
          setAdvConfig(prev => {
            const next = { ...prev, ...advanced };
            Object.assign(initialMap, next);
            return next;
          });
        }
        initialConfigRef.current = initialMap;
        setLoadedFromCloud(true);
      }
    } catch (e) {
      console.warn('Lỗi đọc trạng thái cấu hình hiện tại từ Inverter:', e);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const isRecommendedActive = 
    workMode === 'SELF_CONSUMPTION' &&
    pvEnergyModel === 'LOAD_FIRST' &&
    ctMeterType === 'CT' &&
    syncVnTime === true &&
    batteryType === 'lithium' &&
    liProtocol === '1' &&
    chargeCurrent === 60 &&
    dischargeCurrent === 100 &&
    dischargeInGridCurrent === 80 &&
    cutoffSoc === 20;

  const handleApplyRecommendedPreset = () => {
    handleWorkModeChange('SELF_CONSUMPTION');
    handlePvModelChange('LOAD_FIRST');
    handleCtMeterChange('CT');
    setSyncVnTime(true);
    handleBatteryTypeChange('lithium');
    handleLiProtocolChange('1');
    handleChargeCurrentChange(60);
    handleDischargeCurrentChange(100);
    handleDischargeInGridCurrentChange(80);
    handleCutoffSocChange(20);

    setPresetAppliedToast(true);
    setTimeout(() => setPresetAppliedToast(false), 2000);
  };

  const isAdvRecommendedActive =
    advConfig.outputSourcePrioritySetting === '4' &&
    advConfig.chargerSourcePrioritySetting === '2' &&
    advConfig.gridTieOperationSetting === '0' &&
    advConfig.CT_MeterSetting === '1' &&
    advConfig.CTRatio === '2500' &&
    advConfig.batteryTypeSettings === '3' &&
    advConfig.LiProtocol === '1' &&
    advConfig.maxTotalChargeCurrentSetting === '60' &&
    advConfig.maxUtilityChargeCurrentSetting === '60' &&
    advConfig.MaximumBatteryDischargeCurrent === '100' &&
    advConfig.BatteryDischargeCurrentInGrid === '80' &&
    advConfig.StopDischargeSOC === '20' &&
    advConfig.bulkChargingVoltageSetting === '55.8' &&
    advConfig.LowBatteryCutOffVoltageSetting === '48' &&
    advConfig.epsOnSOC === '25';

  const handleApplyAdvRecommendedPreset = () => {
    setAdvConfig(prev => ({
      ...prev,
      outputSourcePrioritySetting: '4',
      chargerSourcePrioritySetting: '2',
      gridTieOperationSetting: '0',
      OnlyPVSell: '0',
      machineNotAllowOutput: '0',
      CT_MeterSetting: '1',
      CTRatio: '2500',
      ZeroToGrid: '0',
      FeedPower: '0',
      batteryTypeSettings: '3',
      LiActive: '1',
      LiProtocol: '1',
      BMSAddress: '0',
      BMSError: '0',
      TOUEnable: '0',
      maxTotalChargeCurrentSetting: '60',
      maxUtilityChargeCurrentSetting: '60',
      MaximumBatteryDischargeCurrent: '100',
      BatteryDischargeCurrentInGrid: '80',
      StopDischargeSOC: '20',
      UnderSOC: '10',
      RedischargeSOC: '20',
      MaxChargeSOC: '100',
      EPSOffSOC: '15',
      bulkChargingVoltageSetting: '55.8',
      flotingChargingVoltageSetting: '54.0',
      LowBatteryCutOffVoltageSetting: '48',
      comebackBatteryModeVolSBUPriority: '52.0',
      comebackUtilityModeVolSBUPriority: '46.0',
      batteryEqualizationVoltageSetting: '56.4',
      batteryEqualizationIntervalSetting: '30',
      batteryEqualizationTimeoutSetting: '120',
      acInputRangeSetting: '1',
      outputVoltageSettings: '230',
      outputFrequencySetting: '0',
      GridCode: '0',
      GFCICheck: '1',
      ParallelModel: '0',
      DualOutputSwitch: '0',
      EnterDualOutputFunctionalVoltage: '48.0',
      epsOnSOC: '25',
      epsOnVoltage: '48.0',
      epsPower: '100',
      overloadAutoRestartStatusSetting: '1',
      overTemperatureAutoRestartStatusSetting: '1',
      transferToBypassOverloadStatusSetting: '1',
      ledPatternLightSetting: '1'
    }));

    setBatteryType('lithium');
    setWorkMode('SELF_CONSUMPTION');
    setPvEnergyModel('LOAD_FIRST');
    setCtMeterType('CT');
    setLiProtocol('1');
    setChargeCurrent(60);
    setDischargeCurrent(100);
    setDischargeInGridCurrent(80);
    setCutoffSoc(20);

    setPresetAppliedToast(true);
    setTimeout(() => setPresetAppliedToast(false), 2000);
  };

  if (!isOpen) return null;

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const deviceId = station?.devices?.[0]?.deviceId || '465132145264787456';

      let batTypeVal = '3';
      if (batteryType === 'use') batTypeVal = '2';
      else if (batteryType === 'agm') batTypeVal = '0';
      else if (batteryType === 'fld') batTypeVal = '1';
      else if (batteryType === 'pylon485') batTypeVal = '3';

      let workModeVal = advConfig.outputSourcePrioritySetting || '4';
      if (workMode === 'BATTERY_FIRST' || workMode === '1') workModeVal = '1';
      else if (workMode === 'BACKUP_UPS' || workMode === '2') workModeVal = '2';
      else if (workMode === 'FEED_IN_GRID' || workMode === '3') workModeVal = '3';
      else if (workMode === 'SELF_CONSUMPTION' || workMode === '4' || workMode === 'self') workModeVal = '4';

      let pvModelVal = '2';
      if (pvEnergyModel === 'BATTERY_FIRST' || pvEnergyModel === '1') pvModelVal = '1';
      else if (pvEnergyModel === 'GRID_FIRST' || pvEnergyModel === '3') pvModelVal = '3';

      const initial = initialConfigRef.current || {};
      const changedConfigs = {};

      if (activeTab === 'quick') {
        // So sánh từng trường của Cài Đặt Nhanh với trạng thái ban đầu của Inverter
        if (workMode !== initial.workMode) {
          changedConfigs.outputSourcePrioritySetting = workModeVal;
        }
        if (pvEnergyModel !== initial.pvEnergyModel) {
          changedConfigs.chargerSourcePrioritySetting = pvModelVal;
        }
        if (ctMeterType !== initial.ctMeterType) {
          changedConfigs.CT_MeterSetting = ctMeterType === 'CT' ? '1' : '2';
        }
        if (batteryType !== initial.batteryType) {
          changedConfigs.batteryTypeSettings = batTypeVal;
          changedConfigs.LiActive = batTypeVal === '3' ? '1' : '0';
        }
        if (String(liProtocol) !== String(initial.liProtocol)) {
          changedConfigs.LiProtocol = String(liProtocol || '1');
          changedConfigs.LiActive = '1';
        }
        if (Number(chargeCurrent) !== Number(initial.chargeCurrent)) {
          changedConfigs.maxTotalChargeCurrentSetting = String(chargeCurrent);
          changedConfigs.maxUtilityChargeCurrentSetting = String(chargeCurrent);
        }
        if (Number(dischargeCurrent) !== Number(initial.dischargeCurrent)) {
          changedConfigs.MaximumBatteryDischargeCurrent = String(dischargeCurrent);
        }
        if (Number(dischargeInGridCurrent) !== Number(initial.dischargeInGridCurrent)) {
          changedConfigs.BatteryDischargeCurrentInGrid = String(dischargeInGridCurrent);
        }
        if (Number(cutoffSoc) !== Number(initial.cutoffSoc)) {
          changedConfigs.StopDischargeSOC = String(cutoffSoc);
        }
      } else {
        // So sánh từng thanh ghi trong Cài Đặt Nâng Cao
        for (const [k, v] of Object.entries(advConfig)) {
          const initVal = initial[k] !== undefined ? String(initial[k]) : undefined;
          if (initVal === undefined || String(v) !== initVal) {
            changedConfigs[k] = String(v);
          }
        }
      }

      const changedCount = Object.keys(changedConfigs).length;

      // Nếu không có thay đổi nào so với Inverter thực tế, thông báo ngay và đóng modal
      if (changedCount === 0) {
        setSuccessMsg('✨ Thông số hiện tại đã khớp 100% với Inverter thực tế (Không có thay đổi cần gửi)!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
        return;
      }

      console.log(`[RemoteConfigModal] Đẩy ${changedCount} thanh ghi thay đổi xuống Inverter:`, changedConfigs);

      await api.post('/stations/config/batch-write', { deviceId, configs: changedConfigs });

      // Cập nhật lại initial snapshot sau khi ghi thành công
      Object.assign(initialConfigRef.current, changedConfigs);
      if (activeTab === 'quick') {
        initialConfigRef.current.workMode = workMode;
        initialConfigRef.current.pvEnergyModel = pvEnergyModel;
        initialConfigRef.current.ctMeterType = ctMeterType;
        initialConfigRef.current.batteryType = batteryType;
        initialConfigRef.current.liProtocol = liProtocol;
        initialConfigRef.current.chargeCurrent = chargeCurrent;
        initialConfigRef.current.dischargeCurrent = dischargeCurrent;
        initialConfigRef.current.dischargeInGridCurrent = dischargeInGridCurrent;
        initialConfigRef.current.cutoffSoc = cutoffSoc;
      }

      setSuccessMsg(`⚡ Đã đồng bộ thành công ${changedCount} thông số thay đổi xuống Inverter!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi ghi cấu hình từ xa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Cửa sổ Popup: Chiều cao cố định h-[86vh] max-h-[760px], Footer ghim đáy tuyệt đối không bị khuyết */}
      <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-up h-[86vh] max-h-[760px] flex flex-col overflow-hidden relative">
        
        {/* Header - Cố định ở đỉnh */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0d1424] z-20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">Cấu Hình Inverter & Pin BMS Từ Xa</h3>
                {loadingCurrent ? (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang đọc từ Inverter...
                  </span>
                ) : (
                  loadedFromCloud && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" /> Đã nạp thông số Inverter thực tế
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-slate-400">Trạm: <span className="text-cyan-400 font-bold">{station?.stationName || 'sungoPlant'}</span> (41 Thanh Ghi Chuẩn)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector - Cố định */}
        <div className="shrink-0 flex border-b border-slate-800 bg-[#0a0f1d] px-4 pt-2 z-20">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'quick'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Cài Đặt Nhanh (1-Chạm)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'advanced'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Cài Đặt Nâng Cao (41 Thanh Ghi Hãng)</span>
          </button>
        </div>

        {/* Form Body - Cuộn mượt mà bên trong, không che khuất Header & Footer */}
        <form id="remoteConfigForm" onSubmit={handleSaveConfig} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
          {presetAppliedToast && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs sm:text-sm font-bold flex items-center space-x-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-spin" />
              <span>Đã kích hoạt và nạp toàn bộ cấu hình Chuẩn Khuyên Dùng 100%!</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= TAB 1: CÀI ĐẶT NHANH (MẶC ĐỊNH CHUẨN THEO HÌNH) ================= */}
          {activeTab === 'quick' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <label className="block text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> CÀI ĐẶT NHANH (QUICK SETUP)
                  </label>

                  <button
                    type="button"
                    onClick={handleApplyRecommendedPreset}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md ${
                      isRecommendedActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400'
                    }`}
                    title="Nhấp để tự động nạp cấu hình tối ưu 100%"
                  >
                    <Check className={`w-3.5 h-3.5 ${isRecommendedActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Chuẩn Khuyên Dùng 100%</span>
                  </button>
                </div>

                {/* 1. Chế Độ Hoạt Động -> Mặc định: Tự Dùng Tối Đa */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    1. Chế Độ Hoạt Động (Chế độ ưu tiên đầu ra — outputSourcePrioritySetting)
                  </label>
                  <div className="relative">
                    <select
                      value={workMode}
                      onChange={(e) => handleWorkModeChange(e.target.value)}
                      className="w-full bg-[#101828] border border-slate-800 hover:border-amber-500/60 focus:border-amber-500 text-slate-100 text-xs font-bold rounded-xl py-2.5 pl-3.5 pr-9 appearance-none cursor-pointer focus:outline-none transition shadow-sm"
                    >
                      <option value="SELF_CONSUMPTION" className="bg-slate-900 text-white">
                        ⚡ 4: self (Tự dùng / Self-Consumption)
                      </option>
                      <option value="BATTERY_FIRST" className="bg-slate-900 text-white">
                        🔋 1: Solar First (Ưu tiên PV)
                      </option>
                      <option value="BACKUP_UPS" className="bg-slate-900 text-white">
                        🛡️ 2: Utility First (Ưu tiên lưới)
                      </option>
                      <option value="FEED_IN_GRID" className="bg-slate-900 text-white">
                        🌐 3: SUB (Solar Utility Battery)
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Mô Hình Năng Lượng PV -> Mặc định: Load First */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    2. Mô Hình Năng Lượng PV (Chế độ ưu tiên sạc PV — chargerSourcePrioritySetting)
                  </label>
                  <div className="relative">
                    <select
                      value={pvEnergyModel}
                      onChange={(e) => handlePvModelChange(e.target.value)}
                      className="w-full bg-[#101828] border border-slate-800 hover:border-cyan-500/60 focus:border-cyan-500 text-slate-100 text-xs font-bold rounded-xl py-2.5 pl-3.5 pr-9 appearance-none cursor-pointer focus:outline-none transition shadow-sm"
                    >
                      <option value="LOAD_FIRST" className="bg-slate-900 text-white">
                        ☀️ Ưu Tiên Tải Đầu Tiên (Load First) — Chuẩn tối ưu
                      </option>
                      <option value="BATTERY_FIRST" className="bg-slate-900 text-white">
                        🔋 Ưu Tiên Sạc Pin (Battery First / Solar Only)
                      </option>
                      <option value="GRID_FIRST" className="bg-slate-900 text-white">
                        ⚡ Ưu Tiên Hòa Lưới (Grid First / Solar & Grid)
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Thiết Bị Đo Đếm Phụ Tải -> Mặc định: Kẹp Dòng CT */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    3. Thiết Bị Đo Đếm Phụ Tải (Cảm biến đo bám tải — CT_MeterSetting)
                  </label>
                  <div className="relative">
                    <select
                      value={ctMeterType}
                      onChange={(e) => handleCtMeterChange(e.target.value)}
                      className="w-full bg-[#101828] border border-slate-800 hover:border-teal-500/60 focus:border-teal-500 text-slate-100 text-xs font-bold rounded-xl py-2.5 pl-3.5 pr-9 appearance-none cursor-pointer focus:outline-none transition shadow-sm"
                    >
                      <option value="CT" className="bg-slate-900 text-white">
                        🧲 Kẹp Dòng CT (CT Clamp) — Đo tức thời chống phát ngược
                      </option>
                      <option value="METER" className="bg-slate-900 text-white">
                        📟 Đồng Hồ Điện Meter — Đo 2 chiều qua cổng RS485
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Cài Đặt Thời Gian & 5. Loại Pin (Mặc định lithium theo hình) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" /> 4. Cài Đặt Thời Gian
                    </label>
                    <div className="bg-[#101828] border border-slate-800 rounded-xl py-2 px-3 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">UTC+7 (VN):</span>
                      <span className="text-xs font-bold text-sky-300 font-mono">{currentTimeVn || 'Đang đồng bộ...'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" /> 5. Loại Pin (Battery Type)
                    </label>
                    <div className="relative">
                      <select
                        value={batteryType}
                        onChange={(e) => handleBatteryTypeChange(e.target.value)}
                        className="w-full bg-[#101828] border border-slate-800 hover:border-emerald-500/60 focus:border-emerald-500 text-emerald-300 text-xs font-bold rounded-xl py-2 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none transition shadow-sm font-mono"
                      >
                        <option value="lithium" className="bg-slate-900 text-emerald-300">
                          lithium (Lithium BMS CAN/485)
                        </option>
                        <option value="pylon485" className="bg-slate-900 text-white">
                          pylon485 (Pylontech RS485 - Chuẩn)
                        </option>
                        <option value="use" className="bg-slate-900 text-white">
                          use (User-Defined Tùy Chỉnh)
                        </option>
                        <option value="agm" className="bg-slate-900 text-white">
                          agm (Kín Khí AGM)
                        </option>
                        <option value="fld" className="bg-slate-900 text-white">
                          fld (Axit Ngập Nước Flooded)
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 6. Giao Thức Lithium (Mặc định 1: CANBUS theo hình) */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> 6. Giao Thức Lithium (LiProtocol)
                  </label>
                  <div className="relative">
                    <select
                      value={liProtocol}
                      onChange={(e) => handleLiProtocolChange(e.target.value)}
                      className="w-full bg-[#101828] border border-slate-800 hover:border-purple-500/60 focus:border-purple-500 text-purple-300 text-xs font-bold rounded-xl py-2.5 pl-3.5 pr-9 appearance-none cursor-pointer focus:outline-none transition shadow-sm font-mono"
                    >
                      <option value="1" className="bg-slate-900 text-purple-300">
                        1: CANBUS (CANBUS Lithium BMS)
                      </option>
                      <option value="0" className="bg-slate-900 text-white">
                        0: pylon485 (Pylontech RS485)
                      </option>
                      <option value="2" className="bg-slate-900 text-white">
                        2: Deye / Growatt (Giao thức Deye / Growatt)
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Khối Quản Lý Pin 10/10 (Mặc định: Sạc 60A, Xả 100A, SOC 20%) */}
              <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-black text-slate-300 uppercase tracking-wider">
                  <span>QUẢN LÝ PIN LƯU TRỮ BMS</span>
                  <span className="text-emerald-400 text-[11px] font-mono font-bold">● TỰ ĐỘNG CÂN BẰNG</span>
                </div>

                {/* Dòng Sạc Pin: 60A */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Dòng Sạc Pin BMS Tối Đa</span>
                    <span className="text-sm font-extrabold text-amber-400 font-mono">{chargeCurrent} A</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={chargeCurrent}
                    onChange={(e) => handleChargeCurrentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>10A (Êm dịu)</span>
                    <span>100A (Sạc nhanh)</span>
                  </div>
                </div>

                {/* Dòng Xả Pin BMS Tối Đa: 100A */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Dòng Xả Pin BMS Tối Đa (MaximumBatteryDischargeCurrent)</span>
                    <span className="text-sm font-extrabold text-cyan-400 font-mono">{dischargeCurrent} A</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={dischargeCurrent}
                    onChange={(e) => handleDischargeCurrentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>10A (Tiết kiệm)</span>
                    <span>120A (Công suất cao)</span>
                  </div>
                </div>

                {/* Dòng Xả Pin Khi Có Lưới: 80A */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Dòng Xả Pin Khi Có Lưới (BatteryDischargeCurrentInGrid)</span>
                    <span className="text-sm font-extrabold text-teal-400 font-mono">{dischargeInGridCurrent} A</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={dischargeInGridCurrent}
                    onChange={(e) => handleDischargeInGridCurrentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>10A (Bảo vệ lưới)</span>
                    <span>120A (Xả tối đa)</span>
                  </div>
                </div>

                {/* Ngưỡng Ngắt Xả Pin: 20% */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Ngưỡng Ngắt Xả Pin (Cut-off SOC)</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">{cutoffSoc} %</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={cutoffSoc}
                    onChange={(e) => handleCutoffSocChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>5% (Xả kiệt)</span>
                    <span>30% (Bảo vệ pin tối đa)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CÀI ĐẶT NÂNG CAO (41 THANH GHI MODBUS) ================= */}
          {activeTab === 'advanced' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <span className="text-cyan-300 text-xs font-bold block">Cấu hình chuyên sâu 41 thanh ghi Modbus chuẩn hãng</span>
                    <span className="text-[10px] text-slate-400 font-mono">41 / 41 Registers</span>
                  </div>
                </div>

                {/* NÚT BẤM CẤU HÌNH CHUẨN KHUYÊN DÙNG (KHÔI PHỤC) */}
                <button
                  type="button"
                  onClick={handleApplyAdvRecommendedPreset}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md w-full sm:w-auto justify-center ${
                    isAdvRecommendedActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/90 text-amber-300 border border-amber-500/50 hover:bg-amber-500/20 hover:border-amber-400'
                  }`}
                  title="Khôi phục toàn bộ 41 thanh ghi Modbus về chuẩn khuyên dùng 100%"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isAdvRecommendedActive ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>Chuẩn Khuyên Dùng 100% (Khôi Phục)</span>
                </button>
              </div>

              {/* NHÓM 1: Chế Độ Nguồn & Vận Hành */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group1')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Power className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100">1. Chế Độ Nguồn & Vận Hành (Priority & Operation)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group1 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group1 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          outputSourcePrioritySetting
                        </label>
                        <select
                          value={advConfig.outputSourcePrioritySetting}
                          onChange={e => handleAdvChange('outputSourcePrioritySetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="4">4: self (Tự dùng / Self-Consumption)</option>
                          <option value="1">1: Solar First (Ưu tiên PV)</option>
                          <option value="2">2: Utility First (Ưu tiên lưới)</option>
                          <option value="3">3: SUB (Solar Utility Battery)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          chargerSourcePrioritySetting
                        </label>
                        <select
                          value={advConfig.chargerSourcePrioritySetting}
                          onChange={e => handleAdvChange('chargerSourcePrioritySetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="2">2: Solar First (Load First)</option>
                          <option value="1">1: Solar Only (Chỉ dùng PV)</option>
                          <option value="3">3: Solar & Grid (Sạc cả lưới)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          gridTieOperationSetting (Hòa lưới)
                        </label>
                        <select
                          value={advConfig.gridTieOperationSetting}
                          onChange={e => handleAdvChange('gridTieOperationSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Zero Export (Bám tải)</option>
                          <option value="1">1: Feed-in (Phát lưới)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          OnlyPVSell (Chỉ bán điện PV)
                        </label>
                        <select
                          value={advConfig.OnlyPVSell}
                          onChange={e => handleAdvChange('OnlyPVSell', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Tắt</option>
                          <option value="1">1: Bật</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          machineNotAllowOutput (Khóa ngắt ngõ ra)
                        </label>
                        <select
                          value={advConfig.machineNotAllowOutput}
                          onChange={e => handleAdvChange('machineNotAllowOutput', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Bình thường</option>
                          <option value="1">1: Khóa ngắt đầu ra</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 2: Đo Đếm & Bám Tải */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group2')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-100">2. Đo Đếm & Bám Tải (CT & Zero-Export Settings)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group2 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group2 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          CT_MeterSetting (Cảm biến đo)
                        </label>
                        <select
                          value={advConfig.CT_MeterSetting}
                          onChange={e => handleAdvChange('CT_MeterSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Kẹp dòng CT</option>
                          <option value="2">2: Đồng hồ Meter RS485</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          CTRatio (Tỷ lệ biến dòng CT)
                        </label>
                        <input
                          type="number"
                          value={advConfig.CTRatio}
                          onChange={e => handleAdvChange('CTRatio', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          ZeroToGrid (Công suất bù Zero Watt)
                        </label>
                        <input
                          type="number"
                          value={advConfig.ZeroToGrid}
                          onChange={e => handleAdvChange('ZeroToGrid', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                          placeholder="0 W"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          FeedPower (Giới hạn công suất phát Watt)
                        </label>
                        <input
                          type="number"
                          value={advConfig.FeedPower}
                          onChange={e => handleAdvChange('FeedPower', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                          placeholder="0 W"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 3: Cấu Hình Pin & BMS Lithium */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group3')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-100">3. Cấu Hình Pin & BMS Lithium (Battery Protocol)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group3 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group3 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          batteryTypeSettings (Loại pin)
                        </label>
                        <select
                          value={advConfig.batteryTypeSettings}
                          onChange={e => handleAdvChange('batteryTypeSettings', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="3">3: Lithium (Giao tiếp BMS)</option>
                          <option value="2">2: USE (User-defined Tự định nghĩa)</option>
                          <option value="0">0: AGM (Kín khí)</option>
                          <option value="1">1: FLD (Axit ngập)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          LiProtocol (Giao thức Lithium)
                        </label>
                        <select
                          value={advConfig.LiProtocol}
                          onChange={e => handleAdvChange('LiProtocol', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white font-mono"
                        >
                          <option value="1">1: CANBUS (CANBUS Lithium)</option>
                          <option value="0">0: pylon485 (Pylontech)</option>
                          <option value="2">2: Deye / Growatt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          LiActive (Kích hoạt Lithium)
                        </label>
                        <select
                          value={advConfig.LiActive}
                          onChange={e => handleAdvChange('LiActive', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          BMSAddress (Địa chỉ cổng BMS)
                        </label>
                        <input
                          type="number"
                          value={advConfig.BMSAddress}
                          onChange={e => handleAdvChange('BMSAddress', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          BMSError (Xử lý khi lỗi BMS)
                        </label>
                        <select
                          value={advConfig.BMSError}
                          onChange={e => handleAdvChange('BMSError', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Cảnh báo</option>
                          <option value="1">1: Ngắt sạc / xả</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          TOUEnable (Cài đặt theo khung giờ)
                        </label>
                        <select
                          value={advConfig.TOUEnable}
                          onChange={e => handleAdvChange('TOUEnable', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Tắt</option>
                          <option value="1">1: Bật</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 4: Quản Lý Dòng & Ngưỡng Dung Lượng Pin */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group4')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-100">4. Quản Lý Dòng & Ngưỡng Dung Lượng (Current & SOC)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group4 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group4 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          maxTotalChargeCurrentSetting (Dòng sạc tối đa A)
                        </label>
                        <input
                          type="number"
                          value={advConfig.maxTotalChargeCurrentSetting}
                          onChange={e => handleAdvChange('maxTotalChargeCurrentSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-amber-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          maxUtilityChargeCurrentSetting (Dòng sạc lưới A)
                        </label>
                        <input
                          type="number"
                          value={advConfig.maxUtilityChargeCurrentSetting}
                          onChange={e => handleAdvChange('maxUtilityChargeCurrentSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-amber-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          MaximumBatteryDischargeCurrent (Dòng xả tối đa A)
                        </label>
                        <input
                          type="number"
                          value={advConfig.MaximumBatteryDischargeCurrent}
                          onChange={e => handleAdvChange('MaximumBatteryDischargeCurrent', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-cyan-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          BatteryDischargeCurrentInGrid (Dòng xả khi có lưới A)
                        </label>
                        <input
                          type="number"
                          value={advConfig.BatteryDischargeCurrentInGrid}
                          onChange={e => handleAdvChange('BatteryDischargeCurrentInGrid', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-cyan-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          StopDischargeSOC (Ngưỡng ngắt xả %)
                        </label>
                        <input
                          type="number"
                          value={advConfig.StopDischargeSOC}
                          onChange={e => handleAdvChange('StopDischargeSOC', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          UnderSOC (Ngưỡng cảnh báo pin yếu %)
                        </label>
                        <input
                          type="number"
                          value={advConfig.UnderSOC}
                          onChange={e => handleAdvChange('UnderSOC', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          RedischargeSOC (Ngưỡng phục hồi xả %)
                        </label>
                        <input
                          type="number"
                          value={advConfig.RedischargeSOC}
                          onChange={e => handleAdvChange('RedischargeSOC', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          MaxChargeSOC (Ngưỡng sạc đầy tối đa %)
                        </label>
                        <input
                          type="number"
                          value={advConfig.MaxChargeSOC}
                          onChange={e => handleAdvChange('MaxChargeSOC', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 5: Cài Đặt Điện Áp Sạc/Xả Theo Volt */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group5')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-slate-100">5. Điện Áp Sạc/Xả Theo Volt (Voltage Levels & Equalization)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group5 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group5 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          bulkChargingVoltageSetting (Điện áp sạc hấp thụ V)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={advConfig.bulkChargingVoltageSetting}
                          onChange={e => handleAdvChange('bulkChargingVoltageSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          flotingChargingVoltageSetting (Điện áp sạc thả nổi V)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={advConfig.flotingChargingVoltageSetting}
                          onChange={e => handleAdvChange('flotingChargingVoltageSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          LowBatteryCutOffVoltageSetting (Điện áp cắt pin yếu V)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={advConfig.LowBatteryCutOffVoltageSetting}
                          onChange={e => handleAdvChange('LowBatteryCutOffVoltageSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          comebackBatteryModeVolSBUPriority (V phục hồi Pin)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={advConfig.comebackBatteryModeVolSBUPriority}
                          onChange={e => handleAdvChange('comebackBatteryModeVolSBUPriority', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          batteryEqualizationVoltageSetting (Điện áp cân bằng V)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={advConfig.batteryEqualizationVoltageSetting}
                          onChange={e => handleAdvChange('batteryEqualizationVoltageSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          batteryEqualizationIntervalSetting (Chu kỳ cân bằng ngày)
                        </label>
                        <input
                          type="number"
                          value={advConfig.batteryEqualizationIntervalSetting}
                          onChange={e => handleAdvChange('batteryEqualizationIntervalSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 6: Lưới Điện AC & Tiêu Chuẩn Hòa Lưới */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group6')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-100">6. Lưới Điện AC & Tiêu Chuẩn (Grid & Output Standards)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group6 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group6 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          acInputRangeSetting (Dải điện lưới đầu vào)
                        </label>
                        <select
                          value={advConfig.acInputRangeSetting}
                          onChange={e => handleAdvChange('acInputRangeSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: UPS (170V - 280V)</option>
                          <option value="0">0: Appliance (90V - 280V)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          outputVoltageSettings (Điện áp đầu ra)
                        </label>
                        <select
                          value={advConfig.outputVoltageSettings}
                          onChange={e => handleAdvChange('outputVoltageSettings', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="230">230 V (Chuẩn Việt Nam)</option>
                          <option value="220">220 V</option>
                          <option value="240">240 V</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          outputFrequencySetting (Tần số đầu ra)
                        </label>
                        <select
                          value={advConfig.outputFrequencySetting}
                          onChange={e => handleAdvChange('outputFrequencySetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">50 Hz</option>
                          <option value="1">60 Hz</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          GFCICheck (Kiểm tra rò điện đất GFCI)
                        </label>
                        <select
                          value={advConfig.GFCICheck}
                          onChange={e => handleAdvChange('GFCICheck', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NHÓM 7: Nguồn Dự Phòng EPS & Bảo Vệ Tự Động */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('group7')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-slate-100">7. Nguồn Dự Phòng EPS & Bảo Vệ Tự Động (EPS & Protections)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.group7 ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.group7 && (
                  <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-[#0a0f1d]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          DualOutputSwitch (Công tắc ngõ ra phụ SmartLoad)
                        </label>
                        <select
                          value={advConfig.DualOutputSwitch}
                          onChange={e => handleAdvChange('DualOutputSwitch', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="0">0: Tắt</option>
                          <option value="1">1: Bật</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          epsOnSOC (Ngưỡng SOC bật lại EPS %)
                        </label>
                        <input
                          type="number"
                          value={advConfig.epsOnSOC}
                          onChange={e => handleAdvChange('epsOnSOC', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          overloadAutoRestartStatusSetting (Tự khởi động khi quá tải)
                        </label>
                        <select
                          value={advConfig.overloadAutoRestartStatusSetting}
                          onChange={e => handleAdvChange('overloadAutoRestartStatusSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          overTemperatureAutoRestartStatusSetting (Tự khởi động quá nhiệt)
                        </label>
                        <select
                          value={advConfig.overTemperatureAutoRestartStatusSetting}
                          onChange={e => handleAdvChange('overTemperatureAutoRestartStatusSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          transferToBypassOverloadStatusSetting (Chuyển Bypass khi quá tải)
                        </label>
                        <select
                          value={advConfig.transferToBypassOverloadStatusSetting}
                          onChange={e => handleAdvChange('transferToBypassOverloadStatusSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          ledPatternLightSetting (Đèn LED trang trí)
                        </label>
                        <select
                          value={advConfig.ledPatternLightSetting}
                          onChange={e => handleAdvChange('ledPatternLightSetting', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 text-xs font-medium rounded-lg p-2 text-white"
                        >
                          <option value="1">1: Bật RGB</option>
                          <option value="0">0: Tắt</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer Cố Định Ghim Đáy Tuyệt Đối - Không bao giờ bị khuyết hoặc che khuất */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#0d1424] border-t border-slate-800 flex space-x-3 z-30 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-750 text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="remoteConfigForm"
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl text-slate-950 text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 shadow-amber-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 shadow-cyan-500/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang ghi cấu hình...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{activeTab === 'quick' ? 'Áp Dụng Cấu Hình Nhanh' : 'Áp Dụng Cấu Hình Nâng Cao'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
