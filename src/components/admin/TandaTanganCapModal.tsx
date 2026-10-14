import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Trash2,
  Eye,
  Info,
  PenTool,
  Stamp,
  Eraser,
  Sparkles,
  Layers,
  Palette,
} from 'lucide-react';
import { TandaTanganCapConfig } from '../../types';
import {
  getTandaTanganCapConfig,
  saveTandaTanganCapConfig,
  resetTandaTanganCapConfig,
  DEFAULT_TTD_CAP,
} from '../../services/storage';
import {
  DEFAULT_CAP_BAWASLU_SVG,
  DEFAULT_TANDA_TANGAN_SVG,
} from '../../data/defaultSignatureAssets';
import { TandaTanganCapBlock } from '../TandaTanganCapBlock';

interface TandaTanganCapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: TandaTanganCapConfig) => void;
}

export const TandaTanganCapModal: React.FC<TandaTanganCapModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<TandaTanganCapConfig>(getTandaTanganCapConfig());
  const [activeTab, setActiveTab] = useState<'ttd' | 'cap' | 'pejabat'>('ttd');
  const [ttdInputMode, setTtdInputMode] = useState<'upload' | 'draw' | 'preset'>('upload');
  
  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1d4ed8'); // Blue pen default
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);

  // File input refs
  const ttdFileRef = useRef<HTMLInputElement | null>(null);
  const capFileRef = useRef<HTMLInputElement | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getTandaTanganCapConfig();
      setConfig(current);
      setNotificationMsg(null);
    }
  }, [isOpen]);

  // Setup drawing canvas when entering 'draw' mode
  useEffect(() => {
    if (activeTab === 'ttd' && ttdInputMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }
  }, [activeTab, ttdInputMode, penColor, penWidth]);

  if (!isOpen) return null;

  // Handle Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export canvas as transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    setConfig((prev) => ({
      ...prev,
      tandaTanganUrl: dataUrl,
      tampilkanTandaTangan: true,
    }));
    setNotificationMsg('Tanda tangan digital berhasil diterapkan dari goresan kanvas!');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Handle File Uploads (Signature & Stamp)
  const handleUploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'ttd' | 'cap'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 3MB untuk menjaga performa cetak.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      if (target === 'ttd') {
        setConfig((prev) => ({
          ...prev,
          tandaTanganUrl: base64,
          tampilkanTandaTangan: true,
        }));
        setNotificationMsg('Gambar tanda tangan berhasil diunggah.');
      } else {
        setConfig((prev) => ({
          ...prev,
          capUrl: base64,
          tampilkanCap: true,
        }));
        setNotificationMsg('Gambar cap / stempel dinas berhasil diunggah.');
      }
      setTimeout(() => setNotificationMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUsePresetTtd = () => {
    setConfig((prev) => ({
      ...prev,
      tandaTanganUrl: DEFAULT_TANDA_TANGAN_SVG,
      tampilkanTandaTangan: true,
    }));
    setNotificationMsg('Tanda tangan standar resmi Bawaslu berhasil dipilih.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleUsePresetCap = () => {
    setConfig((prev) => ({
      ...prev,
      capUrl: DEFAULT_CAP_BAWASLU_SVG,
      tampilkanCap: true,
    }));
    setNotificationMsg('Cap resmi Bawaslu Kabupaten Subang berhasil dipilih.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleResetToDefault = () => {
    if (confirm('Yakin ingin mereset pengaturan tanda tangan & cap ke standar Bawaslu Subang?')) {
      const res = resetTandaTanganCapConfig();
      setConfig(res);
      setNotificationMsg('Pengaturan telah direset ke bawaan resmi Bawaslu Subang.');
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleSave = () => {
    const saved = saveTandaTanganCapConfig(config);
    if (onSaved) onSaved(saved);
    setNotificationMsg('Pengaturan tanda tangan & cap berhasil disimpan!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Stamp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Pengaturan Tanda Tangan &amp; Cap Dinas Resmi</span>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                  Naskah Dinas
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Kelola tanda tangan digital, cap stempel basah Bawaslu, posisi tumpang-tindih, dan data pejabat penandatangan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notificationMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Body Grid: Left Controls & Right Real-Time Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-1">
              <button
                onClick={() => setActiveTab('ttd')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'ttd'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>1. Tanda Tangan</span>
                {config.tampilkanTandaTangan && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('cap')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'cap'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stamp className="h-3.5 w-3.5" />
                <span>2. Cap / Stempel Dinas</span>
                {config.tampilkanCap && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('pejabat')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'pejabat'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>3. Data Pejabat</span>
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* TAB 1: TANDA TANGAN */}
              {activeTab === 'ttd' && (
                <div className="space-y-5">
                  {/* Toggle Active */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aktifkan Tanda Tangan pada Dokumen</p>
                      <p className="text-[11px] text-slate-500">
                        Jika dimatikan, tanda tangan akan berupa teks nama kosong untuk ditandatangani manual.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tampilkanTandaTangan}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, tampilkanTandaTangan: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Mode Selector: Upload, Draw, Preset */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Metode Input Tanda Tangan:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTtdInputMode('upload')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition ${
                          ttdInputMode === 'upload'
                            ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Gambar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTtdInputMode('draw')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition ${
                          ttdInputMode === 'draw'
                            ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <PenTool className="h-4 w-4" />
                        <span>Gambar di Layar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTtdInputMode('preset');
                          handleUsePresetTtd();
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition ${
                          ttdInputMode === 'preset'
                            ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>TTD Standar Bawaslu</span>
                      </button>
                    </div>
                  </div>

                  {/* SUB-SECTION: UPLOAD FILE */}
                  {ttdInputMode === 'upload' && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 bg-slate-50/50 text-center space-y-3">
                      <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Pilih atau Tarik Gambar Tanda Tangan
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format PNG transparan sangat disarankan agar menyatu dengan dokumen dan stempel.
                        </p>
                      </div>

                      <input
                        ref={ttdFileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadImage(e, 'ttd')}
                        className="hidden"
                      />

                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => ttdFileRef.current?.click()}
                          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Pilih Berkas Tanda Tangan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECTION: DRAW CANVAS */}
                  {ttdInputMode === 'draw' && (
                    <div className="rounded-xl border border-slate-300 p-4 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Kanvas Tanda Tangan:</span>
                          <span className="text-[11px] text-slate-500">Goreskan mouse atau stylus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Color picker */}
                          <button
                            type="button"
                            onClick={() => setPenColor('#1d4ed8')}
                            className={`w-5 h-5 rounded-full border-2 ${
                              penColor === '#1d4ed8' ? 'border-purple-600 ring-2 ring-purple-300' : 'border-white'
                            } bg-blue-700`}
                            title="Tinta Biru Resmi"
                          />
                          <button
                            type="button"
                            onClick={() => setPenColor('#0f172a')}
                            className={`w-5 h-5 rounded-full border-2 ${
                              penColor === '#0f172a' ? 'border-purple-600 ring-2 ring-purple-300' : 'border-white'
                            } bg-slate-900`}
                            title="Tinta Hitam"
                          />
                        </div>
                      </div>

                      {/* Canvas element */}
                      <div className="relative rounded-lg border border-slate-300 bg-white overflow-hidden shadow-inner cursor-crosshair">
                        <canvas
                          ref={canvasRef}
                          width={440}
                          height={140}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-36 touch-none"
                        />
                        {!hasDrawn && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs italic">
                            [Tanda tangani di sini]
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                        >
                          <Eraser className="h-3.5 w-3.5 text-slate-500" />
                          <span>Hapus / Bersihkan</span>
                        </button>

                        <button
                          type="button"
                          onClick={applyCanvasSignature}
                          disabled={!hasDrawn}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition ${
                            hasDrawn ? 'bg-purple-600 hover:bg-purple-700 shadow-xs' : 'bg-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Terapkan Goresan Ini</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECTION: PRESET INFO */}
                  {ttdInputMode === 'preset' && (
                    <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-purple-900 leading-relaxed">
                        <p className="font-semibold">Tanda Tangan Standar Pejabat Bawaslu Digunakan</p>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          Tanda tangan digital resmi Kepala Sekretariat Bawaslu Kabupaten Subang (H. Tatang Koswara, S.Sos., M.Si) dalam tinta biru berkualitas tinggi.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Size Slider & Remove */}
                  {config.tandaTanganUrl && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Lebar Tanda Tangan:</span>
                          <span className="font-mono text-purple-700 font-bold">{config.tandaTanganWidthPx || 140} px</span>
                        </div>
                        <input
                          type="range"
                          min="90"
                          max="220"
                          step="5"
                          value={config.tandaTanganWidthPx || 140}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              tandaTanganWidthPx: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Hapus gambar tanda tangan jika ingin kosong:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              tandaTanganUrl: '',
                            }))
                          }
                          className="flex items-center gap-1 text-xs text-rose-600 font-semibold hover:text-rose-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus Tanda Tangan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CAP / STEMPEL DINAS */}
              {activeTab === 'cap' && (
                <div className="space-y-5">
                  {/* Toggle Active */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aktifkan Cap / Stempel Dinas Resmi</p>
                      <p className="text-[11px] text-slate-500">
                        Cap basah lingkaran Bawaslu Kabupaten Subang dengan tinta ungu resmi.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tampilkanCap}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, tampilkanCap: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Pilihan: Upload Custom or Gunakan Cap Resmi Bawaslu */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleUsePresetCap}
                      className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-left transition space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        <span>Cap Resmi Bawaslu Subang</span>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Stempel dinas vektor lingkaran ganda Bawaslu Kabupaten Subang (Ungu #581c87).
                      </p>
                    </button>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Upload className="h-3.5 w-3.5 text-slate-600" />
                        <span>Upload Cap Kustom Sendiri</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Upload berkas cap PNG transparan (tanpa background putih).
                      </p>
                      <input
                        ref={capFileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadImage(e, 'cap')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => capFileRef.current?.click()}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900"
                      >
                        <span>Pilih Berkas Cap...</span>
                      </button>
                    </div>
                  </div>

                  {/* Posisi Cap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tata Letak / Posisi Cap Stempel:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, posisiCap: 'tumpang_kiri' }))}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                          config.posisiCap === 'tumpang_kiri'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Layers className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                        <span className="font-bold">Tumpang Kiri</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Standar Naskah Dinas</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, posisiCap: 'sebelah_kiri' }))}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                          config.posisiCap === 'sebelah_kiri'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Stamp className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                        <span className="font-bold">Sebelah Kiri</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Samping TTD</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, posisiCap: 'sebelah_kanan' }))}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                          config.posisiCap === 'sebelah_kanan'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Stamp className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                        <span className="font-bold">Sebelah Kanan</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Samping TTD</p>
                      </button>
                    </div>
                  </div>

                  {/* Size & Opacity Sliders */}
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                        <span>Ukuran Diameter Cap:</span>
                        <span className="font-mono text-purple-700 font-bold">{config.capWidthPx || 120} px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="180"
                        step="5"
                        value={config.capWidthPx || 120}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            capWidthPx: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                        <span>Kepekatan Tinta Cap (Transparansi / Opacity):</span>
                        <span className="font-mono text-purple-700 font-bold">
                          {Math.round((config.opacityCap ?? 0.88) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.0"
                        step="0.05"
                        value={config.opacityCap ?? 0.88}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            opacityCap: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-500">Hapus cap dinas jika tidak ingin digunakan:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            capUrl: '',
                          }))
                        }
                        className="flex items-center gap-1 text-xs text-rose-600 font-semibold hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Cap</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DATA PEJABAT PENANDATANGAN */}
              {activeTab === 'pejabat' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Pejabat Beserta Gelar:
                    </label>
                    <input
                      type="text"
                      value={config.namaPejabat}
                      onChange={(e) => setConfig((prev) => ({ ...prev, namaPejabat: e.target.value }))}
                      placeholder="Contoh: H. TATANG KOSWARA, S.Sos., M.Si"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-bold uppercase focus:border-purple-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jabatan Resmi:
                    </label>
                    <textarea
                      rows={2}
                      value={config.jabatan}
                      onChange={(e) => setConfig((prev) => ({ ...prev, jabatan: e.target.value }))}
                      placeholder="Contoh: Kepala Sekretariat Bawaslu&#10;Kabupaten Subang"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Gunakan baris baru (Enter) jika jabatan terdiri dari dua baris.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIP Pejabat:
                      </label>
                      <input
                        type="text"
                        value={config.nip}
                        onChange={(e) => setConfig((prev) => ({ ...prev, nip: e.target.value }))}
                        placeholder="197405121998031002"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kota Penandatanganan:
                      </label>
                      <input
                        type="text"
                        value={config.kota}
                        onChange={(e) => setConfig((prev) => ({ ...prev, kota: e.target.value }))}
                        placeholder="Subang"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 flex items-start gap-2 text-xs text-sky-900">
                    <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Sinkronisasi Otomatis</p>
                      <p className="text-[11px] text-sky-700 mt-0.5">
                        Pengaturan nama, jabatan, NIP, serta visual tanda tangan dan cap ini akan langsung diterapkan ke Surat Pemberitahuan KGB, Lembar Disposisi, dan Laporan Rekapitulasi.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Preview Column (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-100/90 overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 bg-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-700" />
                <span className="text-xs font-bold text-slate-900">Pratinjau Lembar Naskah Dinas</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                Skala Cetak 100%
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-center items-center">
              {/* Paper Mockup Container */}
              <div className="w-full max-w-sm bg-white border border-slate-300 shadow-md rounded-lg p-6 space-y-4 text-xs">
                {/* Header snippet */}
                <div className="border-b border-slate-300 pb-2 text-center text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  ··· Lembar Dokumen Resmi Bawaslu Subang ···
                </div>

                {/* Simulated Content paragraph */}
                <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed text-justify">
                  <p>
                    Demikian surat pemberitahuan kenaikan gaji berkala ini disampaikan untuk dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* The Signature and Stamp Block */}
                <div className="pt-4 border-t border-slate-100">
                  <TandaTanganCapBlock
                    config={config}
                    align="right"
                  />
                </div>

                {/* Status Badges */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 justify-center">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      config.tampilkanTandaTangan && config.tandaTanganUrl
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    TTD: {config.tampilkanTandaTangan && config.tandaTanganUrl ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      config.tampilkanCap && config.capUrl
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Cap: {config.tampilkanCap && config.capUrl ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {config.tampilkanCap && config.capUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800">
                      Posisi: {config.posisiCap.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            title="Kembalikan tanda tangan dan cap ke standar Bawaslu Subang"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset ke Standar Bawaslu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-800 transition shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Pengaturan TTD &amp; Cap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
