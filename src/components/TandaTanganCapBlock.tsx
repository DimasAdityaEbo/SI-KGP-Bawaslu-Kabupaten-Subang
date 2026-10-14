import React, { useState, useEffect } from 'react';
import { TandaTanganCapConfig } from '../types';
import { getTandaTanganCapConfig } from '../services/storage';

interface TandaTanganCapBlockProps {
  config?: TandaTanganCapConfig;
  tanggalText?: string;
  customNamaPejabat?: string;
  customJabatan?: string;
  customNip?: string;
  customKota?: string;
  align?: 'left' | 'center' | 'right';
  isCompact?: boolean;
  className?: string;
}

export const TandaTanganCapBlock: React.FC<TandaTanganCapBlockProps> = ({
  config: propsConfig,
  tanggalText,
  customNamaPejabat,
  customJabatan,
  customNip,
  customKota,
  align = 'right',
  isCompact = false,
  className = '',
}) => {
  const [internalConfig, setInternalConfig] = useState<TandaTanganCapConfig>(() =>
    propsConfig || getTandaTanganCapConfig()
  );

  useEffect(() => {
    if (propsConfig) {
      setInternalConfig(propsConfig);
    } else {
      setInternalConfig(getTandaTanganCapConfig());
    }
  }, [propsConfig]);

  const cfg = propsConfig || internalConfig;

  const namaPejabat = customNamaPejabat || cfg.namaPejabat;
  const jabatan = customJabatan || cfg.jabatan;
  const nip = customNip || cfg.nip;
  const kota = customKota || cfg.kota || 'Subang';

  const defaultDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tanggal = tanggalText || cfg.tanggalText || defaultDate;

  const showTtd = cfg.tampilkanTandaTangan && !!cfg.tandaTanganUrl;
  const showCap = cfg.tampilkanCap && !!cfg.capUrl;
  const ttdWidth = cfg.tandaTanganWidthPx || 140;
  const capWidth = cfg.capWidthPx || 120;
  const capOpacity = cfg.opacityCap ?? 0.88;

  const alignContainerClass =
    align === 'left'
      ? 'justify-start text-left'
      : align === 'center'
      ? 'justify-center text-center'
      : 'justify-end text-center';

  return (
    <div className={`flex ${alignContainerClass} ${className} print-break-inside-avoid`}>
      <div className={`text-center ${isCompact ? 'w-56 text-[11px]' : 'w-72 text-xs'} leading-snug`}>
        {/* Tanggal & Tempat */}
        <p className="text-slate-800">
          {kota}, {tanggal}
        </p>

        {/* Jabatan Pejabat */}
        <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line">
          {jabatan}
        </p>

        {/* Container Visual Tanda Tangan & Cap */}
        <div className="relative my-2 min-h-[85px] flex items-center justify-center overflow-visible select-none">
          {showTtd || showCap ? (
            <div className="relative flex items-center justify-center">
              {/* Posisi Cap: Sebelah Kiri */}
              {showCap && cfg.posisiCap === 'sebelah_kiri' && (
                <div
                  className="mr-2 shrink-0 pointer-events-none"
                  style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Tanda Tangan */}
              {showTtd && (
                <div
                  className="relative z-10 shrink-0 pointer-events-none"
                  style={{ width: `${ttdWidth}px` }}
                >
                  <img
                    src={cfg.tandaTanganUrl}
                    alt="Tanda Tangan Pejabat"
                    className="w-full h-auto max-h-24 object-contain"
                  />
                </div>
              )}

              {/* Posisi Cap: Tumpang Tindih (Standar Resmi Tata Naskah Dinas RI) */}
              {showCap && cfg.posisiCap === 'tumpang_kiri' && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    width: `${capWidth}px`,
                    left: showTtd ? '-28px' : '50%',
                    top: '50%',
                    transform: showTtd ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                    opacity: capOpacity,
                    mixBlendMode: 'multiply',
                  }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas Bawaslu"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Posisi Cap: Sebelah Kanan */}
              {showCap && cfg.posisiCap === 'sebelah_kanan' && (
                <div
                  className="ml-2 shrink-0 pointer-events-none"
                  style={{ width: `${capWidth * 0.8}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Jika hanya Cap tanpa Tanda Tangan dan mode bukan tumpang */}
              {!showTtd && showCap && cfg.posisiCap !== 'tumpang_kiri' && (
                <div
                  className="pointer-events-none"
                  style={{ width: `${capWidth}px`, opacity: capOpacity }}
                >
                  <img
                    src={cfg.capUrl}
                    alt="Cap Dinas"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
              [Tanda Tangan &amp; Cap Digital]
            </div>
          )}
        </div>

        {/* Nama Pejabat */}
        <p className="font-bold underline text-slate-950 uppercase tracking-wide">
          {namaPejabat}
        </p>

        {/* NIP Pejabat */}
        {nip && (
          <p className="font-mono text-[11px] text-slate-600 mt-0.5">
            NIP. {nip}
          </p>
        )}
      </div>
    </div>
  );
};
