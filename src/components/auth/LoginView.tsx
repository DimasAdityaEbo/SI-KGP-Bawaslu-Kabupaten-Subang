import React, { useState } from 'react';
import { User } from '../../types';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { BawasluLogo } from '../BawasluLogo';

interface LoginViewProps {
  onLogin: (user: User) => void;
  usersList: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, usersList }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = usersList.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password.trim()
    );

    if (!user) {
      setErrorMessage('Username atau password salah. Silakan coba kembali.');
      return;
    }

    if (user.status === 'nonaktif') {
      setErrorMessage('Akun Anda dinonaktifkan oleh administrator kepegawaian.');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <BawasluLogo size="lg" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          SIAGA-KGB BAWASLU SUBANG
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          Sistem Informasi Pengajuan &amp; Pelayanan Kenaikan Gaji Berkala (KGB)
        </p>
      </div>

      {/* Main Light Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <div className="mb-5 text-center">
            <h2 className="text-base font-bold text-slate-900">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan masukkan kredensial akun pegawai atau administrator
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username Pegawai / Admin
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 shadow-md mt-2"
            >
              <span>Masuk ke Sistem</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Institutional note */}
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-950 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="text-amber-900 font-bold">Petunjuk Masuk Pegawai:</span>
              <p className="mt-0.5 text-amber-900/90">
                Gunakan <strong>nama panggilan pegawai</strong> sebagai username dan <strong>NIP</strong> sebagai password default awal. Anda dapat mengubah password setelah berhasil masuk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <div className="mt-8 text-center text-[11px] text-slate-500">
        <p className="font-semibold text-slate-700">
          Sekretariat Badan Pengawas Pemilihan Umum Kabupaten Subang
        </p>
        <p className="mt-0.5">
          Jl. Palabuan No.9, Kelurahan Sukamelang, Kecamatan Subang, Kabupaten Subang, Jawa Barat 41211.
        </p>
      </div>
    </div>
  );
};
