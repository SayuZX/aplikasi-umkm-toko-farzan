import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Box from '@mui/material/Box';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Karyawan from './pages/Karyawan';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import Locations from './pages/Locations';
import Vouchers from './pages/Vouchers';
import Jadwal from './pages/Jadwal';
import Kasbon from './pages/Kasbon';
import LayananDigital from './pages/LayananDigital';
import PaymentHistory from './pages/PaymentHistory';
import Navbar from './components/Navbar';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import CustomTitleBar from './components/CustomTitleBar';
import UpdateDialog from './components/UpdateDialog';
import MaintenanceGuard from './components/MaintenanceGuard';
import MobileBlocker from './components/MobileBlocker';
import WelcomeScreen from './screens/WelcomeScreen';
import LockScreen from './screens/LockScreen';
import IdleScreen from './components/IdleScreen';
import useIdleTimeout from './hooks/useIdleTimeout';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children, adminOnly = false, allowedRoles }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" />;
  return children;
}

function AppLayout({ children }) {
  const { idleScreen, wakeUp } = useIdleTimeout();
  return (
    <Box sx={{ display: 'flex', height: '100vh', pt: window.electronAPI?.isElectron ? '36px' : 0 }}>
      <CustomTitleBar />
      <CollapsibleSidebar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {children}
        </Box>
      </Box>
      <IdleScreen active={idleScreen} onWake={wakeUp} />
    </Box>
  );
}

export default function App() {
  const { token } = useAuthStore();
  const isElectron = !!window.electronAPI?.isElectron;

  // Screen flow: welcome (first launch) → lock → app routes
  const [screen, setScreen] = useState('loading'); // loading | welcome | lock | app

  useEffect(() => {
    if (!isElectron) {
      setScreen('app');
      return;
    }
    (async () => {
      try {
        const isFirst = await window.electronAPI.getFirstLaunch();
        setScreen(isFirst ? 'welcome' : 'lock');
      } catch {
        setScreen('app');
      }
    })();
  }, [isElectron]);

  if (screen === 'loading') return null;

  if (screen === 'welcome') {
    return <WelcomeScreen onDone={() => setScreen('lock')} />;
  }

  if (screen === 'lock') {
    return <LockScreen onUnlock={() => setScreen('app')} />;
  }

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000 }}
        containerStyle={{ top: window.electronAPI?.isElectron ? 44 : 8 }}
      />
      <UpdateDialog />
      <MobileBlocker>
        <MaintenanceGuard>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          } />
          <Route path="/kasir" element={
            <ProtectedRoute allowedRoles={['admin', 'kasir']}><AppLayout><Kasir /></AppLayout></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}><AppLayout><Products /></AppLayout></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>
          } />
          <Route path="/karyawan" element={
            <ProtectedRoute allowedRoles={['admin', 'developer', 'owner']}><AppLayout><Karyawan /></AppLayout></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute adminOnly><AppLayout><Settings /></AppLayout></ProtectedRoute>
          } />
          <Route path="/locations" element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}><AppLayout><Locations /></AppLayout></ProtectedRoute>
          } />
          <Route path="/vouchers" element={
            <ProtectedRoute allowedRoles={['admin', 'owner']}><AppLayout><Vouchers /></AppLayout></ProtectedRoute>
          } />
          <Route path="/jadwal" element={
            <ProtectedRoute><AppLayout><Jadwal /></AppLayout></ProtectedRoute>
          } />
          <Route path="/kasbon" element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'kasir']}><AppLayout><Kasbon /></AppLayout></ProtectedRoute>
          } />
          <Route path="/layanan-digital" element={
            <ProtectedRoute allowedRoles={['admin', 'developer', 'owner', 'kasir']}><AppLayout><LayananDigital /></AppLayout></ProtectedRoute>
          } />
          <Route path="/payment-history" element={
            <ProtectedRoute allowedRoles={['admin', 'owner', 'kasir']}><AppLayout><PaymentHistory /></AppLayout></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </MaintenanceGuard>
      </MobileBlocker>
    </HashRouter>
  );
}
