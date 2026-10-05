import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, Database, Mail, LogOut, CheckCircle2, UserCircle, ExternalLink, Shield, KeyRound } from 'lucide-react';
import { BawasluLogo } from './BawasluLogo';

interface HeaderProps {
  currentUser: User;
  pegawaiName?: string;
  onLogout: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenSupabaseModal: () => void;
  onOpenEmailLogs: () => void;
  onOpenUbahPassword: () => void;
  supabaseConnected: boolean;
  totalEmailsSent: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pegawaiName,
  onLogout,
  notifications,
  onOpenNotifications,
  onOpenSupabaseModal,
  onOpenEmailLogs,
  onOpenUbahPassword,
  supabaseConnected,
  totalEmailsSent,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = pegawaiName || currentUser.namaLengkap;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Zone 1: Brand title & Official Logo */}
      <div className="flex items-center gap-3">
        <BawasluLogo size="md" showText={false} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              SI-KGB
            </span>
            <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 sm:inline-block border border-slate-200">
              BAWASLU SUBANG
            </span>
          </div>
          <p className="hidden text-[11px] text-slate-500 md:block">
            Sistem Informasi Kenaikan Gaji Berkala · Bawaslu Kabupaten Subang
          </p>
        </div>
      </div>

      {/* Zone 2: System Status & Integration Badges */}
      <div className="hidden items-center gap-2 lg:flex">
        {/* Supabase Status Trigger */}
        <button
          onClick={onOpenSupabaseModal}
          title="Klik untuk membuka Konfigurasi Database Supabase"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              supabaseConnected ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'
            }`}
          />
          <Database className="h-3.5 w-3.5 text-slate-500" />
          <span>{supabaseConnected ? 'Supabase Aktif' : 'Penyimpanan Sinkron'}</span>
        </button>

        {/* Real-time Email Logs Trigger */}
        <button
          onClick={onOpenEmailLogs}
          title="Lihat Log Notifikasi Email Real-time Bawaslu Subang"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Mail className="h-3.5 w-3.5 text-sky-600" />
          <span>Log Email</span>
          <span className="font-mono-numbers rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-bold text-sky-800">
            {totalEmailsSent}
          </span>
        </button>
      </div>

      {/* Zone 3: User Info, Ubah Password, Notifications, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ubah Password Button */}
        <button
          onClick={onOpenUbahPassword}
          title="Ubah Password Akun"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
        >
          <KeyRound className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden md:inline">Ubah Password</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title="Notifikasi Sistem"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="font-mono-numbers absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] capitalize text-slate-500">
              {currentUser.role === 'admin' ? 'Administrator Kepegawaian' : 'Pegawai ASN / Non-ASN'}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
            {displayName.charAt(0)}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          title="Keluar dari Aplikasi"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
