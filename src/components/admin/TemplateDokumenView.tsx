import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Printer,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Building2,
  Layers,
  FileCode,
  Tag,
  Stamp,
} from 'lucide-react';
import { TemplateDokumen, TemplateKategori, Pegawai, PengajuanKGB, KopSuratConfig, TandaTanganCapConfig } from '../../types';
import {
  getTemplatesList,
  saveTemplate,
  deleteTemplate,
  resetTemplatesToDefault,
  getKopSuratConfig,
  getTandaTanganCapConfig,
} from '../../services/storage';
import { BawasluLogo } from '../BawasluLogo';
import { KopSuratHeader } from '../KopSuratHeader';
import { KopSuratModal } from './KopSuratModal';
import { TandaTanganCapBlock } from '../TandaTanganCapBlock';
import { TandaTanganCapModal } from './TandaTanganCapModal';

interface TemplateDokumenViewProps {
  pegawaiList: Pegawai[];
  pengajuanList: PengajuanKGB[];
}

const KATEGORI_LABELS: Record<TemplateKategori, { label: string; color: string }> = {
  surat_pengantar: { label: 'Surat Pengantar', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sk_kgb: { label: 'SK / Pemberitahuan KGB', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  disposisi: { label: 'Lembar Disposisi', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  tanda_terima: { label: 'Tanda Terima', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  surat_keterangan: { label: 'Surat Keterangan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  lainnya: { label: 'Lainnya', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const VARIABLE_TAGS = [
  { tag: '{NAMA_PEGAWAI}', label: 'Nama Pegawai' },
  { tag: '{NIP}', label: 'NIP / NIK' },
  { tag: '{PANGKAT_GOLONGAN}', label: 'Pangkat & Golongan' },
  { tag: '{JABATAN}', label: 'Jabatan' },
  { tag: '{UNIT_KERJA}', label: 'Unit Kerja / Divisi' },
  { tag: '{TMT_KGB_BARU}', label: 'TMT KGB Baru' },
  { tag: '{GAJI_POKOK_LAMA}', label: 'Gaji Pokok Lama' },
  { tag: '{GAJI_POKOK_BARU}', label: 'Gaji Pokok Baru' },
  { tag: '{NOMOR_SURAT}', label: 'Nomor Surat' },
  { tag: '{TANGGAL_SURAT}', label: 'Tanggal Surat (Format Indonesia)' },
  { tag: '{NAMA_PEJABAT}', label: 'Nama Penandatangan' },
  { tag: '{JABATAN_PEJABAT}', label: 'Jabatan Penandatangan' },
  { tag: '{NIP_PEJABAT}', label: 'NIP Penandatangan' },
  { tag: '{TAHUN}', label: 'Tahun Berjalan' },
  { tag: '{BULAN}', label: 'Bulan Berjalan' },
];

export const TemplateDokumenView: React.FC<TemplateDokumenViewProps> = ({
  pegawaiList,
  pengajuanList,
}) => {
  const [templates, setTemplates] = useState<TemplateDokumen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');

  // Modal Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDokumen | null>(null);

  // Form fields
  const [formNama, setFormNama] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formKategori, setFormKategori] = useState<TemplateKategori>('surat_pengantar');
  const [formFormatNomor, setFormFormatNomor] = useState('045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}');
  const [formJudulDokumen, setFormJudulDokumen] = useState('');
  const [formIsiKonten, setFormIsiKonten] = useState('');
  const [formPejabatNama, setFormPejabatNama] = useState('H. TATANG KOSWARA, S.Sos., M.Si');
  const [formPejabatJabatan, setFormPejabatJabatan] = useState('Kepala Sekretariat Bawaslu Kabupaten Subang');
  const [formPejabatNip, setFormPejabatNip] = useState('197405121998031002');
  const [formTembusan, setFormTembusan] = useState<string>('');

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDokumen | null>(null);
  const [samplePegawaiId, setSamplePegawaiId] = useState<string>('');

  // Kop Surat Settings Modal state
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(getKopSuratConfig());

  // Tanda Tangan & Cap Modal state
  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [ttdCapConfig, setTtdCapConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());

  const loadTemplates = async () => {
    const list = await getTemplatesList();
    setTemplates(list);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Set default sample pegawai for preview
  useEffect(() => {
    if (pegawaiList.length > 0 && !samplePegawaiId) {
      setSamplePegawaiId(pegawaiList[0].id);
    }
  }, [pegawaiList, samplePegawaiId]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormNama('');
    setFormDeskripsi('');
    setFormKategori('surat_pengantar');
    setFormFormatNomor('045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}');
    setFormJudulDokumen('SURAT DINAS RESMI');
    setFormIsiKonten(`Dengan ini disampaikan kelengkapan berkas usulan Kenaikan Gaji Berkala (KGB) untuk pegawai:\n\nNama: {NAMA_PEGAWAI}\nNIP: {NIP}\nJabatan: {JABATAN}\nUnit Kerja: {UNIT_KERJA}\n\nDemikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`);
    setFormPejabatNama('H. TATANG KOSWARA, S.Sos., M.Si');
    setFormPejabatJabatan('Kepala Sekretariat Bawaslu Kabupaten Subang');
    setFormPejabatNip('197405121998031002');
    setFormTembusan('1. Ketua Bawaslu Kabupaten Subang\n2. Arsip Kepegawaian');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (t: TemplateDokumen) => {
    setEditingTemplate(t);
    setFormNama(t.nama);
    setFormDeskripsi(t.deskripsi);
    setFormKategori(t.kategori);
    setFormFormatNomor(t.formatNomor);
    setFormJudulDokumen(t.judulDokumen);
    setFormIsiKonten(t.isiKonten);
    setFormPejabatNama(t.penandatanganNama);
    setFormPejabatJabatan(t.penandatanganJabatan);
    setFormPejabatNip(t.penandatanganNip);
    setFormTembusan((t.tembusan || []).join('\n'));
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (t: TemplateDokumen) => {
    const duplicated: TemplateDokumen = {
      ...t,
      id: `tmpl-${Date.now()}`,
      nama: `${t.nama} (Salinan)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTemplate(duplicated);
    await loadTemplates();
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus template "${nama}"?`)) {
      await deleteTemplate(id);
      await loadTemplates();
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Yakin ingin mereset daftar template ke template standar bawaan Bawaslu Subang?')) {
      await resetTemplatesToDefault();
      await loadTemplates();
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formIsiKonten.trim()) {
      alert('Nama Template dan Isi Konten wajib diisi!');
      return;
    }

    const payload: TemplateDokumen = {
      id: editingTemplate?.id || `tmpl-${Date.now()}`,
      nama: formNama.trim(),
      deskripsi: formDeskripsi.trim() || 'Template dokumen resmi Bawaslu Subang',
      kategori: formKategori,
      formatNomor: formFormatNomor.trim() || '045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}',
      judulDokumen: formJudulDokumen.trim() || 'SURAT PEMBERITAHUAN',
      isiKonten: formIsiKonten.trim(),
      penandatanganNama: formPejabatNama.trim(),
      penandatanganJabatan: formPejabatJabatan.trim(),
      penandatanganNip: formPejabatNip.trim(),
      tembusan: formTembusan
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isDefault: editingTemplate ? editingTemplate.isDefault : false,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTemplate(payload);
    await loadTemplates();
    setIsEditorOpen(false);
  };

  const insertVariableTag = (tag: string) => {
    setFormIsiKonten((prev) => prev + (prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ') + tag);
  };

  // Helper to render template variables with real sample data
  const renderDocumentText = (template: TemplateDokumen, selectedPegawai?: Pegawai) => {
    const p = selectedPegawai || (pegawaiList.length > 0 ? pegawaiList[0] : null);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const nomorSurat = template.formatNomor
      .replace('{BULAN}', String(now.getMonth() + 1))
      .replace('{TAHUN}', String(now.getFullYear()));

    if (!p) {
      return {
        nomorSurat,
        renderedContent: template.isiKonten,
        tanggalFormatted: dateFormatted,
      };
    }

    const gajiLama = p.gajiPokokTerakhir
      ? p.gajiPokokTerakhir.toLocaleString('id-ID')
      : '3.820.000';
    const gajiBaru = p.gajiPokokTerakhir
      ? (p.gajiPokokTerakhir + 160000).toLocaleString('id-ID')
      : '3.980.000';

    let content = template.isiKonten;
    content = content.replace(/\{NAMA_PEGAWAI\}/g, p.nama);
    content = content.replace(/\{NIP\}/g, p.nip);
    content = content.replace(/\{PANGKAT_GOLONGAN\}/g, p.golonganPangkat || 'Penata Muda / III/a');
    content = content.replace(/\{JABATAN\}/g, p.jabatan || 'Analis Kepegawaian');
    content = content.replace(/\{UNIT_KERJA\}/g, p.bagianDivisi || 'Sekretariat Bawaslu Kabupaten Subang');
    content = content.replace(/\{TMT_KGB_BARU\}/g, p.jadwalKgbBerikutnya || now.toISOString().split('T')[0]);
    content = content.replace(/\{GAJI_POKOK_LAMA\}/g, gajiLama);
    content = content.replace(/\{GAJI_POKOK_BARU\}/g, gajiBaru);
    content = content.replace(/\{NOMOR_SURAT\}/g, nomorSurat);
    content = content.replace(/\{TANGGAL_SURAT\}/g, dateFormatted);
    content = content.replace(/\{NAMA_PEJABAT\}/g, template.penandatanganNama);
    content = content.replace(/\{JABATAN_PEJABAT\}/g, template.penandatanganJabatan);
    content = content.replace(/\{NIP_PEJABAT\}/g, template.penandatanganNip);
    content = content.replace(/\{TAHUN\}/g, String(now.getFullYear()));
    content = content.replace(/\{BULAN\}/g, String(now.getMonth() + 1));

    return {
      nomorSurat,
      renderedContent: content,
      tanggalFormatted: dateFormatted,
    };
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.judulDokumen.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = kategoriFilter === 'ALL' || t.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  const activeSamplePegawai = pegawaiList.find((p) => p.id === samplePegawaiId) || pegawaiList[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Kelola Template Dokumen Dinas
                </h1>
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                  {templates.length} Template
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi format naskah dinas, surat pengantar ke Bawaslu Provinsi, petikan SK KGB, dan lembar telaah verifikasi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsKopModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Atur Nama Instansi, Alamat, dan Logo Kop Surat"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              <span>Atur Kop Surat</span>
            </button>

            <button
              onClick={() => setIsTtdModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition"
              title="Atur Tanda Tangan Digital & Cap Stempel Dinas Resmi"
            >
              <Stamp className="h-3.5 w-3.5 text-purple-700" />
              <span>Atur TTD &amp; Cap</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Reset ke template standar bawaan Bawaslu Subang"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Buat Template Baru</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tags Info Box */}
        <div className="mt-4 rounded-lg bg-sky-50/80 border border-sky-200 p-3 text-xs text-sky-950 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-sky-900">Mendukung Tag Variabel Dinamis Otomatis:</span>
            <p className="text-sky-800 mt-0.5">
              Gunakan tanda kurung kurawal seperti <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;NAMA_PEGAWAI&#125;</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;NIP&#125;</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;TMT_KGB_BARU&#125;</code>, dan <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">&#123;GAJI_POKOK_BARU&#125;</code> di dalam isi dokumen. Sistem akan mengisinya secara otomatis saat dokumen dicetak.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama template, judul dokumen, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-900 focus:outline-none shadow-2xs"
          >
            <option value="ALL">Semua Kategori Template</option>
            <option value="surat_pengantar">Surat Pengantar</option>
            <option value="sk_kgb">SK / Pemberitahuan KGB</option>
            <option value="disposisi">Lembar Disposisi</option>
            <option value="tanda_terima">Tanda Terima</option>
            <option value="surat_keterangan">Surat Keterangan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
            <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada template dokumen yang sesuai dengan pencarian.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Silakan buat template baru atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          filteredTemplates.map((item) => {
            const kategoriInfo = KATEGORI_LABELS[item.kategori] || KATEGORI_LABELS.lainnya;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-[10px] font-bold border ${kategoriInfo.color}`}>
                      {kategoriInfo.label}
                    </span>
                    {item.isDefault && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Default Bawaslu
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.nama}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.deskripsi}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Format Nomor:</span>
                      <span className="font-mono text-slate-900 font-semibold">{item.formatNomor}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Penandatangan:</span>
                      <span className="text-slate-900 font-semibold truncate max-w-[200px]" title={item.penandatanganNama}>
                        {item.penandatanganNama}
                      </span>
                    </div>
                  </div>

                  {/* Snippet preview */}
                  <div className="mt-3 rounded-lg bg-white border border-slate-200 p-2 text-[10px] text-slate-600 font-mono line-clamp-3 whitespace-pre-line leading-relaxed">
                    {item.isiKonten}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(item)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-sky-600" />
                    <span>Pratinjau &amp; Uji Cetak</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Duplikasi Template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      title="Ubah Template"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!item.isDefault && (
                      <button
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Hapus Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL EDITOR TEMPLATE ================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-5 w-5 text-slate-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTemplate ? 'Ubah Template Dokumen' : 'Buat Template Dokumen Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan judul, isi naskah, format penomoran, dan pejabat penandatangan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Template */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nama Template Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Surat Pengantar Usulan KGB ke Bawaslu Provinsi Jawa Barat"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Kategori Dokumen *
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as TemplateKategori)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="surat_pengantar">Surat Pengantar (ke Provinsi / Instansi)</option>
                    <option value="sk_kgb">SK / Surat Pemberitahuan KGB</option>
                    <option value="disposisi">Lembar Telaah Verifikasi / Disposisi</option>
                    <option value="tanda_terima">Tanda Terima Pengajuan Berkas</option>
                    <option value="surat_keterangan">Surat Keterangan Kinerja</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Format Nomor Surat */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Format Nomor Surat *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFormatNomor}
                    onChange={(e) => setFormFormatNomor(e.target.value)}
                    placeholder="045.2/KP.04.00/JB-22/{BULAN}/{TAHUN}"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Judul Dokumen Naskah */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Judul Naskah (Huruf Kapital pada Lembar Surat) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudulDokumen}
                    onChange={(e) => setFormJudulDokumen(e.target.value)}
                    placeholder="SURAT PENGANTAR USULAN KENAIKAN GAJI BERKALA"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Deskripsi Ringkas
                  </label>
                  <input
                    type="text"
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    placeholder="Penjelasan fungsi dan peruntukan template surat ini..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Variables Selector Panel */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-900">
                    Klik Tag untuk Menyisipkan Variabel Otomatis ke Isi Surat:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_TAGS.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariableTag(item.tag)}
                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-mono text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-900 transition shadow-2xs"
                      title={`Sisipkan ${item.label}`}
                    >
                      <Plus className="h-3 w-3 text-indigo-500" />
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Isi Konten */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Isi Konten Naskah Dokumen *
                </label>
                <textarea
                  rows={10}
                  required
                  value={formIsiKonten}
                  onChange={(e) => setFormIsiKonten(e.target.value)}
                  placeholder="Tuliskan naskah surat di sini. Gunakan tag variabel untuk data dinamis..."
                  className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Pejabat Penandatangan */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="font-bold text-slate-900 block">
                  Informasi Pejabat Penandatangan Surat
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatNama}
                      onChange={(e) => setFormPejabatNama(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatJabatan}
                      onChange={(e) => setFormPejabatJabatan(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      NIP Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={formPejabatNip}
                      onChange={(e) => setFormPejabatNip(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tembusan */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Tembusan Surat (Satu baris per tujuan tembusan)
                </label>
                <textarea
                  rows={3}
                  value={formTembusan}
                  onChange={(e) => setFormTembusan(e.target.value)}
                  placeholder="1. Ketua Bawaslu Kabupaten Subang&#10;2. Arsip Kepegawaian"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800 transition shadow"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Simpan Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PRATINJAU & UJI CETAK DOKUMEN ================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[96vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Top Bar with Sample Employee Picker & Print Button */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-700" />
                <span className="font-bold text-slate-900 text-xs">
                  Pratinjau Naskah: {previewTemplate.nama}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Employee Simulator Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-[11px] font-medium text-slate-500">Uji Data:</span>
                  <select
                    value={samplePegawaiId}
                    onChange={(e) => setSamplePegawaiId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none"
                  >
                    {pegawaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} (NIP. {p.nip})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsKopModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Ubah Kop Surat"
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ubah Kop</span>
                </button>

                <button
                  onClick={() => setIsTtdModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition"
                  title="Ubah Tanda Tangan Digital & Cap Stempel Dinas"
                >
                  <Stamp className="h-3.5 w-3.5 text-purple-700" />
                  <span>Ubah TTD &amp; Cap</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
              <div className="mx-auto max-w-[210mm] bg-white p-8 sm:p-12 shadow border border-slate-200 text-slate-900 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none">
                {/* KOP SURAT RESMI DINAMIS */}
                <KopSuratHeader config={kopConfig} />

                {/* JUDUL DOKUMEN & NOMOR */}
                {(() => {
                  const rendered = renderDocumentText(previewTemplate, activeSamplePegawai);
                  return (
                    <div className="space-y-6 text-xs text-slate-900">
                      <div className="text-center mb-6">
                        <h4 className="font-bold underline text-sm uppercase tracking-wide">
                          {previewTemplate.judulDokumen}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          Nomor: {rendered.nomorSurat}
                        </p>
                      </div>

                      {/* ISI KONTEN TERRENDER */}
                      <div className="whitespace-pre-line leading-relaxed text-justify space-y-3 font-sans">
                        {rendered.renderedContent}
                      </div>

                      {/* TANDA TANGAN */}
                      <div className="mt-12 flex justify-end">
                        <TandaTanganCapBlock
                          config={ttdCapConfig}
                          tanggalText={rendered.tanggalFormatted}
                          customNamaPejabat={previewTemplate.penandatanganNama}
                          customJabatan={previewTemplate.penandatanganJabatan}
                          customNip={previewTemplate.penandatanganNip}
                          align="right"
                        />
                      </div>

                      {/* TEMBUSAN */}
                      {previewTemplate.tembusan && previewTemplate.tembusan.length > 0 && (
                        <div className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-700">
                          <span className="font-semibold block mb-1">Tembusan Yth:</span>
                          <ol className="list-decimal pl-4 space-y-0.5">
                            {previewTemplate.tembusan.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KOP SURAT CONFIGURATION MODAL */}
      <KopSuratModal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        onSaved={(newCfg) => setKopConfig(newCfg)}
      />

      {/* TANDA TANGAN & CAP CONFIGURATION MODAL */}
      <TandaTanganCapModal
        isOpen={isTtdModalOpen}
        onClose={() => setIsTtdModalOpen(false)}
        onSaved={(newCfg) => setTtdCapConfig(newCfg)}
      />
    </div>
  );
};
