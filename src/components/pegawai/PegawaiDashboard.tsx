import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FilePlus2,
  History,
  FileText,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Mail,
  Check,
  ExternalLink,
  Send,
} from 'lucide-react';
import { Pegawai, PengajuanKGB, User, EmailDispatchLog } from '../../types';
import {
  sendJadwalReminderEmail,
  generateJadwalReminderPlainText,
  createGmailComposeUrl,
  createMailtoUrl,
} from '../../services/emailService';

interface PegawaiDashboardProps {
  currentUser: User;
  pegawai: Pegawai;
  pengajuanList: PengajuanKGB[];
  onSelectTab: (tab: string) => void;
  onViewPengajuan: (pengajuan: PengajuanKGB) => void;
  onOpenUbahPassword?: () => void;
}

export const PegawaiDashboard: React.FC<PegawaiDashboardProps> = ({
  currentUser,
  pegawai,
  pengajuanList,
  onSelectTab,
  onViewPengajuan,
  onOpenUbahPassword,
}) => {
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    emailLog: EmailDispatchLog;
    gmailUrl: string;
    mailtoUrl: string;
  } | null>(null);

  // Filter submissions by this employee
  const mySubmissions = pengajuanList.filter((p) => p.pegawaiId === pegawai.id);
  const activeSubmission = mySubmissions[0]; // Latest

  // Calculate days until next KGB
  const today = new Date();
  const kgbDate = new Date(pegawai.jadwalKgbBerikutnya);
  const diffTime = kgbDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isKgbSoon = diffDays <= 30;

  const handleSendSelfReminder = async () => {
    setIsSendingReminder(true);
    try {
      const emailLog = await sendJadwalReminderEmail(pegawai, Math.max(0, diffDays));
      const plainText = generateJadwalReminderPlainText(pegawai, diffDays);
      const gmailUrl = createGmailComposeUrl(pegawai.email, emailLog.subject, plainText);
      const mailtoUrl = createMailtoUrl(pegawai.email, emailLog.subject, plainText);

      setReminderModal({
        isOpen: true,
        emailLog,
        gmailUrl,
        mailtoUrl,
      });
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengirim pengingat ke email.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-sm">
              {pegawai.nama.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {pegawai.nama}
                </h1>
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                  Pegawai Aktif
                </span>
              </div>
              <p className="font-mono text-xs text-slate-500 mt-0.5">
                NIP: {pegawai.nip} · {pegawai.jabatan}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {pegawai.bagianDivisi} · Pangkat: {pegawai.golonganPangkat || 'Penata Muda / III/a'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenUbahPassword && (
              <button
                onClick={onOpenUbahPassword}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                <span>Ubah Password</span>
              </button>
            )}
            <button
              onClick={() => onSelectTab('ajukan')}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
            >
              <FilePlus2 className="h-4 w-4" />
              <span>Ajukan Permohonan KGB</span>
            </button>
          </div>
        </div>
      </div>

      {/* COUNTDOWN & NEXT KGB REMINDER CARD */}
      <div
        className={`rounded-xl border p-5 ${
          isKgbSoon
            ? 'border-amber-300 bg-amber-50/70 text-amber-950'
            : 'border-slate-200 bg-white text-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-lg p-2.5 shrink-0 ${
                isKgbSoon ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">
                  Jadwal Kenaikan Gaji Berkala (KGB) Berikutnya
                </h2>
                {isKgbSoon && (
                  <span className="font-mono-numbers rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                    Mendesak (&lt; 1 Bulan)
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 text-slate-600">
                Berdasarkan masa kerja golongan 2 (dua) tahun, TMT KGB Anda jatuh tempo pada:{' '}
                <strong className="text-slate-900 font-mono text-sm">{pegawai.jadwalKgbBerikutnya}</strong>
              </p>
              {isKgbSoon ? (
                <p className="mt-2 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Tersisa sekitar <span className="font-mono-numbers text-sm font-bold">{diffDays} hari</span> lagi. Disarankan segera melengkapi berkas pengajuan KGB ke Sekretariat Bawaslu Subang.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Masih tersisa {diffDays} hari hingga periode kenaikan gaji berkala Anda berikutnya.
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendSelfReminder}
              disabled={isSendingReminder}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title="Kirimkan pengingat jadwal dan berkas persyaratan ke email saya"
            >
              <Mail className="h-3.5 w-3.5 text-sky-600" />
              <span>{isSendingReminder ? 'Mengirim...' : 'Kirim Pengingat ke Email'}</span>
            </button>

            <button
              onClick={() => onSelectTab('ajukan')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition shadow-xs ${
                isKgbSoon
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              Ajukan KGB Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* STATUS PENGAJUAN AKTIF SAAT INI */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Status Pengajuan Terakhir Anda
            </h2>
            <p className="text-[11px] text-slate-500">
              Pelacakan proses tahapan berkas verifikasi di Sub Bagian Administrasi &amp; Kepegawaian
            </p>
          </div>
          <button
            onClick={() => onSelectTab('riwayat')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeSubmission ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <p className="font-mono text-xs font-bold text-slate-900">
                  {activeSubmission.noPengajuan}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{activeSubmission.perihal}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Waktu Diajukan: {new Date(activeSubmission.tanggalPengajuan).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                {activeSubmission.status === 'disetujui' && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    KGB Disetujui
                  </span>
                )}
                {activeSubmission.status === 'menunggu_verifikasi' && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                    <Clock className="h-4 w-4 text-amber-700" />
                    Menunggu Verifikasi Staf
                  </span>
                )}
                {activeSubmission.status === 'perlu_perbaikan' && (
                  <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900 border border-orange-300">
                    <AlertTriangle className="h-4 w-4 text-orange-700" />
                    Perlu Perbaikan Dokumen
                  </span>
                )}
                {activeSubmission.status === 'ditolak' && (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-xs font-bold text-red-900 border border-red-300">
                    Pengajuan Ditolak
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="py-2">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                    ✓
                  </div>
                  <span className="mt-1 font-semibold text-slate-900">1. Terkirim</span>
                  <span className="text-[10px] text-slate-400">Berkas Masuk Sistem</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      activeSubmission.status === 'disetujui' || activeSubmission.status === 'perlu_perbaikan'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    2
                  </div>
                  <span className="mt-1 font-semibold text-slate-900">2. Verifikasi Dokumen</span>
                  <span className="text-[10px] text-slate-400">Pemeriksaan SKP &amp; SK Pangkat</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      activeSubmission.status === 'disetujui'
                        ? 'bg-emerald-600 text-white'
                        : activeSubmission.status === 'perlu_perbaikan'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    3
                  </div>
                  <span className="mt-1 font-semibold text-slate-900">3. Penetapan &amp; SK</span>
                  <span className="text-[10px] text-slate-400">
                    {activeSubmission.status === 'disetujui' ? 'SK Terbit' : 'Hasil Keputusan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Note from verifier if any */}
            {activeSubmission.catatanVerifikator && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold block text-slate-900">Catatan Petugas Verifikator:</span>
                <p className="mt-0.5 italic">"{activeSubmission.catatanVerifikator}"</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => onViewPengajuan(activeSubmission)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Lihat Detail Pengajuan &amp; Berkas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            <p>Anda belum pernah mengajukan permohonan kenaikan gaji berkala.</p>
            <button
              onClick={() => onSelectTab('ajukan')}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 font-semibold text-white hover:bg-slate-800"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>Buat Pengajuan Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* QUICK SUMMARY OF REGULATION & SOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Building2 className="h-4 w-4 text-slate-600" />
            <span>Dasar Hukum Pelayanan KGB</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Berlandaskan UU No. 25 Tahun 2009 tentang Pelayanan Publik, UU No. 20 Tahun 2023 (UU ASN), PP No. 17 Tahun 2020, dan PP No. 5 Tahun 2024 tentang Peraturan Gaji Pegawai Negeri Sipil.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Waktu Pelayanan &amp; Produk</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Standar waktu pelayanan adalah <strong>7 (tujuh) Hari Kerja</strong> dengan produk layanan <strong>Surat Usulan Kenaikan Gaji Berkala</strong> dan biaya <strong>Gratis (Rp 0,-)</strong>.
          </p>
        </div>
      </div>

      {/* REMINDER MODAL FOR PEGAWAI */}
      {reminderModal && reminderModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-amber-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-snug">
                    Pengingat KGB Terkirim ke Email
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Notifikasi jadwal dan panduan berkas telah diproses
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status Pengiriman:</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Check className="h-3 w-3" /> Berhasil Dikirim (Delivered)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Alamat Email Anda:</span>
                  <span className="font-mono font-bold text-slate-900">{pegawai.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Jadwal TMT KGB:</span>
                  <span className="font-mono font-semibold text-amber-800">
                    {pegawai.jadwalKgbBerikutnya} ({diffDays <= 0 ? 'Jatuh Tempo' : `${diffDays} hari lagi`})
                  </span>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-2">Buka Langsung di Layanan Email:</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={reminderModal.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                  >
                    <span>Buka Gmail Web</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href={reminderModal.mailtoUrl}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <span>Aplikasi Email</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setReminderModal(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
