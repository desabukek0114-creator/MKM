import React, { useState } from "react";
import { SystemUser } from "../types.js";
import { Key, User, Shield, RefreshCw, AlertCircle, Wifi, Zap } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/system/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (res.ok) {
        const user: SystemUser = await res.json();
        onLoginSuccess(user);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Username atau Password salah!");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Koneksi ke server gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blur accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Header Block */}
        <div className="bg-slate-950 p-8 border-b border-slate-800 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
          <div className="mx-auto w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wider uppercase">MIKHMON MONITOR</h1>
          <p className="text-xs text-slate-400 mt-1">PPPoE & Hotspot Billing Portal System</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" /> Username Sistem
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3.5 outline-none text-slate-100 placeholder-slate-600 text-xs font-mono transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-slate-500" /> Sandi Akses (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3.5 outline-none text-slate-100 placeholder-slate-600 text-xs font-mono transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {isLoading ? "Memvalidasi Sesi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div className="bg-slate-950/80 p-6 border-t border-slate-800/60 text-xs text-slate-500">
          <p className="font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-500" /> Akun Demo Sistem Tersedia:
          </p>
          <div className="grid grid-cols-1 gap-1.5 font-mono text-[10px] leading-relaxed">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span>👤 Admin Utama (Full Access):</span>
              <span className="text-blue-400 font-bold">admin / 123</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span>👤 Kasir Toko (Laporan & Cetak):</span>
              <span className="text-emerald-400 font-bold">kasir1 / 123</span>
            </div>
            <div className="flex justify-between">
              <span>👤 Operator Jaringan (Teknis Only):</span>
              <span className="text-amber-400 font-bold">operator1 / 123</span>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-6 text-center text-[10px] text-slate-600 font-mono">
        Mikhmon API System v4.0.2 Stable © 2026 | Cloud Integrated
      </div>
    </div>
  );
}
