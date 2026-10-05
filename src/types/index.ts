export type UserRole = 'admin' | 'pegawai';

export type PengajuanStatus = 
  | 'menunggu_verifikasi' 
  | 'dalam_proses' 
  | 'perlu_perbaikan' 
  | 'disetujui' 
  | 'ditolak';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  pegawaiId?: string; // Link to Pegawai if role is pegawai
  namaLengkap: string;
  email: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
  lastLogin?: string;
}

export interface Pegawai {
  id: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jabatan: string;
  nip: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  bagianDivisi: string;
  noHp: string;
  alamatKantor: string;
  alamatRumah: string;
  email: string;
  agama: string;
  tanggalPelantikan: string;
  jadwalKgbBerikutnya: string; // YYYY-MM-DD
  gajiPokokTerakhir?: number;
  golonganPangkat?: string;
  pangkatTerakhir?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DokumenLampiran {
  id: string;
  namaFile: string;
  jenisDokumen: 'sk_pangkat' | 'sk_kgb' | 'skp_prestasi' | 'dokumen_pendukung';
  tipeFile: string;
  ukuranFile: string;
  fileData?: string; // Base64 or URL
  uploadedAt: string;
}

export interface PengajuanKGB {
  id: string;
  noPengajuan: string; // e.g. KGB/BWS-SBG/2026/001
  pegawaiId: string;
  namaPemohon: string;
  nipPemohon: string;
  jabatanPemohon: string;
  divisiPemohon: string;
  emailPemohon: string;
  noHpPemohon: string;
  perihal: string;
  periodeKgb: string;
  tmtKgbBaru: string;
  gajiLama?: number;
  gajiBaruEstimasi?: number;
  skPangkatTerakhir: DokumenLampiran;
  skGajiBerkalaTerakhir?: DokumenLampiran;
  dokumenSkpPrestasi: DokumenLampiran;
  dokumenPendukungLain?: DokumenLampiran;
  catatanPemohon?: string;
  status: PengajuanStatus;
  catatanVerifikator?: string;
  diverifikasiOleh?: string;
  tanggalPengajuan: string;
  tanggalVerifikasi?: string;
  nomorSkKgbDiterbitkan?: string;
  tanggalSkDiterbitkan?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // specific user or 'all_admin'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  linkTarget?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailDispatchLog {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  contentSnippet: string;
  status: 'sent' | 'delivered' | 'failed';
  pengajuanId?: string;
  noPengajuan?: string;
  timestamp: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
