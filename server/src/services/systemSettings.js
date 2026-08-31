const fs = require('fs');
const path = require('path');

class SystemSettingsService {
  constructor() {
    this.storageFile = path.join(__dirname, '../../data/system_settings.json');
    this.stationStorageFile = path.join(__dirname, '../../data/station_settings.json');
    this.settings = this.loadSettings();
    this.stationSettings = this.loadStationSettings();
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[SystemSettings] Không thể đọc system_settings.json:', e.message);
    }

    return {
      default: {
        electricityPrice: 2800,
        tariffType: 'FLAT',
        peakPrice: 3450,
        normalPrice: 1850,
        offPeakPrice: 1250,
        feedInTariff: 1000,
        currency: 'VND',

        installedCapacityKw: 12.0,
        pv1CapacityKw: 6.0,
        pv2CapacityKw: 6.0,
        solarPanelType: 'Mono Perc Tier 1 (550W)',
        panelEfficiency: 98,

        batteryType: 'LiFePO4',
        batteryCapacityKwh: 10.24,
        batteryAh: 200,
        batteryVoltageNominal: 51.2,
        minSoc: 20,
        maxSoc: 100,
        updatedAt: new Date().toISOString()
      },
      users: {}
    };
  }

  loadStationSettings() {
    try {
      if (fs.existsSync(this.stationStorageFile)) {
        const raw = fs.readFileSync(this.stationStorageFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[SystemSettings] Không thể đọc station_settings.json:', e.message);
    }

    // Default station specific settings for demo plants
    return {
      "454586755050340353": {
        stationId: "454586755050340353",
        stationName: "sungoPlant",
        electricityPrice: 2800,
        tariffType: "FLAT",
        peakPrice: 3450,
        normalPrice: 1850,
        offPeakPrice: 1250,
        feedInTariff: 1000,
        installedCapacityKw: 12.0,
        pv1CapacityKw: 6.0,
        pv2CapacityKw: 6.0,
        solarPanelType: "Mono Perc Tier 1 (550W)",
        batteryType: "LiFePO4",
        batteryCapacityKwh: 10.24,
        batteryAh: 200,
        batteryVoltageNominal: 51.2,
        minSoc: 20,
        maxSoc: 100
      },
      "ST-001": {
        stationId: "ST-001",
        stationName: "sungoPlant",
        electricityPrice: 2800,
        tariffType: "FLAT",
        peakPrice: 3450,
        normalPrice: 1850,
        offPeakPrice: 1250,
        feedInTariff: 1000,
        installedCapacityKw: 12.0,
        pv1CapacityKw: 6.0,
        pv2CapacityKw: 6.0,
        solarPanelType: "Mono Perc Tier 1 (550W)",
        batteryType: "LiFePO4",
        batteryCapacityKwh: 10.24,
        batteryAh: 200,
        batteryVoltageNominal: 51.2,
        minSoc: 20,
        maxSoc: 100
      },
      "ST-002": {
        stationId: "ST-002",
        stationName: "Trạm Nhà phố Phú Mỹ Hưng (Trần Thị Bích)",
        electricityPrice: 3200,
        tariffType: "FLAT",
        peakPrice: 3600,
        normalPrice: 2000,
        offPeakPrice: 1300,
        feedInTariff: 1000,
        installedCapacityKw: 10.0,
        pv1CapacityKw: 5.0,
        pv2CapacityKw: 5.0,
        solarPanelType: "Mono Perc Tier 1 (550W)",
        batteryType: "LiFePO4",
        batteryCapacityKwh: 14.34,
        batteryAh: 280,
        batteryVoltageNominal: 51.2,
        minSoc: 15,
        maxSoc: 100
      },
      "ST-003": {
        stationId: "ST-003",
        stationName: "Trạm Xưởng Cơ Khí Thuận An (Lê Văn Hoàng)",
        electricityPrice: 3450,
        tariffType: "TOU",
        peakPrice: 3850,
        normalPrice: 2100,
        offPeakPrice: 1350,
        feedInTariff: 1000,
        installedCapacityKw: 30.0,
        pv1CapacityKw: 15.0,
        pv2CapacityKw: 15.0,
        solarPanelType: "Mono Perc Tier 1 (600W)",
        batteryType: "LiFePO4",
        batteryCapacityKwh: 30.72,
        batteryAh: 600,
        batteryVoltageNominal: 51.2,
        minSoc: 20,
        maxSoc: 100
      }
    };
  }

  saveStationSettings() {
    try {
      const dir = path.dirname(this.stationStorageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stationStorageFile, JSON.stringify(this.stationSettings, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SystemSettings] Lỗi ghi station_settings.json:', e.message);
    }
  }

  getStationSettings(stationId = 'ST-001') {
    const sId = String(stationId || 'ST-001');
    const existing = this.stationSettings[sId];
    if (existing) {
      return existing;
    }
    // Fallback default
    return {
      stationId: sId,
      ...this.settings.default
    };
  }

  updateStationSettings(stationId, newConfig = {}) {
    const sId = String(stationId || 'ST-001');
    const current = this.getStationSettings(sId);
    this.stationSettings[sId] = {
      ...current,
      ...newConfig,
      stationId: sId,
      updatedAt: new Date().toISOString()
    };
    this.saveStationSettings();
    return this.stationSettings[sId];
  }

  saveSettings() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SystemSettings] Lỗi ghi system_settings.json:', e.message);
    }
  }

  getSettings(account = 'default') {
    const userAcc = String(account || 'default').toLowerCase();
    const userCustom = this.settings.users[userAcc] || {};
    return {
      ...this.settings.default,
      ...userCustom
    };
  }

  updateSettings(account = 'default', newConfig = {}) {
    const userAcc = String(account || 'default').toLowerCase();
    if (!this.settings.users[userAcc]) {
      this.settings.users[userAcc] = {};
    }

    this.settings.users[userAcc] = {
      ...this.getSettings(userAcc),
      ...newConfig,
      updatedAt: new Date().toISOString()
    };

    this.saveSettings();
    return this.settings.users[userAcc];
  }
}

module.exports = new SystemSettingsService();
