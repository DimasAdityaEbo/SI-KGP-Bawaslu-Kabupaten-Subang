import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pegawai, PengajuanKGB, User, NotificationItem, EmailDispatchLog, SupabaseConfig } from '../types';

const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'sikgb_supabase_config',
  PEGAWAI: 'sikgb_pegawai_data',
  PENGAJUAN: 'sikgb_pengajuan_data',
  USERS: 'sikgb_users_data',
  NOTIFICATIONS: 'sikgb_notif_data',
  EMAIL_LOGS: 'sikgb_email_logs_data',
};

// Default Supabase config (check env vars first, then localStorage)
export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        isConnected: Boolean(parsed.url || envUrl),
      };
    }
  } catch (e) {
    console.error('Error reading saved Supabase config:', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SUPABASE_CONFIG,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), isConnected: Boolean(url && anonKey) })
    );
  } catch (e) {
    console.error('Failed to save Supabase config to local storage', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}

// SQL Schema for Supabase Setup
export const SUPABASE_SQL_SCHEMA = `-- =================================================================
-- SKEMA DATABASE SI-KGB BAWASLU KABUPATEN SUBANG (SUPABASE POSTGRES)
-- =================================================================

-- 1. Tabel Pegawai
CREATE TABLE IF NOT EXISTS public.pegawai (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,
  jabatan TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  bagian_divisi TEXT NOT NULL,
  no_hp TEXT NOT NULL,
  alamat_kantor TEXT NOT NULL,
  alamat_rumah TEXT NOT NULL,
  email TEXT NOT NULL,
  agama TEXT NOT NULL,
  tanggal_pelantikan DATE NOT NULL,
  jadwal_kgb_berikutnya DATE NOT NULL,
  gaji_pokok_terakhir NUMERIC DEFAULT 0,
  golongan_pangkat TEXT,
  pangkat_terakhir TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Users (Kredensial Login Pegawai & Admin)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pegawai')),
  pegawai_id TEXT REFERENCES public.pegawai(id) ON DELETE SET NULL,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pengajuan KGB
CREATE TABLE IF NOT EXISTS public.pengajuan_kgb (
  id TEXT PRIMARY KEY,
  no_pengajuan TEXT UNIQUE NOT NULL,
  pegawai_id TEXT NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  nama_pemohon TEXT NOT NULL,
  nip_pemohon TEXT NOT NULL,
  jabatan_pemohon TEXT NOT NULL,
  divisi_pemohon TEXT NOT NULL,
  email_pemohon TEXT NOT NULL,
  no_hp_pemohon TEXT NOT NULL,
  perihal TEXT NOT NULL,
  periode_kgb TEXT NOT NULL,
  tmt_kgb_baru DATE NOT NULL,
  gaji_lama NUMERIC,
  gaji_baru_estimasi NUMERIC,
  sk_pangkat_terakhir JSONB NOT NULL,
  sk_gaji_berkala_terakhir JSONB,
  dokumen_skp_prestasi JSONB NOT NULL,
  dokumen_pendukung_lain JSONB,
  catatan_pemohon TEXT,
  status TEXT NOT NULL DEFAULT 'menunggu_verifikasi' CHECK (
    status IN ('menunggu_verifikasi', 'dalam_proses', 'perlu_perbaikan', 'disetujui', 'ditolak')
  ),
  catatan_verifikator TEXT,
  diverifikasi_oleh TEXT,
  tanggal_pengajuan TIMESTAMPTZ DEFAULT NOW(),
  tanggal_verifikasi TIMESTAMPTZ,
  nomor_sk_kgb_diterbitkan TEXT,
  tanggal_sk_diterbitkan DATE
);

-- 4. Tabel Notifikasi
CREATE TABLE IF NOT EXISTS public.notifikasi (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Log Pengiriman Email
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_snippet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('sent', 'delivered', 'failed')),
  pengajuan_id TEXT,
  no_pengajuan TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses Publik Terbuka untuk API Key
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_kgb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses anon penuh pegawai" ON public.pegawai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh pengajuan" ON public.pengajuan_kgb FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh notifikasi" ON public.notifikasi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);
`;
