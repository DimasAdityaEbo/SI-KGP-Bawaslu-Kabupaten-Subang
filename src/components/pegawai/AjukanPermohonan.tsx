import React, { useState } from 'react';
import {
  FilePlus2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  BookOpen,
  GitPullRequest,
  CheckSquare,
  Clock,
  Award,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Pegawai, PengajuanKGB, DokumenLampiran } from '../../types';
import { savePengajuan } from '../../services/storage';
import { sendKgbStatusEmail } from '../../services/emailService';
import { PrintDocumentModal } from '../PrintDocumentModal';
import { readFileAsDataUrl } from '../../services/documentUtils';

interface AjukanPermohonanProps {
  pegawai: Pegawai;
  onRefreshData: () => void;
  onSuccessRedirect: () => void;
}

export const AjukanPermohonan: React.FC<AjukanPermohonanProps> = ({
  pegawai,
  onRefreshData,
  onSuccessRedirect,
}) => {
  // Form fields
  const [perihal, setPerihal] = useState(
    `Permohonan Kenaikan Gaji Berkala (KGB) Periode ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
  );
  const [periodeKgb, setPeriodeKgb] = useState(
    new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  );
  const [tmtKgbBaru, setTmtKgbBaru] = useState(pegawai.jadwalKgbBerikutnya || '2026-10-01');
  const [catatanPemohon, setCatatanPemohon] = useState('');

  // Uploaded files states
  const [fileSkPangkat, setFileSkPangkat] = useState<File | null>(null);
  const [fileSkKgb, setFileSkKgb] = useState<File | null>(null);
  const [fileSkpPrestasi, setFileSkpPrestasi] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPengajuan, setSubmittedPengajuan] = useState<PengajuanKGB | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Active info tab
  const [activeInfoTab, setActiveInfoTab] = useState<'dasar_hukum' | 'alur' | 'persyaratan' | 'waktu' | 'produk'>('dasar_hukum');

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileSkPangkat) {
      alert('Harap unggah SK Kenaikan Pangkat terakhir Anda.');
      return;
    }
    if (!fileSkpPrestasi) {
      alert('Harap unggah Dokumen Penilaian Prestasi Kerja (SKP) terakhir Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketNumber = `KGB/BWS-SBG/${new Date().getFullYear()}/${String(
        Math.floor(Math.random() * 900) + 100
      )}`;

      // Read real binary data from uploaded files
      const [skPangkatData, skpData, skKgbData] = await Promise.all([
        readFileAsDataUrl(fileSkPangkat),
        readFileAsDataUrl(fileSkpPrestasi),
        fileSkKgb ? readFileAsDataUrl(fileSkKgb) : Promise.resolve(undefined),
      ]);

      const skPangkatDoc: DokumenLampiran = {
        id: `doc-pangkat-${Date.now()}`,
        namaFile: fileSkPangkat.name,
        jenisDokumen: 'sk_pangkat',
        tipeFile: fileSkPangkat.type || 'application/pdf',
        ukuranFile: `${(fileSkPangkat.size / (1024 * 1024)).toFixed(2)} MB`,
        fileData: skPangkatData,
        uploadedAt: new Date().toISOString(),
      };

      const skpDoc: DokumenLampiran = {
        id: `doc-skp-${Date.now()}`,
        namaFile: fileSkpPrestasi.name,
        jenisDokumen: 'skp_prestasi',
        tipeFile: fileSkpPrestasi.type || 'application/pdf',
        ukuranFile: `${(fileSkpPrestasi.size / (1024 * 1024)).toFixed(2)} MB`,
        fileData: skpData,
        uploadedAt: new Date().toISOString(),
      };

      let skKgbDoc: DokumenLampiran | undefined = undefined;
      if (fileSkKgb) {
        skKgbDoc = {
          id: `doc-kgb-${Date.now()}`,
          namaFile: fileSkKgb.name,
          jenisDokumen: 'sk_kgb',
          tipeFile: fileSkKgb.type || 'application/pdf',
          ukuranFile: `${(fileSkKgb.size / (1024 * 1024)).toFixed(2)} MB`,
          fileData: skKgbData,
          uploadedAt: new Date().toISOString(),
        };
      }

      const newPengajuan: PengajuanKGB = {
        id: `kgb-${Date.now()}`,
        noPengajuan: ticketNumber,
        pegawaiId: pegawai.id,
        namaPemohon: pegawai.nama,
        nipPemohon: pegawai.nip,
        jabatanPemohon: pegawai.jabatan,
        divisiPemohon: pegawai.bagianDivisi,
        emailPemohon: pegawai.email,
        noHpPemohon: pegawai.noHp,
        perihal: perihal.trim(),
        periodeKgb: periodeKgb.trim(),
        tmtKgbBaru: tmtKgbBaru,
        gajiLama: pegawai.gajiPokokTerakhir || 3820000,
        gajiBaruEstimasi: (pegawai.gajiPokokTerakhir || 3820000) + 160000,
        skPangkatTerakhir: skPangkatDoc,
        skGajiBerkalaTerakhir: skKgbDoc,
        dokumenSkpPrestasi: skpDoc,
        catatanPemohon: catatanPemohon.trim() || undefined,
        status: 'menunggu_verifikasi',
        tanggalPengajuan: new Date().toISOString(),
      };

      // Save to storage/Supabase
      await savePengajuan(newPengajuan);

      // Dispatch real-time notification email
      await sendKgbStatusEmail(newPengajuan, 'dibuat');

      setSubmittedPengajuan(newPengajuan);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan formulir permohonan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Formulir Pengajuan Kenaikan Gaji Berkala (KGB)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Badan Pengawas Pemilihan Umum Kabupaten Subang · Layanan Digitalisasi Kepegawaian
        </p>
      </div>

      {/* Main Grid: Form on Left (7 cols), Information Guide on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM CONTAINER */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Auto-filled Badge Header */}
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sky-900 leading-relaxed">
              <span className="font-bold block text-sky-950">Data Otomatis Terhubung ke Database:</span>
              Kolom <strong>Nama Lengkap</strong>, <strong>No. HP / WhatsApp</strong>, dan <strong>Email Resmi</strong> terisi secara otomatis sesuai data kepegawaian Anda di database Bawaslu Subang.
            </div>

            {/* THREE AUTO-FILLED FIELDS AS REQUESTED */}
            <div className="space-y-3 pt-1">
              {/* Field 1: Nama Lengkap (Auto-filled) */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Nama Lengkap Pemohon (Terisi Otomatis)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={pegawai.nama}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700 cursor-not-allowed"
                />
                <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                  NIP: {pegawai.nip} · {pegawai.jabatan}
                </p>
              </div>

              {/* Field 2: No HP (Auto-filled) */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  No. HP / WhatsApp Pemohon (Terisi Otomatis)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={pegawai.noHp}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-medium text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Field 3: Email (Auto-filled) */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Email Pemohon (Terisi Otomatis)
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={pegawai.email}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono font-medium text-slate-700 cursor-not-allowed"
                />
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Notifikasi pembaruan status pengajuan akan dikirimkan secara real-time ke surel ini.
                </p>
              </div>
            </div>

            {/* Field Perihal */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Perihal Pengajuan *
              </label>
              <input
                type="text"
                required
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Contoh: Permohonan Kenaikan Gaji Berkala (KGB) Periode Oktober 2026"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Periode & TMT Baru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Periode Kenaikan Gaji *
                </label>
                <input
                  type="text"
                  required
                  value={periodeKgb}
                  onChange={(e) => setPeriodeKgb(e.target.value)}
                  placeholder="Oktober 2026"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  TMT KGB Yang Diajukan *
                </label>
                <input
                  type="date"
                  required
                  value={tmtKgbBaru}
                  onChange={(e) => setTmtKgbBaru(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* FILE UPLOAD SECTION AS SPECIFIED */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Unggah Berkas Lampiran Persyaratan
              </h3>

              {/* Upload 1: SK Kenaikan Pangkat Terakhir (WAJIB) */}
              <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                <label className="block font-semibold text-slate-800 mb-1">
                  1. Upload SK Kenaikan Pangkat Terakhir <span className="text-red-500 font-bold">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format PDF atau gambar scan yang telah dilegalisir / scan dokumen asli (Maks. 5 MB)
                </p>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setFileSkPangkat)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                {fileSkPangkat && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    File terpilih: {fileSkPangkat.name} ({(fileSkPangkat.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Upload 2: SK Gaji Berkala Terakhir (OPSIONAL) */}
              <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                <label className="block font-semibold text-slate-800 mb-1">
                  2. Upload SK Gaji Berkala Terakhir <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Wajib bagi pegawai yang sebelumnya telah pernah menerima kenaikan gaji berkala.
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setFileSkKgb)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                {fileSkKgb && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    File terpilih: {fileSkKgb.name} ({(fileSkKgb.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Upload 3: Dokumen Penilaian Prestasi Kerja Terakhir (WAJIB) */}
              <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                <label className="block font-semibold text-slate-800 mb-1">
                  3. Upload Dokumen Penilaian Prestasi Kerja (SKP) Terakhir <span className="text-red-500 font-bold">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Salinan SKP / Penilaian Kinerja dengan nilai minimal "Baik" yang telah ditandatangani pejabat penilai.
                </p>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setFileSkpPrestasi)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                {fileSkpPrestasi && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    File terpilih: {fileSkpPrestasi.name} ({(fileSkpPrestasi.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            {/* Catatan Pemohon */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Catatan Tambahan Pemohon (Opsional)
              </label>
              <textarea
                rows={2}
                value={catatanPemohon}
                onChange={(e) => setCatatanPemohon(e.target.value)}
                placeholder="Tuliskan keterangan tambahan bila ada dokumen yang diperbarui..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Mengirimkan Berkas...' : 'Kirim Permohonan KGB Sekarang'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* INFORMATION SECTION ACCORDION / TABS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="border-b border-slate-200 pb-2.5 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-600" />
                <span>Layanan Kenaikan Gaji Berkala (KGB) ASN</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bawaslu Kabupaten Subang · Standar Pelayanan Publik
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveInfoTab('dasar_hukum')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'dasar_hukum'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dasar Hukum
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('alur')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'alur'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Alur Layanan (9 Tahap)
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('persyaratan')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'persyaratan'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Persyaratan
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('waktu')}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeInfoTab === 'waktu'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Waktu &amp; Produk
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 text-xs leading-relaxed text-slate-700">
              {activeInfoTab === 'dasar_hukum' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                    DASAR HUKUM:
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Undang-Undang Nomor 25 Tahun 2009</strong> tentang Pelayanan Publik
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Undang-Undang Nomor 20 Tahun 2023</strong> tentang Aparatur Sipil Negara
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Peraturan Pemerintah Nomor 17 Tahun 2020</strong> tentang Perubahan atas Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>
                        <strong>Peraturan Pemerintah Nomor 5 Tahun 2024</strong> tentang Perubahan Kesembilanbelas atas Peraturan Pemerintah Nomor 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {activeInfoTab === 'alur' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <GitPullRequest className="h-3.5 w-3.5 text-sky-600" />
                    ALUR LAYANAN KENAIKAN GAJI BERKALA:
                  </p>
                  <ol className="space-y-2.5 border-l-2 border-slate-200 pl-3">
                    <li>
                      <span className="font-bold text-slate-900 block">1. Notifikasi H-30</span>
                      <p className="text-[11px] text-slate-600">Pegawai menerima Notifikasi Pengingat Kenaikan Gaji Berkala H-30.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">2. Verifikasi Data Usulan</span>
                      <p className="text-[11px] text-slate-600">Bagian Sumber Daya Manusia Bawaslu Subang memverifikasi data usulan.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">3. Pembuatan Usulan ke Bawaslu Provinsi</span>
                      <p className="text-[11px] text-slate-600">Bagian Sumber Daya Manusia Bawaslu Subang membuat usulan Kenaikan Gaji Berkala kepada Bawaslu Provinsi Jawa Barat.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">4. Pemrosesan Usulan</span>
                      <p className="text-[11px] text-slate-600">Bawaslu Provinsi Jawa Barat memproses usulan Kenaikan Gaji Berkala.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">5. Penerbitan SK KGB</span>
                      <p className="text-[11px] text-slate-600">Penerbitan SK KGB resmi.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">6. Pengiriman SK KGB</span>
                      <p className="text-[11px] text-slate-600">Pengiriman SK KGB yang telah ditandatangani oleh pejabat yang berwenang melalui Bagian SDM Bawaslu Subang untuk disampaikan kepada ASN yang bersangkutan.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">7. Penyampaian SK KGB</span>
                      <p className="text-[11px] text-slate-600">Penyampaian SK KGB kepada ASN.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">8. Pemberitahuan ke Bagian Keuangan</span>
                      <p className="text-[11px] text-slate-600">Pemberitahuan kepada Bagian Keuangan Bawaslu Subang untuk kemudian dilakukan sinkronisasi data KGB terbaru sebagai dasar penyesuaian pembayaran gaji.</p>
                    </li>
                    <li>
                      <span className="font-bold text-slate-900 block">9. Pembayaran Gaji</span>
                      <p className="text-[11px] text-slate-600">Pembayaran gaji sesuai dengan SK KGB terbaru.</p>
                    </li>
                  </ol>
                </div>
              )}

              {activeInfoTab === 'persyaratan' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    PERSYARATAN:
                  </p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">Sasaran Kinerja Pegawai (SKP) 2 tahun Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Nilai predikat kinerja minimal baik dalam kurun waktu 2 tahun.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">Surat Kenaikan Gaji Berkala Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Salinan SK KGB sebelumnya bila sudah pernah menerima kenaikan.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-slate-900">SK Kenaikan Pangkat Terakhir</strong>
                        <p className="text-[11px] text-slate-500">Salinan sah SK Pangkat terakhir yang telah dilegalisir / scan asli.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {activeInfoTab === 'waktu' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      WAKTU PELAYANAN:
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 font-mono">
                      7 (tujuh) Hari Kerja
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terhitung sejak berkas usulan diterima dan dinyatakan lengkap.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      PRODUK LAYANAN:
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      Surat Usulan Kenaikan Gaji Berkala
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                      BIAYA:
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-800">
                      Gratis (Rp 0,-)
                    </p>
                    <p className="text-[11px] text-emerald-700/80">
                      Seluruh pelayanan kepegawaian tidak dipungut biaya apa pun.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedPengajuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Permohonan KGB Berhasil Dikirimkan!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Nomor Registrasi: <span className="font-mono font-bold text-slate-900">{submittedPengajuan.noPengajuan}</span>
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Email tanda terima dan notifikasi real-time telah dikirimkan ke <strong>{submittedPengajuan.emailPemohon}</strong>. Berkas Anda akan segera diverifikasi oleh tim kepegawaian Bawaslu Subang.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => setPrintModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Tanda Terima</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedPengajuan(null);
                  onSuccessRedirect();
                }}
                className="w-full sm:w-auto rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Lihat Riwayat Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {submittedPengajuan && (
        <PrintDocumentModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          pengajuan={submittedPengajuan}
          pegawai={pegawai}
          mode="tanda_terima"
        />
      )}
    </div>
  );
};
