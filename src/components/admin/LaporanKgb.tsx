import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { PengajuanKGB, Pegawai } from '../../types';
import { DIVISI_OPTIONS } from '../../data/seedData';
import { BawasluLogo } from '../BawasluLogo';

interface LaporanKgbProps {
  pengajuanList: PengajuanKGB[];
  pegawaiList: Pegawai[];
}

export const LaporanKgb: React.FC<LaporanKgbProps> = ({ pengajuanList, pegawaiList }) => {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [filterDivisi, setFilterDivisi] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Filtered dataset
  const filteredData = pengajuanList.filter((item) => {
    const itemDate = item.tanggalPengajuan.split('T')[0];
    const matchDate = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    const matchDivisi = filterDivisi === 'ALL' || item.divisiPemohon === filterDivisi;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchDate && matchDivisi && matchStatus;
  });

  const countTotal = filteredData.length;
  const countApproved = filteredData.filter((i) => i.status === 'disetujui').length;
  const countPending = filteredData.filter((i) => i.status === 'menunggu_verifikasi').length;
  const countRevision = filteredData.filter((i) => i.status === 'perlu_perbaikan').length;

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No. Registrasi',
      'Nama Pemohon',
      'NIP',
      'Jabatan',
      'Divisi / Unit Kerja',
      'Periode KGB',
      'TMT KGB',
      'Status',
      'Nomor SK Diterbitkan',
      'Tanggal Pengajuan',
    ];

    const rows = filteredData.map((d) => [
      `"${d.noPengajuan}"`,
      `"${d.namaPemohon}"`,
      `"'${d.nipPemohon}"`,
      `"${d.jabatanPemohon}"`,
      `"${d.divisiPemohon}"`,
      `"${d.periodeKgb}"`,
      `"${d.tmtKgbBaru}"`,
      `"${d.status.toUpperCase()}"`,
      `"${d.nomorSkKgbDiterbitkan || '-'}"`,
      `"${new Date(d.tanggalPengajuan).toLocaleDateString('id-ID')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_KGB_Bawaslu_Subang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Laporan Kenaikan Gaji Berkala (KGB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi berkas, penyerapan berkas per divisi, serta ekspor dokumen dan cetak rekap resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Bagian / Divisi
          </label>
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Bagian / Divisi</option>
            {DIVISI_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Status Pengajuan
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="disetujui">Disetujui (SK Terbit)</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-[11px] text-slate-500 font-semibold">Total Berkas Masuk</p>
          <p className="font-mono-numbers text-xl font-bold text-slate-900 mt-1">{countTotal}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <p className="text-[11px] text-emerald-800 font-semibold">Telah Disetujui</p>
          <p className="font-mono-numbers text-xl font-bold text-emerald-950 mt-1">{countApproved}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-[11px] text-amber-800 font-semibold">Menunggu Verifikasi</p>
          <p className="font-mono-numbers text-xl font-bold text-amber-950 mt-1">{countPending}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 text-center">
          <p className="text-[11px] text-orange-800 font-semibold">Perbaikan Dokumen</p>
          <p className="font-mono-numbers text-xl font-bold text-orange-950 mt-1">{countRevision}</p>
        </div>
      </div>

      {/* REPORT CONTENT & PRINTABLE CONTAINER */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead */}
        <div className="flex items-center border-b-[3px] border-double border-slate-900 pb-4 mb-6">
          <div className="w-16 shrink-0 flex justify-center">
            <BawasluLogo size="md" showText={false} />
          </div>
          <div className="flex-1 text-center pr-8">
            <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-slate-800">
              BADAN PENGAWAS PEMILIHAN UMUM
            </h3>
            <h2 className="font-serif text-base font-bold tracking-wide uppercase text-slate-950">
              KABUPATEN SUBANG
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Jl. Veteran No. 12, Kel. Dangdeur, Kec. Subang, Kabupaten Subang, Jawa Barat 41211
            </p>
            <p className="text-[9px] text-slate-500 font-mono">
              Sistem Informasi Pelayanan Kenaikan Gaji Berkala (SI-KGB) · Subang, Jawa Barat
            </p>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center mb-6">
          <h4 className="font-bold text-sm uppercase text-slate-900 tracking-wide">
            REKAPITULASI PELAYANAN PENGAJUAN KENAIKAN GAJI BERKALA (KGB)
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Periode: {startDate} s/d {endDate} {filterDivisi !== 'ALL' ? `· Bagian: ${filterDivisi}` : ''}
          </p>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase">
                <th className="py-2.5 px-3 border border-slate-200 text-center w-10">No</th>
                <th className="py-2.5 px-3 border border-slate-200">No. Registrasi</th>
                <th className="py-2.5 px-3 border border-slate-200">Nama Pegawai &amp; NIP</th>
                <th className="py-2.5 px-3 border border-slate-200">Divisi / Unit Kerja</th>
                <th className="py-2.5 px-3 border border-slate-200">TMT KGB</th>
                <th className="py-2.5 px-3 border border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3 border border-slate-200">No. SK / Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan pengajuan pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((d, index) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 print-break-inside-avoid">
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono font-semibold text-slate-900">
                      {d.noPengajuan}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200">
                      <p className="font-bold text-slate-900">{d.namaPemohon}</p>
                      <p className="font-mono text-[10px] text-slate-500">NIP. {d.nipPemohon}</p>
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-slate-700">
                      {d.divisiPemohon}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono">
                      {d.tmtKgbBaru}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center">
                      <span className="font-semibold uppercase text-[10px]">
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 font-mono text-[11px]">
                      {d.nomorSkKgbDiterbitkan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Block (Printable) */}
        <div className="mt-12 flex justify-end print-break-inside-avoid">
          <div className="text-center w-64 text-xs">
            <p className="text-slate-600">Subang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-semibold text-slate-900 mt-1">Kepala Sekretariat Bawaslu<br />Kabupaten Subang</p>
            <div className="h-16 flex items-center justify-center text-slate-400 italic">
              [Tanda Tangan &amp; Cap Basah]
            </div>
            <p className="font-bold underline text-slate-950">H. TATANG KOSWARA, S.Sos., M.Si</p>
            <p className="text-[11px] font-mono text-slate-600">NIP. 197405121998031002</p>
          </div>
        </div>
      </div>
    </div>
  );
};
