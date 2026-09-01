const fs = require('fs');
const path = require('path');

class DeviceOwnershipService {
  constructor() {
    this.storageFile = path.join(__dirname, '../../data/device_ownership.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.deletedStations) parsed.deletedStations = [];
        if (!parsed.deletedDevices) parsed.deletedDevices = [];
        if (!parsed.deletedUsers) parsed.deletedUsers = [];
        if (!parsed.dealerDeletedDevices) parsed.dealerDeletedDevices = {};
        return parsed;
      }
    } catch (e) {
      console.warn('[DeviceOwnership] Không thể đọc device_ownership.json:', e.message);
    }
    return {
      deletedStations: [],
      deletedDevices: [],
      deletedUsers: [],
      dealerDeletedDevices: {},
      users: {
        'sungo.vn': { userType: 1, roleName: '👑 Tổng Phân Phối (Distributor)', userName: 'SUNGO SOLAR VIỆT NAM (Master)', company: 'SUNGO Clean Energy Corp', cloudPassword: 'sungo@100%', zenoPassword: 'sungo123' },
        'sungo123': { userType: 3, roleName: '🏠 Người Tiêu Dùng Cuối (End-User)', userName: 'Khách Hàng sungo123', company: 'Hộ Gia Đình', cloudPassword: 'sungo123', zenoPassword: 'sungo123' },
        'zeno_admin': { userType: 1, roleName: '👑 Tổng Phân Phối (Distributor)', userName: 'Zeno System Admin', company: 'Zeno Clean Energy Corp', cloudPassword: 'admin123', zenoPassword: 'sungo123' },
        'newtech.sg': { userType: 2, roleName: '🏢 Đại Lý (Dealer)', userName: 'Đại Lý Newtech Solar (Nguyễn Hồng Sơn)', company: 'Newtech Solar Sài Gòn', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'tuan_solar': { userType: 2, roleName: '🏢 Đại Lý (Dealer)', userName: 'Phạm Minh Tuấn (Kỹ thuật)', company: 'Tuấn Solar Miền Nam', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'thodien_mientay': { userType: 2, roleName: '🏢 Đại Lý (Dealer)', userName: 'Đại Lý Trần Văn Hưng (Miền Tây)', company: 'Thợ Điện Miền Tây', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'dungkiep': { userType: 3, roleName: '🏠 Người Tiêu Dùng Cuối (End-User)', userName: 'Chủ Hộ zenoPlant (Dũng Kiệp)', company: 'Gia đình', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'vothehien1006': { userType: 3, roleName: '🏠 Người Tiêu Dùng Cuối (End-User)', userName: 'Khách Hàng Võ Thế Hiển', company: 'Gia đình', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'chuhanatest': { userType: 3, roleName: '🏠 Người Tiêu Dùng Cuối (End-User)', userName: 'Chủ Nhà Dũng Kiệp (zenoPlant)', company: 'Gia đình', cloudPassword: '123456', zenoPassword: 'sungo123' },
        'zeno_home_9200': { userType: 3, roleName: '🏠 Người Tiêu Dùng Cuối (End-User)', userName: 'Anh Nam (Chủ Nhà Thảo Điền)', company: 'Villa Thảo Điền', cloudPassword: '123456', zenoPassword: 'sungo123' }
      },
      devices: {
        '465132145264787456': {
          deviceId: '465132145264787456',
          serialNumber: '3528214760-1',
          dtuCode: '35282147608648059097',
          stationName: 'canh',
          distributor: 'sungo.vn',
          installer: 'tuan_solar',
          customer: 'sungo123',
          isConfigLocked: true,
          status: 'ONLINE'
        },
        '498807992030822400': {
          deviceId: '498807992030822400',
          serialNumber: '5037108978-1',
          dtuCode: '50371089784075173825',
          stationName: 'zenoPlant',
          distributor: 'sungo.vn',
          installer: 'newtech.sg',
          customer: 'dungkiep',
          isConfigLocked: true,
          status: 'ONLINE'
        },
        '495450468187602944': {
          deviceId: '495450468187602944',
          serialNumber: '4163930009-1',
          dtuCode: '41639300099725757805',
          stationName: 'Hien_newtech.sgPlant',
          distributor: 'sungo.vn',
          installer: 'newtech.sg',
          customer: 'vothehien1006',
          isConfigLocked: true,
          status: 'ONLINE'
        },
        '178817432746814411': {
          deviceId: '178817432746814411',
          serialNumber: '6074969919-1',
          dtuCode: '60749699196447581049',
          stationName: 'phúc trung',
          distributor: 'sungo.vn',
          installer: 'tuan_solar',
          customer: '',
          isConfigLocked: true,
          status: 'ONLINE'
        }
      }
    };
  }

  saveData() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[DeviceOwnership] Lỗi ghi device_ownership.json:', e.message);
    }
  }

  // Kiểm tra blacklist xóa
  isStationDeleted(stationIdOrName) {
    if (!stationIdOrName) return false;
    const target = String(stationIdOrName).toLowerCase().trim();
    if (!this.data.deletedStations) return false;
    return this.data.deletedStations.some(s => String(s).toLowerCase().trim() === target);
  }

  isDeviceDeleted(deviceIdOrSn, dealerAccount = null) {
    if (!deviceIdOrSn) return false;
    const target = String(deviceIdOrSn).toLowerCase().trim();
    
    // 1. Kiểm tra Global Deleted (Master xóa)
    if (this.data.deletedDevices && this.data.deletedDevices.some(d => String(d).toLowerCase().trim() === target)) {
      return true;
    }

    // 2. Kiểm tra Dealer Deleted (Đại lý xóa quyền phụ trách)
    if (dealerAccount && this.data.dealerDeletedDevices && this.data.dealerDeletedDevices[dealerAccount.toLowerCase()]) {
      const dealerList = this.data.dealerDeletedDevices[dealerAccount.toLowerCase()];
      if (Array.isArray(dealerList) && dealerList.some(d => String(d).toLowerCase().trim() === target)) {
        return true;
      }
    }

    return false;
  }

  isUserDeleted(accountOrId) {
    if (!accountOrId) return false;
    const target = String(accountOrId).toLowerCase().trim();
    if (!this.data.deletedUsers) return false;
    return this.data.deletedUsers.some(u => String(u).toLowerCase().trim() === target);
  }

  getUserRole(account) {
    const acc = String(account || '').toLowerCase().trim();

    // 1. CẤP 1: 👑 TỔNG PHÂN PHỐI / MASTER ADMIN (sungo.vn, admin, zeno_admin)
    if (
      acc === 'sungo.vn' || 
      acc === 'admin@sungo.vn' || 
      acc === 'zeno_admin' || 
      acc === 'admin'
    ) {
      return {
        userType: 1,
        roleName: '👑 Tổng Phân Phối (Distributor)',
        userName: 'SUNGO SOLAR VIỆT NAM (Master)',
        company: 'SUNGO Clean Energy Corp',
        canConfig: true,
        canAssign: true,
        canViewAll: true
      };
    }

    // 2. Tra cứu trong bảng users
    if (this.data.users && this.data.users[acc]) {
      const u = this.data.users[acc];
      const cleanType = (u.userType === 1) ? 1 : (u.userType === 2 ? 2 : 3);
      const cleanRoleName = cleanType === 1 ? '👑 Tổng Phân Phối (Distributor)' : (cleanType === 2 ? '🏢 Đại Lý (Dealer)' : '🏠 Người Tiêu Dùng Cuối (End-User)');
      return {
        userType: cleanType,
        roleName: cleanRoleName,
        userName: u.userName || acc,
        company: u.company || (cleanType === 2 ? 'Đại Lý Phân Phối' : 'Hộ Gia Đình'),
        canConfig: cleanType <= 2,
        canAssign: cleanType <= 2,
        canViewAll: cleanType === 1
      };
    }

    // 3. CẤP 2: 🏢 ĐẠI LÝ (DEALER)
    if (
      acc.includes('dealer') || 
      acc.includes('daily') || 
      acc.includes('tho') || 
      acc.includes('kt_') || 
      acc.includes('installer') || 
      acc.includes('newtech') ||
      acc.includes('solar')
    ) {
      return {
        userType: 2,
        roleName: '🏢 Đại Lý (Dealer)',
        userName: acc,
        company: 'Đại Lý Phân Phối & Lắp Đặt',
        canConfig: true,
        canAssign: true,
        canViewAll: false
      };
    }

    // 4. CẤP 3: 🏠 NGƯỜI TIÊU DÙNG CUỐI (END-USER)
    return {
      userType: 3,
      roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
      userName: acc,
      company: 'Hộ Gia Đình',
      canConfig: false,
      canAssign: false,
      canViewAll: false
    };
  }

  canUserConfig(userType, account, deviceId) {
    if (userType === 1) return true; // Tổng phân phối full quyền
    if (userType === 2) return true; // Đại lý có quyền cài đặt thông số biến tần cho trạm phụ trách / được chia sẻ
    // userType === 3 (Người tiêu dùng cuối) -> Tuyệt đối không được can thiệp cấu hình thô Inverter
    return false;
  }

  claimDevice({ dtuCode, serialNumber, stationName, distributor = 'sungo.vn', installer = '', customer = '', realDeviceId = null, realStationId = null, isOnline = false }) {
    this.data = this.loadData();
    const cleanDtu = String(dtuCode || serialNumber || '').trim();
    const cleanSn = String(serialNumber || cleanDtu).trim();

    // Tìm xem thiết bị đã có trong danh sách chưa theo Mã DTU hoặc SN
    let existingKey = Object.keys(this.data.devices || {}).find(k => {
      const d = this.data.devices[k];
      return (d.dtuCode && d.dtuCode === cleanDtu) || (d.serialNumber && d.serialNumber === cleanSn);
    });

    const baseNum = Date.now().toString() + Math.floor(10000 + Math.random() * 90000).toString();
    const deviceId = realDeviceId ? String(realDeviceId) : (existingKey || baseNum.substring(0, 18));
    const stationId = realStationId ? String(realStationId) : (this.data.devices[deviceId]?.stationId || (BigInt(deviceId) - 256000n).toString());

    this.data.devices[deviceId] = {
      deviceId,
      dtuCode: cleanDtu,
      serialNumber: cleanSn,
      stationId,
      stationName: stationName || `Trạm DTU ${cleanDtu.slice(-6)}`,
      distributor: 'sungo.vn',
      installer: installer || '',
      customer: customer || '',
      isConfigLocked: false,
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      claimedAt: new Date().toISOString()
    };
    this.saveData();
    return this.data.devices[deviceId];
  }

  deleteStation(stationIdOrName) {
    if (!stationIdOrName) return false;
    const target = String(stationIdOrName).toLowerCase().trim();
    let deletedCount = 0;
    
    // Xóa tất cả các thiết bị thuộc trạm này
    Object.keys(this.data.devices).forEach(devId => {
      const dev = this.data.devices[devId];
      const matchId = String(dev.stationId || '').toLowerCase() === target;
      const matchDevId = String(dev.deviceId || '').toLowerCase() === target;
      const matchName = String(dev.stationName || '').toLowerCase() === target;
      if (matchId || matchDevId || matchName) {
        delete this.data.devices[devId];
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      this.saveData();
      return true;
    }
    return false;
  }

  deleteDevice(deviceIdOrSn) {
    if (!deviceIdOrSn) return false;
    const target = String(deviceIdOrSn).toLowerCase().trim();
    let foundKey = null;

    Object.keys(this.data.devices).forEach(devId => {
      const dev = this.data.devices[devId];
      if (
        String(dev.deviceId).toLowerCase() === target ||
        String(dev.serialNumber).toLowerCase() === target ||
        String(dev.dtuCode).toLowerCase() === target
      ) {
        foundKey = devId;
      }
    });

    if (foundKey) {
      delete this.data.devices[foundKey];
      this.saveData();
      return true;
    }
    return false;
  }

  assignDevice({ deviceId, installer, customer, isConfigLocked = true }) {
    if (this.data.devices[deviceId]) {
      if (installer !== undefined) this.data.devices[deviceId].installer = installer;
      if (customer !== undefined) this.data.devices[deviceId].customer = customer;
      if (isConfigLocked !== undefined) this.data.devices[deviceId].isConfigLocked = isConfigLocked;
      this.saveData();
      return this.data.devices[deviceId];
    }
    return null;
  }

  registerUser({ account, password, cloudPassword, zenoPassword, userType = 3, roleName, userName, company, cellphone, email, serialNumber, technicianCode }) {
    const acc = String(account).toLowerCase().trim();
    const type = parseInt(userType, 10) || 3;
    let computedRoleName = roleName;
    if (!computedRoleName) {
      if (type === 1) computedRoleName = 'Tổng Phân Phối (Distributor)';
      else if (type === 2) computedRoleName = 'Thợ Lắp Đặt / Đại Lý (Installer)';
      else computedRoleName = 'Chủ Nhà / Người Dùng Cuối (View-Only)';
    }

    const cPass = cloudPassword || password || '123456';
    const zPass = zenoPassword || password || 'sungo123';

    this.data.users[acc] = {
      userType: type,
      roleName: computedRoleName,
      userName: userName || account,
      company: company || (type === 1 ? 'Zeno Clean Energy Corp' : type === 2 ? 'Đội Kỹ Thuật Lắp Đặt' : 'Gia đình'),
      password: zPass,
      cloudPassword: cPass,
      zenoPassword: zPass,
      cellphone: cellphone || '',
      email: email || `${acc}@zenosolar.vn`,
      technicianCode: type === 2 ? (technicianCode ? String(technicianCode).trim().toUpperCase() : `KT_${acc.toUpperCase()}`) : (technicianCode ? String(technicianCode).trim().toUpperCase() : null),
      createdAt: new Date().toISOString()
    };

    // Nếu người dùng cung cấp Serial Number biến tần lúc đăng ký
    if (serialNumber && serialNumber.trim()) {
      const sn = serialNumber.trim();
      const snPrefix = sn.split('-')[0].toLowerCase();
      let existingDevKey = Object.keys(this.data.devices).find(k => {
        const d = this.data.devices[k];
        const dSn = String(d.serialNumber || '').toLowerCase();
        const dDtu = String(d.dtuCode || '').toLowerCase();
        const target = sn.toLowerCase();
        return dSn === target || 
               dDtu === target || 
               (snPrefix.length >= 6 && dSn.startsWith(snPrefix)) || 
               (snPrefix.length >= 6 && target.startsWith(dSn.split('-')[0])) ||
               (snPrefix.length >= 6 && dDtu.includes(snPrefix));
      });

      if (existingDevKey) {
        if (type === 3) {
          this.data.devices[existingDevKey].customer = acc;
        } else if (type === 2) {
          this.data.devices[existingDevKey].installer = acc;
        }
      } else {
        const newDevId = 'DEV-' + Date.now();
        this.data.devices[newDevId] = {
          deviceId: newDevId,
          serialNumber: sn,
          dtuCode: sn,
          stationName: `Trạm Năng Lượng ${userName || acc}`,
          distributor: 'sungo123',
          installer: type === 2 ? acc : 'tuan_solar',
          customer: type === 3 ? acc : '',
          isConfigLocked: true,
          status: 'ONLINE',
          claimedAt: new Date().toISOString()
        };
      }
    }

    this.saveData();
    return this.getUserRole(acc);
  }

  // Tự động thu nạp tài khoản khách hàng cũ từ Cloud Hãng và gán quyền quản lý cho tài khoản tổng sungo.vn
  ingestUserAndStationsFromCloud({ account, password, userName, email, cellphone, userType = 3, stations = [] }) {
    const acc = String(account).toLowerCase().trim();
    const type = parseInt(userType, 10) || 3;
    const computedRoleName = type === 1 ? 'Tổng Phân Phối (Distributor)' : (type === 2 ? 'Thợ Lắp Đặt / Đại Lý (Installer)' : 'Chủ Nhà / Người Dùng Cuối (View-Only)');

    if (!this.data.users[acc]) {
      this.data.users[acc] = {
        userType: type,
        roleName: computedRoleName,
        userName: userName || account,
        company: 'Hộ gia đình',
        password: password || 'sungo123',
        cloudPassword: password || '123456',
        zenoPassword: password || 'sungo123',
        cellphone: cellphone || '',
        email: email || `${acc}@sungo.vn`,
        createdAt: new Date().toISOString()
      };
    } else {
      if (userName) this.data.users[acc].userName = userName;
      if (email) this.data.users[acc].email = email;
      if (cellphone) this.data.users[acc].cellphone = cellphone;
      if (password) {
        this.data.users[acc].cloudPassword = password;
        if (!this.data.users[acc].zenoPassword) this.data.users[acc].zenoPassword = password;
      }
    }

    // Tự động thu nạp tất cả trạm và thiết bị của khách hàng gán về tài khoản Tổng sungo.vn
    if (stations && Array.isArray(stations)) {
      stations.forEach(st => {
        const sId = String(st.stationId || st.id || '');
        const sName = st.stationName || st.name || `Trạm ${userName || acc}`;
        if (st.devices && Array.isArray(st.devices) && st.devices.length > 0) {
          st.devices.forEach(dev => {
            const devId = String(dev.deviceId || dev.id || dev.serialNumber || `DEV-${sId}`);
            if (!this.data.devices[devId]) {
              this.data.devices[devId] = {
                deviceId: devId,
                serialNumber: dev.serialNumber || '',
                dtuCode: dev.dtuCode || dev.dtuDtuid || '',
                stationId: sId,
                stationName: sName,
                distributor: 'sungo.vn', // 👑 Gán toàn quyền quản lý cao nhất cho Tổng sungo.vn!
                installer: '',
                customer: acc,
                isConfigLocked: false,
                status: dev.isOnline !== false ? 'ONLINE' : 'OFFLINE',
                autoIngestedAt: new Date().toISOString()
              };
            } else {
              this.data.devices[devId].customer = acc;
              this.data.devices[devId].distributor = 'sungo.vn';
              if (dev.serialNumber) this.data.devices[devId].serialNumber = dev.serialNumber;
              if (dev.dtuCode) this.data.devices[devId].dtuCode = dev.dtuCode;
              if (sName) this.data.devices[devId].stationName = sName;
            }
          });
        } else if (sId) {
          // Trạm có trên hãng nhưng mảng devices chưa có: tạo thiết bị đại diện
          const devId = `DEV-${sId}`;
          if (!this.data.devices[devId]) {
            this.data.devices[devId] = {
              deviceId: devId,
              serialNumber: st.serialNumber || `SN-${sId}`,
              dtuCode: st.dtuCode || '',
              stationId: sId,
              stationName: sName,
              distributor: 'sungo.vn',
              installer: '',
              customer: acc,
              isConfigLocked: false,
              status: 'ONLINE',
              autoIngestedAt: new Date().toISOString()
            };
          } else {
            this.data.devices[devId].customer = acc;
            this.data.devices[devId].distributor = 'sungo.vn';
          }
        }
      });
    }

    this.saveData();
    return this.data.users[acc];
  }

  toggleLock(deviceId, isLocked) {
    if (this.data.devices[deviceId]) {
      this.data.devices[deviceId].isConfigLocked = isLocked;
      this.saveData();
      return true;
    }
    return false;
  }

  // ================= 👑 TÀI KHOẢN TỔNG THAY ĐỔI ĐẠI LÝ QUẢN LÝ (REASSIGN DEALER) =================
  getDealersList() {
    this.data = this.loadData();
    const dealers = [];
    if (this.data.users) {
      Object.keys(this.data.users).forEach(acc => {
        const u = this.data.users[acc];
        if (u.userType === 2 && acc !== 'sungo.vn') {
          dealers.push({
            account: acc,
            userName: u.userName || acc,
            company: u.company || 'Đại Lý Phân Phối & Lắp Đặt',
            email: u.email || `${acc}@sungo.vn`,
            cellphone: u.cellphone || '',
            technicianCode: u.technicianCode || u.dealerCode || `KT_${acc.toUpperCase()}`
          });
        }
      });
    }
    return dealers;
  }

  reassignStationDealer({ stationId, deviceId, newDealerAccount }) {
    this.data = this.loadData();
    const sId = String(stationId || '').trim();
    const dId = String(deviceId || '').trim();
    const targetDealer = String(newDealerAccount || '').trim().toLowerCase();

    let updatedDevicesCount = 0;
    const isRemoving = !targetDealer || targetDealer === 'none' || targetDealer === 'null' || targetDealer === '';

    // Kiểm tra nếu là gán đại lý mới thì đại lý đó phải tồn tại trong hệ thống (hoặc tự động tạo role đại lý)
    let dealerInfo = null;
    if (!isRemoving) {
      dealerInfo = this.getUserRole(targetDealer);
      if (dealerInfo.userType !== 2 && targetDealer !== 'sungo.vn') {
        // Tự động nâng cấp hoặc đăng ký role đại lý
        if (!this.data.users[targetDealer]) {
          this.data.users[targetDealer] = {
            userType: 2,
            roleName: '🏢 Đại Lý (Dealer)',
            userName: targetDealer,
            company: 'Đại Lý Phân Phối & Lắp Đặt',
            email: `${targetDealer}@sungo.vn`,
            createdAt: new Date().toISOString()
          };
        } else {
          this.data.users[targetDealer].userType = 2;
          this.data.users[targetDealer].roleName = '🏢 Đại Lý (Dealer)';
        }
      }
    }

    // Cập nhật installer cho các thiết bị thuộc trạm này hoặc device cụ thể
    Object.keys(this.data.devices || {}).forEach(key => {
      const dev = this.data.devices[key];
      const matchStation = sId && (String(dev.stationId) === sId || String(dev.deviceId) === sId || String(dev.stationName) === sId);
      const matchDevice = dId && (String(dev.deviceId) === dId || String(dev.serialNumber) === dId || String(dev.dtuCode) === dId);

      if (matchStation || matchDevice) {
        if (isRemoving) {
          dev.installer = '';
          dev.sharedInstallers = [];
        } else {
          dev.installer = targetDealer;
          if (!dev.sharedInstallers) dev.sharedInstallers = [];
          if (!dev.sharedInstallers.includes(targetDealer)) {
            dev.sharedInstallers.push(targetDealer);
          }
        }
        updatedDevicesCount++;
      }
    });

    // Cập nhật bảng shares
    if (!this.data.shares) this.data.shares = [];
    if (sId) {
      if (isRemoving) {
        this.data.shares = this.data.shares.filter(s => String(s.stationId) !== sId);
      } else {
        const existingIdx = this.data.shares.findIndex(s => String(s.stationId) === sId && s.dealerAccount.toLowerCase() === targetDealer);
        if (existingIdx >= 0) {
          this.data.shares[existingIdx].permissions = ['VIEW', 'CONFIG'];
          this.data.shares[existingIdx].updatedAt = new Date().toISOString();
        } else {
          this.data.shares.push({
            shareId: 'SH-ASSIGN-' + Date.now(),
            stationId: sId,
            dealerAccount: targetDealer,
            dealerName: this.data.users[targetDealer]?.userName || targetDealer,
            dealerEmail: this.data.users[targetDealer]?.email || '',
            dealerCompany: this.data.users[targetDealer]?.company || 'Đại lý kỹ thuật',
            permissions: ['VIEW', 'CONFIG'],
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    this.saveData();

    return {
      success: true,
      message: isRemoving
        ? `Đã gỡ đại lý quản lý khỏi trạm [${sId || dId}]. Trạm hiện do Tổng quản lý trực tiếp!`
        : `Đã chuyển quyền quản lý trạm [${sId || dId}] cho Đại Lý [@${targetDealer}] thành công!`,
      newDealer: isRemoving ? null : targetDealer,
      updatedDevicesCount
    };
  }

  // ================= 🔒 BẢO VỆ AN TOÀN KHI XÓA (SAFE DELETION) =================
  verifyAdminPassword(password) {
    if (!password) return false;
    const clean = String(password).trim();
    return clean === 'sungo123' || clean === 'sungo@100%' || clean === 'sungo1234' || clean === 'SolarPass123!';
  }

  deleteStationSafe({ stationId, adminPassword }) {
    if (!this.verifyAdminPassword(adminPassword)) {
      throw new Error('Mật khẩu quản trị viên [sungo123] không chính xác! Vui lòng nhập đúng mật khẩu xác nhận để xóa trạm an toàn.');
    }
    this.data = this.loadData();
    if (!this.data.deletedStations) this.data.deletedStations = [];
    
    const cleanId = String(stationId).trim();
    if (!this.data.deletedStations.includes(cleanId)) {
      this.data.deletedStations.push(cleanId);
    }

    // Xóa tất cả các thiết bị gắn với trạm này
    this.deleteStation(stationId);
    this.saveData();
    return { success: true, message: `Đã xóa vĩnh viễn trạm [${stationId}] khỏi hệ thống thành công!` };
  }

  deleteCustomerSafe({ customerId, account, adminPassword }) {
    if (!this.verifyAdminPassword(adminPassword)) {
      throw new Error('Mật khẩu quản trị viên [sungo123] không chính xác! Vui lòng nhập đúng mật khẩu xác nhận để xóa tài khoản an toàn.');
    }
    this.data = this.loadData();
    if (!this.data.deletedUsers) this.data.deletedUsers = [];

    const rawId = String(customerId || '').trim().toLowerCase();
    const rawAcc = String(account || '').trim().toLowerCase();

    // Tìm user trong this.data.users
    let deletedAcc = null;
    if (this.data.users) {
      for (const [acc, u] of Object.entries(this.data.users)) {
        const aLower = acc.toLowerCase();
        if (
          (rawAcc && aLower === rawAcc) || 
          (rawId && aLower === rawId) || 
          (rawId && String(u.userId) === rawId) || 
          (rawAcc && String(u.account || '').toLowerCase() === rawAcc) ||
          (rawId && String(u.account || '').toLowerCase() === rawId)
        ) {
          deletedAcc = acc;
          delete this.data.users[acc];
          if (!this.data.deletedUsers.includes(aLower)) {
            this.data.deletedUsers.push(aLower);
          }
          break;
        }
      }
    }

    if (rawAcc && !this.data.deletedUsers.includes(rawAcc)) {
      this.data.deletedUsers.push(rawAcc);
    }
    if (rawId && !this.data.deletedUsers.includes(rawId)) {
      this.data.deletedUsers.push(rawId);
    }

    const finalAcc = deletedAcc || rawAcc || rawId;

    // Gỡ liên kết customer / installer của các thiết bị thuộc tài khoản này
    if (finalAcc) {
      const targetAccLower = finalAcc.toLowerCase();
      Object.values(this.data.devices || {}).forEach(d => {
        if (d.customer && String(d.customer).toLowerCase() === targetAccLower) {
          d.customer = '';
        }
        if (d.installer && String(d.installer).toLowerCase() === targetAccLower) {
          d.installer = '';
        }
      });
    }

    this.saveData();
    return { success: true, deletedAccount: finalAcc };
  }

  deleteDeviceSafe({ deviceId, isMaster, dealerAccount, adminPassword, confirmSn }) {
    this.data = this.loadData();
    if (!this.data.deletedDevices) this.data.deletedDevices = [];
    if (!this.data.dealerDeletedDevices) this.data.dealerDeletedDevices = {};

    const target = String(deviceId).toLowerCase().trim();
    let foundDevId = null;
    let foundDev = null;

    Object.keys(this.data.devices || {}).forEach(key => {
      const d = this.data.devices[key];
      if (
        String(d.deviceId).toLowerCase() === target ||
        String(d.serialNumber).toLowerCase() === target ||
        String(d.dtuCode).toLowerCase() === target
      ) {
        foundDevId = key;
        foundDev = d;
      }
    });

    if (isMaster) {
      // Tài khoản Master: Bắt buộc nhập mật khẩu admin sungo123
      if (!this.verifyAdminPassword(adminPassword)) {
        throw new Error('Mật khẩu quản trị viên [sungo123] không chính xác! Vui lòng nhập đúng mật khẩu xác nhận để xóa thiết bị an toàn.');
      }

      const sn = foundDev?.serialNumber || deviceId;
      const dtu = foundDev?.dtuCode || '';
      if (!this.data.deletedDevices.includes(String(deviceId).trim())) this.data.deletedDevices.push(String(deviceId).trim());
      if (sn && !this.data.deletedDevices.includes(String(sn).trim())) this.data.deletedDevices.push(String(sn).trim());
      if (dtu && !this.data.deletedDevices.includes(String(dtu).trim())) this.data.deletedDevices.push(String(dtu).trim());

      if (foundDevId) {
        delete this.data.devices[foundDevId];
      }
      this.saveData();
      return { success: true, message: `Đã xóa vĩnh viễn thiết bị [${sn}] khỏi toàn bộ hệ thống thành công!` };
    } else {
      // Tài khoản Đại Lý (Dealer): Bắt buộc nhập đúng Mã Máy (Serial Number / SN)
      const inputSn = String(confirmSn || '').trim().toLowerCase();
      const realSn = String(foundDev?.serialNumber || deviceId || '').trim().toLowerCase();
      const realDtu = String(foundDev?.dtuCode || '').trim().toLowerCase();

      if (!inputSn) {
        throw new Error('Vui lòng nhập chính xác Mã Máy (Serial Number / SN của Inverter) để xác nhận xóa an toàn!');
      }

      if (inputSn !== realSn && inputSn !== realDtu && !realSn.includes(inputSn)) {
        throw new Error(`Mã máy [${confirmSn}] không khớp với Số Serial thực tế [${foundDev?.serialNumber || deviceId}] của thiết bị!`);
      }

      const dAcc = String(dealerAccount || '').trim().toLowerCase();
      if (!this.data.dealerDeletedDevices[dAcc]) {
        this.data.dealerDeletedDevices[dAcc] = [];
      }
      if (!this.data.dealerDeletedDevices[dAcc].includes(realSn)) {
        this.data.dealerDeletedDevices[dAcc].push(realSn);
      }
      if (!this.data.dealerDeletedDevices[dAcc].includes(String(deviceId).trim().toLowerCase())) {
        this.data.dealerDeletedDevices[dAcc].push(String(deviceId).trim().toLowerCase());
      }

      // Gỡ quyền phụ trách của đại lý này khỏi thiết bị
      if (foundDev) {
        if (foundDev.installer && foundDev.installer.toLowerCase() === dAcc) {
          foundDev.installer = '';
        }
        if (foundDev.sharedInstallers) {
          foundDev.sharedInstallers = foundDev.sharedInstallers.filter(a => a.toLowerCase() !== dAcc);
        }
      }
      this.saveData();
      return {
        success: true,
        message: `Đã xóa thiết bị [${foundDev?.serialNumber || deviceId}] khỏi danh sách quản lý của đại lý thành công!`
      };
    }
  }

  // ================= CHIA SẺ TRẠM CHO ĐẠI LÝ (BẢO MẬT 100% - KHÔNG GỢI Ý) =================
  getAvailableDealers() {
    // Trả về danh sách đại lý nội bộ cho Master (nếu là Master)
    return this.getDealersList();
  }

  shareStation({ stationId, customerAccount, dealerIdentifier, permissions = ['VIEW', 'CONFIG'] }) {
    if (!stationId) throw new Error('Mã trạm không hợp lệ!');
    if (!dealerIdentifier || !String(dealerIdentifier).trim()) {
      throw new Error('Vui lòng nhập chính xác Mã Đại Lý, Mã Kích Hoạt hoặc Email của Đại Lý!');
    }

    // Luôn nạp lại dữ liệu mới nhất từ file
    this.data = this.loadData();

    const targetQuery = String(dealerIdentifier).trim().toLowerCase();
    const custAcc = String(customerAccount || '').trim().toLowerCase();

    // 1. Tìm đại lý theo account, email, cellphone, hoặc mã đại lý
    let targetDealer = null;

    if (this.data.users) {
      Object.keys(this.data.users).forEach(acc => {
        const u = this.data.users[acc];
        const uDealerCode = String(u.dealerCode || u.technicianCode || '').toLowerCase();
        const uEmail = String(u.email || '').toLowerCase();
        const uPhone = String(u.cellphone || '').toLowerCase();
        const uAcc = acc.toLowerCase();

        if (
          uAcc === targetQuery ||
          (uEmail && uEmail === targetQuery) ||
          (uPhone && uPhone === targetQuery) ||
          (uDealerCode && uDealerCode === targetQuery)
        ) {
          // Bắt buộc đối tượng được chia sẻ phải là Cấp 2: Đại Lý (không chia sẻ cho Master hay chủ nhà)
          if (u.userType === 2 && acc !== 'sungo.vn') {
            targetDealer = {
              account: acc,
              userName: u.userName || acc,
              email: u.email || `${acc}@sungo.vn`,
              company: u.company || 'Đại Lý Phân Phối & Lắp Đặt',
              userType: 2,
              roleName: '🏢 Đại Lý (Dealer)'
            };
          }
        }
      });
    }

    // 2. Nếu tìm theo mã kích hoạt riêng biệt (VD: DL_NEWTECH, DL_TUANSOLAR)
    if (!targetDealer && this.data.technicianCodes) {
      const matchedCode = this.data.technicianCodes.find(tc => 
        String(tc.code).trim().toLowerCase() === targetQuery
      );
      if (matchedCode) {
        // Tìm xem đại lý nào sở hữu code này hoặc match theo tên mã
        let matchedAcc = Object.keys(this.data.users || {}).find(acc => {
          const u = this.data.users[acc];
          const uCode = String(u.dealerCode || u.technicianCode || '').toLowerCase();
          return uCode === targetQuery;
        });

        // Fallback theo quy tắc đặt mã đại lý (VD: DL_NEWTECH -> newtech.sg, DL_TUANSOLAR -> tuan_solar)
        if (!matchedAcc) {
          if (targetQuery.includes('newtech')) matchedAcc = 'newtech.sg';
          else if (targetQuery.includes('tuan')) matchedAcc = 'tuan_solar';
          else if (targetQuery.includes('mientay')) matchedAcc = 'thodien_mientay';
        }

        if (matchedAcc && this.data.users[matchedAcc]) {
          const u = this.data.users[matchedAcc];
          targetDealer = {
            account: matchedAcc,
            userName: u.userName || matchedAcc,
            email: u.email || `${matchedAcc}@sungo.vn`,
            company: u.company || 'Đại Lý Phân Phối & Lắp Đặt',
            userType: 2,
            roleName: '🏢 Đại Lý (Dealer)'
          };
        }
      }
    }

    // 3. Nếu vẫn không tìm thấy bất kỳ Đại Lý Cấp 2 nào hợp lệ -> BÁO LỖI NGAY
    if (!targetDealer) {
      throw new Error(`Không tìm thấy Đại Lý nào khớp với thông tin [${dealerIdentifier}]. Vui lòng kiểm tra lại chính xác 100% Mã Đại Lý hoặc Email do đơn vị lắp đặt cung cấp!`);
    }

    if (!this.data.shares) {
      this.data.shares = [];
    }

    const sId = String(stationId);
    const dealerAcc = targetDealer.account.toLowerCase();

    // Kiểm tra xem đã chia sẻ cho đại lý này chưa
    const existingIndex = this.data.shares.findIndex(s => 
      String(s.stationId) === sId && s.dealerAccount.toLowerCase() === dealerAcc
    );

    const shareItem = {
      shareId: 'SH-' + Date.now(),
      stationId: sId,
      customerAccount: custAcc,
      dealerAccount: dealerAcc,
      dealerName: targetDealer.userName || dealerAcc,
      dealerEmail: targetDealer.email || '',
      dealerCompany: targetDealer.company || 'Đại lý kỹ thuật',
      permissions: permissions || ['VIEW', 'CONFIG'],
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.data.shares[existingIndex] = {
        ...this.data.shares[existingIndex],
        permissions: permissions || ['VIEW', 'CONFIG'],
        updatedAt: new Date().toISOString()
      };
    } else {
      this.data.shares.push(shareItem);
    }

    // Cập nhật installer và sharedInstallers cho tất cả thiết bị thuộc trạm này
    Object.keys(this.data.devices || {}).forEach(devId => {
      const dev = this.data.devices[devId];
      if (String(dev.stationId) === sId || String(dev.deviceId) === sId || dev.stationName === sId) {
        if (!dev.sharedInstallers) dev.sharedInstallers = [];
        if (!dev.sharedInstallers.includes(dealerAcc)) {
          dev.sharedInstallers.push(dealerAcc);
        }
        if (!dev.installer) {
          dev.installer = dealerAcc;
        }
      }
    });

    this.saveData();
    return {
      success: true,
      message: `Đã chia sẻ quyền quản trị trạm cho đại lý ${targetDealer.userName || dealerAcc} thành công!`,
      share: shareItem,
      dealer: targetDealer
    };
  }

  getStationShares(stationId, customerAccount) {
    if (!this.data.shares) this.data.shares = [];
    const sId = String(stationId);
    return this.data.shares.filter(s => String(s.stationId) === sId);
  }

  revokeStationShare({ stationId, dealerAccount, customerAccount }) {
    if (!this.data.shares) this.data.shares = [];
    const sId = String(stationId);
    const dAcc = String(dealerAccount || '').trim().toLowerCase();

    const initialLen = this.data.shares.length;
    this.data.shares = this.data.shares.filter(s => 
      !(String(s.stationId) === sId && s.dealerAccount.toLowerCase() === dAcc)
    );

    // Gỡ quyền khỏi các thiết bị
    Object.keys(this.data.devices || {}).forEach(devId => {
      const dev = this.data.devices[devId];
      if (String(dev.stationId) === sId || String(dev.deviceId) === sId || dev.stationName === sId) {
        if (dev.sharedInstallers) {
          dev.sharedInstallers = dev.sharedInstallers.filter(acc => acc.toLowerCase() !== dAcc);
        }
        if (dev.installer && dev.installer.toLowerCase() === dAcc) {
          dev.installer = (dev.sharedInstallers && dev.sharedInstallers[0]) || '';
        }
      }
    });

    this.saveData();
    return {
      success: true,
      message: `Đã thu hồi quyền quản trị của đại lý ${dealerAccount} đối với trạm này!`
    };
  }

  // Quản lý Mã Kỹ Thuật Viên / Thợ Lắp Đặt
  getTechnicianCodes() {
    if (!this.data.technicianCodes || !Array.isArray(this.data.technicianCodes)) {
      this.data.technicianCodes = [
        { code: 'KT8888', name: 'Đội Kỹ Thuật Tổng Công Ty SUNGO', createdAt: '2026-08-31T00:00:00.000Z', usageCount: 2 },
        { code: 'SUNGO_KT', name: 'Mã Kỹ Thuật Viên Chính Hãng SUNGO', createdAt: '2026-08-31T00:00:00.000Z', usageCount: 1 },
        { code: 'TECH-SUNGO-2026', name: 'Mã Kỹ Sư Lắp Đặt Miền Nam', createdAt: '2026-08-31T00:00:00.000Z', usageCount: 0 },
        { code: 'KTV-ZENO-2026', name: 'Mã Đối Tác Kỹ Thuật Zeno Solar', createdAt: '2026-08-31T00:00:00.000Z', usageCount: 0 }
      ];
      this.saveData();
    }
    return this.data.technicianCodes;
  }

  verifyTechnicianCode(code) {
    if (!code) return false;
    const clean = String(code).trim().toUpperCase();
    const codes = this.getTechnicianCodes();
    const found = codes.find(c => c.code.toUpperCase() === clean);
    if (found) {
      found.usageCount = (found.usageCount || 0) + 1;
      this.saveData();
      return true;
    }
    return false;
  }

  addTechnicianCode({ code, name }) {
    if (!code) return null;
    const clean = String(code).trim().toUpperCase();
    const codes = this.getTechnicianCodes();
    if (codes.some(c => c.code.toUpperCase() === clean)) {
      return null;
    }
    const newEntry = {
      code: clean,
      name: name || `Mã Kỹ Thuật Viên ${clean}`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    codes.unshift(newEntry);
    this.saveData();
    return newEntry;
  }

  deleteTechnicianCode(code) {
    if (!code) return false;
    const clean = String(code).trim().toUpperCase();
    const codes = this.getTechnicianCodes();
    const idx = codes.findIndex(c => c.code.toUpperCase() === clean);
    if (idx !== -1) {
      codes.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  setTechnicianCodeForUser(account, code) {
    const acc = String(account).toLowerCase().trim();
    if (!this.data.users[acc]) {
      this.data.users[acc] = {
        userType: 2,
        roleName: 'Thợ Lắp Đặt / Đại Lý (Installer)',
        userName: account,
        createdAt: new Date().toISOString()
      };
    }
    const cleanCode = String(code).trim().toUpperCase();
    this.data.users[acc].technicianCode = cleanCode;
    this.data.users[acc].userType = 2;
    this.data.users[acc].roleName = 'Thợ Lắp Đặt / Đại Lý (Installer)';
    this.saveData();
    return cleanCode;
  }

  getTechnicianCodeForUser(account) {
    const acc = String(account).toLowerCase().trim();
    return this.data.users[acc]?.technicianCode || null;
  }

  setUserPasswords(account, { cloudPassword, zenoPassword }) {
    const acc = String(account).toLowerCase().trim();
    if (!this.data.users[acc]) {
      this.data.users[acc] = {
        userType: 3,
        roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
        userName: account,
        createdAt: new Date().toISOString()
      };
    }
    if (cloudPassword) this.data.users[acc].cloudPassword = String(cloudPassword).trim();
    if (zenoPassword) {
      this.data.users[acc].zenoPassword = String(zenoPassword).trim();
      this.data.users[acc].password = String(zenoPassword).trim();
    }
    this.saveData();
    return {
      cloudPassword: this.data.users[acc].cloudPassword,
      zenoPassword: this.data.users[acc].zenoPassword
    };
  }

  getUserPasswords(account) {
    const acc = String(account).toLowerCase().trim();
    const u = this.data.users[acc] || {};
    return {
      cloudPassword: u.cloudPassword || u.password || '123456',
      zenoPassword: u.zenoPassword || u.password || 'sungo123'
    };
  }

  save() {
    return this.saveData();
  }
}

module.exports = new DeviceOwnershipService();
