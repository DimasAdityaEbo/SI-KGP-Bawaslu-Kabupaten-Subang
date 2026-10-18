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
import { TemplateDokumenView } from './components/admin/TemplateDokumenView';
import { PegawaiDashboard } from './components/pegawai/PegawaiDashboard';
import { AjukanPermohonan } from './components/pegawai/AjukanPermohonan';
import { RiwayatPengajuan } from './components/pegawai/RiwayatPengajuan';
import { RegulasiView } from './components/pegawai/RegulasiView';
import { ProfilPegawaiView } from './components/pegawai/ProfilPegawaiView';
import { SupabaseModal } from './components/SupabaseModal';
import { EmailLogModal } from './components/EmailLogModal';
import { NotificationModal } from './components/NotificationModal';
import { UbahPasswordModal } from './components/UbahPasswordModal';
import { KopSuratModal } from './components/admin/KopSuratModal';

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
  const [isGlobalKopModalOpen, setIsGlobalKopModalOpen] = useState(false);

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
    // Halaman pertama yang tampil saat membuka aplikasi selalu halaman login
    setCurrentUser(null);
    localStorage.removeItem('sikgb_session_user');
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

  // Check if active pegawai has an ongoing submission (not yet approved or rejected)
  const hasPegawaiOngoingPengajuan = linkedPegawai
    ? pengajuanList.some(
        (p) => p.pegawaiId === linkedPegawai.id && p.status !== 'disetujui' && p.status !== 'ditolak'
      )
    : false;

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
          hasOngoingPengajuan={hasPegawaiOngoingPengajuan}
          onOpenSupabaseModal={currentUser.role === 'admin' ? () => setIsSupabaseModalOpen(true) : undefined}
          onOpenEmailLogs={currentUser.role === 'admin' ? () => setIsEmailLogsModalOpen(true) : undefined}
          onOpenUbahPassword={() => setIsUbahPasswordModalOpen(true)}
          onOpenKopSuratModal={currentUser.role === 'admin' ? () => setIsGlobalKopModalOpen(true) : undefined}
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

              {currentTab === 'template' && (
                <TemplateDokumenView
                  pegawaiList={pegawaiList}
                  pengajuanList={pengajuanList}
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
                  pengajuanList={pengajuanList}
                  onRefreshData={loadAllData}
                  onSuccessRedirect={() => setCurrentTab('riwayat')}
                  onViewDetailPengajuan={(item) => {
                    setSelectedPengajuan(item);
                    setCurrentTab('riwayat');
                  }}
                />
              )}

              {currentTab === 'riwayat' && linkedPegawai && (
                <RiwayatPengajuan
                  pegawai={linkedPegawai}
                  pengajuanList={pengajuanList}
                  onRefreshData={loadAllData}
                  selectedPengajuanFromDashboard={selectedPengajuan}
                  onClearSelectedPengajuan={() => setSelectedPengajuan(null)}
                  onSelectTab={setCurrentTab}
                />
              )}

              {currentTab === 'regulasi' && <RegulasiView />}

              {currentTab === 'profil' && linkedPegawai && (
                <ProfilPegawaiView
                  pegawai={linkedPegawai}
                  currentUser={currentUser}
                  onRefreshData={loadAllData}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}
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

      {/* GLOBAL KOP SURAT CONFIGURATION MODAL */}
      <KopSuratModal
        isOpen={isGlobalKopModalOpen && currentUser?.role === 'admin'}
        onClose={() => setIsGlobalKopModalOpen(false)}
        isAdmin={currentUser?.role === 'admin'}
      />
    </div>
  );
}
