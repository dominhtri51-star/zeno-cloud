import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import SecurityPhoneModal from './components/SecurityPhoneModal';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Stations from './pages/Stations';
import Alarms from './pages/Alarms';
import PublicRegister from './pages/PublicRegister';
import Settings from './pages/Settings';
import Login from './pages/Login';

function MainApp() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('stations');
  const [selectedDeviceContext, setSelectedDeviceContext] = useState({
    stationId: null,
    deviceId: null
  });
  const [showSecurityPhoneModal, setShowSecurityPhoneModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const userType = Number(currentUser?.userType || user?.userType || 3);

  // Hiển thị Popup bổ sung số điện thoại bảo mật khi người dùng cuối vào app lần đầu tiên
  useEffect(() => {
    setCurrentUser(user);
    if (isAuthenticated && user) {
      const isEndUser = Number(user.userType || 3) === 3;
      const hasPhone = Boolean(user.cellphone && String(user.cellphone).trim().length >= 9);
      const isDismissed = localStorage.getItem(`phone_prompt_done_${user.account}`) === 'true';

      if (isEndUser && !hasPhone && !isDismissed) {
        const timer = setTimeout(() => {
          setShowSecurityPhoneModal(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  // Route Guard: Tự động chặn và chuyển hướng nếu không có quyền
  useEffect(() => {
    if (userType === 3) {
      // Chủ nhà chỉ được xem dashboard, stations, alarms, settings
      if (['customers', 'public-register'].includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    } else if (userType === 2) {
      // Thợ kỹ thuật chỉ được xem dashboard, stations, customers, alarms, settings
      if (['public-register'].includes(currentPage)) {
        setCurrentPage('stations');
      }
    }
  }, [userType, currentPage]);

  const handleSelectDevice = (stationId, deviceId) => {
    setSelectedDeviceContext({ stationId, deviceId });
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page, context = null) => {
    // Kiểm tra quyền chuyển trang
    if (userType === 3 && ['customers', 'public-register'].includes(page)) {
      return;
    }
    if (userType === 2 && ['public-register'].includes(page)) {
      return;
    }

    if (context && context.stationId) {
      setSelectedDeviceContext(context);
    }
    setCurrentPage(page);
  };

  // If user opens the public self-registration page directly
  if (currentPage === 'public-register') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <PublicRegister onBackToDashboard={isAuthenticated ? () => setCurrentPage('stations') : null} />
      </div>
    );
  }

  // If not logged in, show login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setCurrentPage('stations')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {currentPage === 'stations' && (
            <Stations 
              onNavigate={handleNavigate} 
              onSelectDevice={handleSelectDevice} 
            />
          )}
          {currentPage === 'dashboard' && (
            <Dashboard 
              initialStationId={selectedDeviceContext.stationId}
              initialDeviceId={selectedDeviceContext.deviceId}
              onNavigate={handleNavigate} 
            />
          )}
          {currentPage === 'customers' && userType <= 2 && <Customers />}
          {currentPage === 'alarms' && <Alarms />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Security Phone Modal Popup for End-Users */}
      <SecurityPhoneModal 
        user={currentUser || user}
        isOpen={showSecurityPhoneModal}
        onClose={() => setShowSecurityPhoneModal(false)}
        onPhoneUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
