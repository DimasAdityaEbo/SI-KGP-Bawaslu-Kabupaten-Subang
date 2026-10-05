import React, { useState, useEffect } from 'react';
import {
  User,
  Pegawai,
  PengajuanKGB,
  NotificationItem,
  EmailDispatchLog,
  SupabaseConfig,
} from './types';
import {
  getPegawaiList,
  getPengajuanList,
  getUsersList,
  getNotifications,
  getEmailLogs,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './services/storage';
import { getSavedSupabaseConfig } from './services/supabase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { KelolaPegawai } from './components/admin/KelolaPegawai';
import { DaftarPengajuan } from './components/admin/DaftarPengajuan';
import { KelolaUser } from './components/admin/KelolaUser';
import { LaporanKgb } from './components/admin/LaporanKgb';
import { PegawaiDashboard } from './components/pegawai/PegawaiDashboard';
import { AjukanPermohonan } from './components/pegawai/AjukanPermohonan';
import { RiwayatPengajuan } from './components/pegawai/RiwayatPengajuan';
import { RegulasiView } from './components/pegawai/RegulasiView';
import { SupabaseModal } from './components/SupabaseModal';
import { EmailLogModal } from './components/EmailLogModal';
import { NotificationModal } from './components/NotificationModal';
import { UbahPasswordModal } from './components/UbahPasswordModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Master Data States
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [pengajuanList, setPengajuanList] = useState<PengajuanKGB[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig());

  // Navigation Deep Links
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanKGB | null>(null);

  // Modals
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isUbahPasswordModalOpen, setIsUbahPasswordModalOpen] = useState(false);

  // Load Data
  const loadAllData = async () => {
    try {
      const [pList, kgbList, uList, nList, eList] = await Promise.all([
        getPegawaiList(),
        getPengajuanList(),
        getUsersList(),
        getNotifications(),
        getEmailLogs(),
      ]);

      setPegawaiList(pList);
      setPengajuanList(kgbList);
      setUsersList(uList);
      setNotifications(nList);
      setEmailLogs(eList);
      setSupabaseConfig(getSavedSupabaseConfig());

      // If user is logged in, sync currentUser in case updated
      if (currentUser) {
        const refreshedUser = uList.find((u) => u.id === currentUser.id);
        if (refreshedUser) setCurrentUser(refreshedUser);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  useEffect(() => {
    loadAllData();

    // Check if user session was stored in localStorage
    const savedUser = localStorage.getItem('sikgb_session_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default to initial admin for instant usability
      getUsersList().then((users) => {
        if (users.length > 0) {
          setCurrentUser(users[0]);
        }
      });
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sikgb_session_user', JSON.stringify(user));
    setCurrentTab('dashboard');
    setSelectedPengajuan(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sikgb_session_user');
  };

  const handleMarkNotifRead = async (id: string) => {
    await markNotificationAsRead(id);
    const updated = await getNotifications();
    setNotifications(updated);
  };

  const handleMarkAllNotifsRead = async () => {
    await markAllNotificationsAsRead(currentUser?.id);
    const updated = await getNotifications();
    setNotifications(updated);
  };

  // Find linked pegawai record if role is pegawai
  const linkedPegawai = currentUser?.pegawaiId
    ? pegawaiList.find((p) => p.id === currentUser.pegawaiId)
    : currentUser?.role === 'pegawai'
    ? pegawaiList.find((p) => p.email === currentUser.email || p.nama === currentUser.namaLengkap) || pegawaiList[0]
    : undefined;

  const currentDisplayName = currentUser?.role === 'pegawai' && linkedPegawai
    ? linkedPegawai.nama
    : currentUser?.namaLengkap || 'Pengguna';

  // Synchronize currentUser with updated employee data in real-time
  useEffect(() => {
    if (currentUser && currentUser.role === 'pegawai') {
      const match = currentUser.pegawaiId
        ? pegawaiList.find((p) => p.id === currentUser.pegawaiId)
        : pegawaiList.find((p) => p.email === currentUser.email);
      if (match && match.nama !== currentUser.namaLengkap) {
        const updated: User = {
          ...currentUser,
          namaLengkap: match.nama,
          email: match.email,
          pegawaiId: match.id,
        };
        setCurrentUser(updated);
        localStorage.setItem('sikgb_session_user', JSON.stringify(updated));
      }
    }
  }, [pegawaiList, currentUser?.pegawaiId]);

  // Pending count for sidebar badge
  const pendingCount = pengajuanList.filter((p) => p.status === 'menunggu_verifikasi').length;

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} usersList={usersList} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        pegawaiName={currentDisplayName}
        onLogout={handleLogout}
        notifications={
          currentUser.role === 'admin'
            ? notifications
            : notifications.filter((n) => n.userId === currentUser.pegawaiId || n.userId === currentUser.id)
        }
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenEmailLogs={() => setIsEmailLogsModalOpen(true)}
        onOpenUbahPassword={() => setIsUbahPasswordModalOpen(true)}
        supabaseConnected={supabaseConfig.isConnected}
        totalEmailsSent={emailLogs.length}
      />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          role={currentUser.role}
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedPengajuan(null);
          }}
          pendingCount={pendingCount}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenEmailLogs={() => setIsEmailLogsModalOpen(true)}
          onOpenUbahPassword={() => setIsUbahPasswordModalOpen(true)}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ================= ADMIN VIEWS ================= */}
          {currentUser.role === 'admin' && (
            <>
              {currentTab === 'dashboard' && (
                <AdminDashboard
                  pegawaiList={pegawaiList}
                  pengajuanList={pengajuanList}
                  onSelectTab={setCurrentTab}
                  onViewPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('pengajuan');
                  }}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'pegawai' && (
                <KelolaPegawai
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'pengajuan' && (
                <DaftarPengajuan
                  pengajuanList={pengajuanList}
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                  selectedPengajuanFromDashboard={selectedPengajuan}
                  onClearSelectedPengajuan={() => setSelectedPengajuan(null)}
                />
              )}

              {currentTab === 'users' && (
                <KelolaUser
                  usersList={usersList}
                  pegawaiList={pegawaiList}
                  onRefreshData={loadAllData}
                />
              )}

              {currentTab === 'laporan' && (
                <LaporanKgb
                  pengajuanList={pengajuanList}
                  pegawaiList={pegawaiList}
                />
              )}
            </>
          )}

          {/* ================= PEGAWAI VIEWS ================= */}
          {currentUser.role === 'pegawai' && (
            <>
              {currentTab === 'dashboard' && linkedPegawai && (
                <PegawaiDashboard
                  currentUser={currentUser}
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onSelectTab={setCurrentTab}
                  onViewPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('riwayat');
                  }}
                  onOpenUbahPassword={() => setIsUbahPasswordModalOpen(true)}
                />
              )}

              {currentTab === 'ajukan' && linkedPegawai && (
                <AjukanPermohonan
                  pegawai={linkedPegawai}
                  onRefreshData={loadAllData}
                  onSuccessRedirect={() => setCurrentTab('riwayat')}
                />
              )}

              {currentTab === 'riwayat' && linkedPegawai && (
                <RiwayatPengajuan
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onRefreshData={loadAllData}
                  selectedPengajuanFromDashboard={selectedPengajuan}
                  onClearSelectedPengajuan={() => setSelectedPengajuan(null)}
                />
              )}

              {currentTab === 'regulasi' && <RegulasiView />}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigChanged={loadAllData}
        allPegawai={pegawaiList}
        allUsers={usersList}
        allPengajuan={pengajuanList}
      />

      <EmailLogModal
        isOpen={isEmailLogsModalOpen}
        onClose={() => setIsEmailLogsModalOpen(false)}
        emailLogs={emailLogs}
        pengajuanList={pengajuanList}
        onRefreshLogs={loadAllData}
      />

      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={
          currentUser.role === 'admin'
            ? notifications
            : notifications.filter((n) => n.userId === currentUser.pegawaiId || n.userId === currentUser.id)
        }
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
      />

      {currentUser && (
        <UbahPasswordModal
          isOpen={isUbahPasswordModalOpen}
          onClose={() => setIsUbahPasswordModalOpen(false)}
          currentUser={currentUser}
          onPasswordChanged={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('sikgb_session_user', JSON.stringify(updatedUser));
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
