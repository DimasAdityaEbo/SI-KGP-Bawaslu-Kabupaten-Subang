import React, { useRef, useState } from 'react';
import { X, Printer, Download, CheckCircle2, Building2, Stamp } from 'lucide-react';
import { PengajuanKGB, Pegawai, KopSuratConfig, TandaTanganCapConfig } from '../types';
import { getKopSuratConfig, getTandaTanganCapConfig } from '../services/storage';
import { BawasluLogo } from './BawasluLogo';
import { KopSuratHeader } from './KopSuratHeader';
import { KopSuratModal } from './admin/KopSuratModal';
import { TandaTanganCapBlock } from './TandaTanganCapBlock';
import { TandaTanganCapModal } from './admin/TandaTanganCapModal';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengajuan: PengajuanKGB;
  pegawai?: Pegawai;
  mode: 'disposisi' | 'sk_kgb' | 'tanda_terima';
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  pengajuan,
  pegawai,
  mode,
}) => {
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [ttdCapConfig, setTtdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());
  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0,-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Printer className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              {mode === 'sk_kgb'
                ? 'Pratinjau Cetak Surat Rekomendasi/Pemberitahuan KGB'
                : mode === 'disposisi'
                ? 'Pratinjau Lembar Disposisi Verifikasi KGB'
                : 'Pratinjau Tanda Terima Berkas Digital'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKopModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              <span>Atur Kop</span>
            </button>
            <button
              onClick={() => setIsTtdModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition"
              title="Atur Tanda Tangan Digital & Cap Stempel Dinas Resmi"
            >
              <Stamp className="h-3.5 w-3.5 text-purple-700" />
              <span>Atur TTD &amp; Cap</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/70">
          <div className="mx-auto max-w-[210mm] bg-white p-8 sm:p-12 shadow border border-slate-200 text-slate-900 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none">
            {/* KOP SURAT RESMI DINAMIS */}
            <KopSuratHeader config={kopConfig} />

            {/* DOCUMENT CONTENT DEPENDING ON MODE */}
            {mode === 'sk_kgb' && (
              <div>
                <div className="text-center mb-6">
                  <h4 className="font-bold underline text-sm uppercase tracking-wide">
                    SURAT PEMBERITAHUAN KENAIKAN GAJI BERKALA
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Nomor: {pengajuan.nomorSkKgbDiterbitkan || '045.2/KP.04.00/JB-22/10/2026'}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <p>
                    Dengan ini diberitahukan bahwa berhubung telah dipenuhinya masa kerja dan syarat-syarat lainnya kepada:
                  </p>

                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-48 py-1.5 text-slate-700 font-medium">1. Nama Pegawai</td>
                        <td className="py-1.5 font-bold text-slate-950">: {pengajuan.namaPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">2. NIP / NIK</td>
                        <td className="py-1.5 font-mono text-slate-950">: {pengajuan.nipPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">3. Pangkat / Golongan</td>
                        <td className="py-1.5 text-slate-950">: {pegawai?.golonganPangkat || 'Penata Muda / III/a'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">4. Jabatan</td>
                        <td className="py-1.5 text-slate-950">: {pengajuan.jabatanPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">5. Unit Kerja / Divisi</td>
                        <td className="py-1.5 text-slate-950">: {pengajuan.divisiPemohon}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">6. Gaji Pokok Lama</td>
                        <td className="py-1.5 font-mono text-slate-950">: {formatRupiah(pengajuan.gajiLama)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="pt-2 font-semibold">
                    Diberikan Kenaikan Gaji Berkala hingga memperoleh:
                  </p>

                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-48 py-1.5 text-slate-700 font-medium">7. Gaji Pokok Baru</td>
                        <td className="py-1.5 font-bold font-mono text-emerald-800">: {formatRupiah(pengajuan.gajiBaruEstimasi)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">8. Berdasarkan Masa Kerja</td>
                        <td className="py-1.5 text-slate-950">: 2 (Dua) Tahun 0 Bulan</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">9. Terhitung Mulai Tanggal (TMT)</td>
                        <td className="py-1.5 font-bold text-slate-950">: {pengajuan.tmtKgbBaru}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-700 font-medium">10. Kenaikan Gaji Berikutnya</td>
                        <td className="py-1.5 text-slate-950">: 2 (Dua) Tahun yang akan datang</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="pt-2 leading-relaxed">
                    Diharapkan kepada Pegawai yang bersangkutan agar senantiasa meningkatkan kinerja, dedikasi, serta integritas dalam pelaksanaan tugas pengawasan Pemilihan Umum di lingkungan Bawaslu Kabupaten Subang.
                  </p>

                  {/* Signatures */}
                  <div className="pt-8 flex justify-end">
                    <TandaTanganCapBlock
                      config={ttdCapConfig}
                      tanggalText={pengajuan.tanggalSkDiterbitkan || '04 Oktober 2026'}
                      align="right"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'disposisi' && (
              <div>
                <div className="text-center mb-6">
                  <h4 className="font-bold underline text-sm uppercase tracking-wide">
                    LEMBAR VERIFIKASI & DISPOSISI PENGAJUAN KGB
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    No. Registrasi: {pengajuan.noPengajuan}
                  </p>
                </div>

                <table className="w-full border border-slate-300 text-xs mb-4">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 bg-slate-50 font-semibold w-40 border-r border-slate-300">Nama Pemohon</td>
                      <td className="p-2 font-bold">{pengajuan.namaPemohon}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 bg-slate-50 font-semibold border-r border-slate-300">NIP / Jabatan</td>
                      <td className="p-2 font-mono">{pengajuan.nipPemohon} / {pengajuan.jabatanPemohon}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 bg-slate-50 font-semibold border-r border-slate-300">Tanggal Pengajuan</td>
                      <td className="p-2">{new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 bg-slate-50 font-semibold border-r border-slate-300">Kelengkapan Berkas</td>
                      <td className="p-2 space-y-1">
                        <div>✓ SK Pangkat Terakhir ({pengajuan.skPangkatTerakhir.namaFile})</div>
                        <div>✓ SKP Penilaian Prestasi Kerja ({pengajuan.dokumenSkpPrestasi.namaFile})</div>
                        {pengajuan.skGajiBerkalaTerakhir && (
                          <div>✓ SK KGB Terakhir ({pengajuan.skGajiBerkalaTerakhir.namaFile})</div>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 bg-slate-50 font-semibold border-r border-slate-300">Status Verifikasi</td>
                      <td className="p-2 font-bold uppercase text-slate-900">
                        {pengajuan.status === 'dikirim_ke_provinsi'
                          ? 'BERKAS DIKIRIM KE BAWASLU PROVINSI'
                          : pengajuan.status.replace(/_/g, ' ')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-semibold border-r border-slate-300">Catatan Petugas</td>
                      <td className="p-2 italic text-slate-800">
                        {pengajuan.catatanVerifikator || 'Seluruh berkas persyaratan telah divalidasi dan memenuhi kriteria regulasi.'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 grid grid-cols-2 gap-4 items-end text-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">Petugas Verifikator Kepegawaian</p>
                    <div className="h-16 flex items-center justify-center text-slate-400 italic">
                      [Tervalidasi Sistem]
                    </div>
                    <p className="font-bold underline">{pengajuan.diverifikasiOleh || 'Staf Sub Bagian Administrasi'}</p>
                    <p className="font-mono text-[10px] text-slate-500">Staf Kepegawaian Bawaslu</p>
                  </div>
                  <div>
                    <TandaTanganCapBlock
                      config={ttdCapConfig}
                      isCompact={true}
                      align="center"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'tanda_terima' && (
              <div>
                <div className="text-center mb-6">
                  <h4 className="font-bold underline text-sm uppercase tracking-wide">
                    BUKTI TANDA TERIMA PENGAJUAN KGB ELEKTRONIK
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    SI-KGB BAWASLU KABUPATEN SUBANG
                  </p>
                </div>

                <div className="border border-slate-300 p-4 rounded-lg text-xs space-y-3 mb-6 bg-slate-50/50">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Nomor Registrasi:</span>
                    <span className="font-bold font-mono">{pengajuan.noPengajuan}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Nama Pemohon:</span>
                    <span className="font-bold">{pengajuan.namaPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">NIP:</span>
                    <span className="font-mono">{pengajuan.nipPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Divisi / Unit Kerja:</span>
                    <span>{pengajuan.divisiPemohon}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Perihal:</span>
                    <span>{pengajuan.perihal}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Waktu Pengajuan:</span>
                    <span>{new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estimasi Selesai Verifikasi:</span>
                    <span className="font-semibold text-slate-800">7 (tujuh) Hari Kerja</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed text-center">
                  Simpan tanda terima digital ini sebagai referensi resmi pemantauan proses kenaikan gaji berkala Anda. Anda juga akan menerima pembaruan status berkala melalui pos-el ke <strong>{pengajuan.emailPemohon}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KOP SURAT MODAL */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        onSaved={(newCfg) => setKopConfig(newCfg)}
      />

      {/* TANDA TANGAN & CAP MODAL */}
      <TandaTanganCapModal
        isOpen={isTtdModalOpen}
        onClose={() => setIsTtdModalOpen(false)}
        onSaved={(newCfg) => setTtdCapConfig(newCfg)}
      />
    </div>
  );
};
