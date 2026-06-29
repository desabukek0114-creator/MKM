import React, { useState } from "react";
import { RouterSession } from "../types.js";
import { Settings as SettingsIcon, Server, Plus, Trash2, Key, Database, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SettingsProps {
  sessions: RouterSession[];
  activeSessionId: string;
  onAddSession: (data: Omit<RouterSession, "id">) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onSwitchSession: (id: string) => void;
}

export default function Settings({
  sessions,
  activeSessionId,
  onAddSession,
  onDeleteSession,
  onSwitchSession
}: SettingsProps) {
  // Form State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [apiPort, setApiPort] = useState("8728");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [dnsName, setDnsName] = useState("hotspot.net");
  const [currency, setCurrency] = useState("Rp");
  const [rateLimitSuffix, setRateLimitSuffix] = useState("M");

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!sessionName.trim() || !ipAddress.trim() || !username.trim()) {
      setErrorMsg("Nama Sesi, IP Address, dan Username MikroTik wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddSession({
        sessionName: sessionName.trim(),
        ipAddress: ipAddress.trim(),
        apiPort: Number(apiPort) || 8728,
        username: username.trim(),
        password: password.trim(),
        dnsName: dnsName.trim() || "hotspot.net",
        currency: currency.trim() || "Rp",
        rateLimitSuffix
      });

      setSuccessMsg(`Berhasil menghubungkan dan mendaftarkan router baru '${sessionName}'!`);
      // Reset form
      setSessionName("");
      setIpAddress("");
      setApiPort("8728");
      setUsername("admin");
      setPassword("");
      setDnsName("hotspot.net");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghubungkan router. Silakan pastikan data benar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (sessions.length <= 1) {
      alert("Minimal harus menyisakan 1 Router Session aktif!");
      return;
    }

    try {
      await onDeleteSession(id);
    } catch (err) {
      console.error("Gagal menghapus sesi", err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6" id="settings-session-container">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-indigo-500" />
          Koneksi Router & Sesi Mikhmon
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Kelola kredensial koneksi MikroTik RouterOS Anda, daftarkan cabang router baru, atau atur simbol mata uang regional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active router connection list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
            <Server className="h-4 w-4 text-cyan-600" />
            Router Terkoneksi ({sessions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="sessions-cards-grid">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`bg-white border p-5 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${
                    isActive 
                      ? "border-blue-500 ring-1 ring-blue-500/10" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Router Session ID</span>
                        <h4 className="text-base font-bold text-slate-900 font-mono">{session.sessionName}</h4>
                      </div>
                      {isActive && (
                        <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
                          Active Sesi
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs font-mono text-slate-500">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>MikroTik IP:</span>
                        <span className="text-slate-800 font-medium">{session.ipAddress}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>API Port:</span>
                        <span className="text-slate-800 font-medium">{session.apiPort}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>Username:</span>
                        <span className="text-slate-800 font-medium">{session.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mata Uang:</span>
                        <span className="text-emerald-600 font-bold">{session.currency} (Rupiah)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100">
                    {!isActive && (
                      <button
                        onClick={() => onSwitchSession(session.id)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg text-xs transition"
                      >
                        Buka Sesi Router
                      </button>
                    )}
                    {deleteConfirmId === session.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-100 flex-1">
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition flex-1 cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] transition flex-1 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className={`flex items-center justify-center p-2 rounded-lg transition ${
                          isActive 
                            ? "bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white flex-1" 
                            : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200"
                        }`}
                        title="Hapus Koneksi Router"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        {isActive && <span className="text-xs font-bold font-sans">Hapus & Disconnect</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add new connection form */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-fit">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <Plus className="h-4 w-4 text-emerald-600" />
            Daftarkan Router Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Session Name */}
            <div className="space-y-1">
              <label className="text-slate-500 font-medium">Nama Sesi Router *</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Contoh: Router-Kost-A"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
              />
            </div>

            {/* IP & Port */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 col-span-2">
                <label className="text-slate-500 font-medium">MikroTik IP / Host *</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.88.1"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Port API</label>
                <input
                  type="text"
                  value={apiPort}
                  onChange={(e) => setApiPort(e.target.value)}
                  placeholder="8728"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tiada"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
            </div>

            {/* Currency settings */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Simbol Mata Uang</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="Rp"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-mono font-bold transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">DNS Name (Optional)</label>
                <input
                  type="text"
                  value={dnsName}
                  onChange={(e) => setDnsName(e.target.value)}
                  placeholder="hotspot.net"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-mono transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs transition mt-2 flex items-center justify-center gap-2 cursor-pointer"
              id="btn-register-session"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {isSubmitting ? "Sedang Mendaftarkan..." : "Hubungkan & Daftarkan Sesi"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
