import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

// Danh sách các từ khóa thiết bị rác (điện thoại, loa, tai nghe, tivi, v.v.)
const BLACKLIST_KEYWORDS = [
  'airpod', 'airpods', 'earphone', 'headphone', 'headset', 'buds', 'galaxy buds',
  'speaker', 'loa', 'tivi', 'tv', 'macbook', 'laptop', 'desktop', 'pc',
  'watch', 'band', 'fitbit', 'mi band', 'soundbar', 'jbl', 'sony',
  'iphone', 'ipad', 'galaxy', 'redmi', 'oppo', 'vivo', 'realme',
  'printer', 'mouse', 'keyboard', 'remote', 'audio', 'handsfree'
];

// Danh sách tiền tố & từ khóa nhận diện Biến Tần Inverter, Datalogger DTU & Pin Lithium BMS
const INVERTER_PATTERNS = [
  'dtu', 'inv', 'inverter', 'zeno', 'sungo', 'growatt', 'deye', 'luxpower',
  'solis', 'huawei', 'sofar', 'sungrow', 'bms', 'bat', 'wifi_', 'ap_',
  'esp32', 'ble_', 'sp-', 'hy-', 'ba-', 'ssl-', 'bifu', 'fronus'
];

/**
 * Kiểm tra xem thiết bị quét được có phải là Inverter / DTU / Solar không
 */
export function classifyBleDevice(name = '', deviceId = '') {
  const cleanName = (name || '').trim().toLowerCase();
  const cleanId = (deviceId || '').trim().toLowerCase();
  const fullName = `${cleanName} ${cleanId}`;

  // Kiểm tra blacklist thiết bị rác (tai nghe, loa, điện thoại, tivi)
  const isBlacklisted = BLACKLIST_KEYWORDS.some(kw => fullName.includes(kw));

  // Kiểm tra nhận diện Solar Inverter / Datalogger
  const isSolarMatched = INVERTER_PATTERNS.some(p => fullName.includes(p)) || /\d{8,20}/.test(cleanName);

  // Phân loại loại thiết bị
  let deviceType = '⚡ Biến Tần Inverter Solar';
  let deviceCategory = 'inverter';
  let badgeColor = 'emerald';

  if (fullName.includes('bms') || fullName.includes('bat') || fullName.includes('pin') || fullName.includes('lithium')) {
    deviceType = '🔋 Pin Lưu Trữ Lithium BMS';
    deviceCategory = 'battery';
    badgeColor = 'amber';
  } else if (fullName.includes('dtu') || fullName.includes('wifi') || fullName.includes('ap_') || fullName.includes('logger') || fullName.includes('esp32')) {
    deviceType = '📶 Datalogger DTU Wi-Fi';
    deviceCategory = 'dtu';
    badgeColor = 'cyan';
  } else if (fullName.includes('hy') || fullName.includes('hybrid') || fullName.includes('zeno') || fullName.includes('sungo') || fullName.includes('inv')) {
    deviceType = '⚡ Biến Tần Inverter Hybrid';
    deviceCategory = 'inverter';
    badgeColor = 'emerald';
  }

  // Tự động bóc tách Mã DTU / Serial Number từ tên hoặc ID
  let extractedDtu = '';
  const dtuMatch = name.match(/\d{10,20}/) || deviceId.match(/\d{10,20}/) || name.match(/\d{8,20}/);
  if (dtuMatch) {
    extractedDtu = dtuMatch[0];
  } else if (name.replace(/[^A-Za-z0-9]/g, '').length >= 8) {
    extractedDtu = name.replace(/[^A-Za-z0-9]/g, '');
  }

  return {
    isInverter: isSolarMatched && !isBlacklisted,
    isBlacklisted,
    deviceType,
    deviceCategory,
    badgeColor,
    extractedDtu,
    displayName: name || (extractedDtu ? `Inverter-DTU [${extractedDtu.slice(-6)}]` : `BLE Device ${deviceId.slice(-6)}`)
  };
}

/**
 * Quản lý Scan Bluetooth Native cho App
 */
export const bleService = {
  isNative: () => typeof window !== 'undefined' && Capacitor.isNativePlatform(),

  /**
   * Khởi động quét Bluetooth trên Native App hoặc Web
   */
  startScan: async ({ onDeviceDiscovered, onError, onScanComplete }) => {
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    if (isNative) {
      try {
        await BleClient.initialize();
        const enabled = await BleClient.isEnabled();
        if (!enabled) {
          try {
            await BleClient.requestEnable();
          } catch (e) {
            console.warn('[BLE] User declined enable bluetooth:', e.message);
          }
        }

        // Bắt đầu quét BLE Native
        await BleClient.requestLEScan(
          {
            allowDuplicates: false
          },
          (result) => {
            const rawName = result.device?.name || result.localName || '';
            const deviceId = result.device?.deviceId || '';
            const rssi = result.rssi ?? -70;

            const classification = classifyBleDevice(rawName, deviceId);

            if (onDeviceDiscovered) {
              onDeviceDiscovered({
                id: deviceId,
                name: rawName,
                rssi,
                rawResult: result,
                ...classification
              });
            }
          }
        );

        // Tự động dừng sau 15 giây quét
        const scanTimer = setTimeout(async () => {
          try {
            await BleClient.stopLEScan();
            if (onScanComplete) onScanComplete();
          } catch (e) {}
        }, 15000);

        return {
          success: true,
          mode: 'native',
          stop: async () => {
            clearTimeout(scanTimer);
            try {
              await BleClient.stopLEScan();
              if (onScanComplete) onScanComplete();
            } catch (e) {}
          }
        };
      } catch (err) {
        console.error('[BLE Native Error]:', err);
        const errText = err.message || 'Lỗi khởi động Bluetooth trên điện thoại';
        if (onError) onError(errText);
        return { success: false, error: errText };
      }
    } else {
      // Fallback Web Bluetooth API
      if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
        const errorMsg = 'Trình duyệt Web chưa hỗ trợ Web Bluetooth. Vui lòng mở bằng Google Chrome trên máy tính hoặc sử dụng App Zeno Solar trên điện thoại.';
        if (onError) onError(errorMsg);
        return { success: false, error: errorMsg };
      }

      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fed5-0000-1000-8000-00805f9b34fb']
        });

        const classification = classifyBleDevice(device.name, device.id);
        const discovered = {
          id: device.id,
          name: device.name || 'Inverter Datalogger BLE',
          rssi: -60,
          ...classification
        };

        if (onDeviceDiscovered) {
          onDeviceDiscovered(discovered);
        }
        if (onScanComplete) onScanComplete();

        return { success: true, mode: 'web', device: discovered };
      } catch (err) {
        if (err.name !== 'NotFoundError' && onError) {
          onError(`Lỗi Bluetooth: ${err.message}`);
        }
        if (onScanComplete) onScanComplete();
        return { success: false, error: err.message };
      }
    }
  },

  /**
   * Dừng quét Bluetooth
   */
  stopScan: async () => {
    try {
      if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
        await BleClient.stopLEScan();
      }
    } catch (e) {}
  }
};
