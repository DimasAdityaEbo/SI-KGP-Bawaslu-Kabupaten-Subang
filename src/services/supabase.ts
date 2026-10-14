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

// Default Supabase config (check env vars first, then localStorage, then default project)
export const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://dlslyqwkwlajpwcytnwj.supabase.co',
  anonKey: 'sb_publishable_A4XiPUzCGwDYDNsRS9qXSQ_svK74agv',
};

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip /rest/v1 if included by user copy-paste
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  return cleaned;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = normalizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL || '');
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const url = normalizeSupabaseUrl(parsed.url || envUrl || DEFAULT_SUPABASE_CONFIG.url);
      const anonKey = parsed.anonKey || envKey || DEFAULT_SUPABASE_CONFIG.anonKey;
      return {
        url,
        anonKey,
        isConnected: Boolean(url && anonKey),
      };
    }
  } catch (e) {
    console.error('Error reading saved Supabase config:', e);
  }

  const url = normalizeSupabaseUrl(envUrl || DEFAULT_SUPABASE_CONFIG.url);
  const anonKey = envKey || DEFAULT_SUPABASE_CONFIG.anonKey;

  return {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const normalizedUrl = normalizeSupabaseUrl(url);
  try {
    localStorage.setItem(
      STORAGE_KEYS.SUPABASE_CONFIG,
      JSON.stringify({
        url: normalizedUrl,
        anonKey: anonKey.trim(),
        isConnected: Boolean(normalizedUrl && anonKey.trim()),
      })
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
    status IN ('menunggu_verifikasi', 'dalam_proses', 'dikirim_ke_provinsi', 'perlu_perbaikan', 'disetujui', 'ditolak')
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

-- 6. Tabel Pengaturan Kop Surat Resmi
CREATE TABLE IF NOT EXISTS public.pengaturan_kop_surat (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nama_instansi_utama TEXT NOT NULL,
  nama_instansi_sub TEXT NOT NULL,
  unit_kerja TEXT,
  alamat_lengkap TEXT NOT NULL,
  telepon_faks TEXT,
  email_website TEXT,
  kode_pos TEXT,
  logo_url TEXT,
  logo_width_px INTEGER DEFAULT 80,
  garis_kop_gaya TEXT DEFAULT 'ganda',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Pengaturan Tanda Tangan & Cap Dinas
CREATE TABLE IF NOT EXISTS public.pengaturan_ttd_cap (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nama_pejabat TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  nip TEXT NOT NULL,
  kota TEXT NOT NULL,
  tanda_tangan_url TEXT,
  tanda_tangan_width_px INTEGER DEFAULT 140,
  tampilkan_tanda_tangan BOOLEAN DEFAULT TRUE,
  cap_url TEXT,
  cap_width_px INTEGER DEFAULT 120,
  tampilkan_cap BOOLEAN DEFAULT TRUE,
  posisi_cap TEXT DEFAULT 'tumpang_kiri',
  opacity_cap NUMERIC DEFAULT 0.88,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Template Dokumen
CREATE TABLE IF NOT EXISTS public.template_dokumen (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  nomor_perbawaslu TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  isi_template TEXT NOT NULL,
  variabel_tersedia JSONB NOT NULL,
  terakhir_diubah TIMESTAMPTZ DEFAULT NOW(),
  diubah_oleh TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses Publik Terbuka untuk API Key
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_kgb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_kop_surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_ttd_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_dokumen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses anon penuh pegawai" ON public.pegawai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh pengajuan" ON public.pengajuan_kgb FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh notifikasi" ON public.notifikasi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh kop_surat" ON public.pengaturan_kop_surat FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh ttd_cap" ON public.pengaturan_ttd_cap FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses anon penuh templates" ON public.template_dokumen FOR ALL USING (true) WITH CHECK (true);
`;
