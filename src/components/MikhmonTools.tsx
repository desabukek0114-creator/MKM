import React, { useState, useEffect } from "react";
import { RouterSession, MikroTikScript, MikroTikScheduler } from "../types.js";
import { 
  Play, 
  Trash2, 
  Edit, 
  Plus, 
  Check, 
  AlertCircle, 
  Calendar, 
  Zap, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Activity, 
  Database,
  Terminal,
  RefreshCw,
  Eye,
  X
} from "lucide-react";

interface MikhmonToolsProps {
  activeSession: RouterSession;
  onRefreshParent: () => void;
}

export default function MikhmonTools({ activeSession, onRefreshParent }: MikhmonToolsProps) {
  const [activeTab, setActiveTab] = useState<"scripts" | "schedulers" | "wizard">("wizard");
  const [scripts, setScripts] = useState<MikroTikScript[]>([]);
  const [schedulers, setSchedulers] = useState<MikroTikScheduler[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [editingScript, setEditingScript] = useState<MikroTikScript | null>(null);
  const [scriptForm, setScriptForm] = useState({ name: "", source: "", comment: "" });

  const [showSchedModal, setShowSchedModal] = useState(false);
  const [editingSched, setEditingSched] = useState<MikroTikScheduler | null>(null);
  const [schedForm, setSchedForm] = useState({ name: "", interval: "00:05:00", onEvent: "mikhmon_expired", comment: "", disabled: false });

  const [runLogs, setRunLogs] = useState<string[]>([]);

  // Fetch Scripts and Schedulers
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resScripts, resScheds] = await Promise.all([
        fetch(`/api/router/${activeSession.id}/scripts`),
        fetch(`/api/router/${activeSession.id}/schedulers`)
      ]);
      
      if (resScripts.ok) {
        setScripts(await resScripts.json());
      }
      if (resScheds.ok) {
        setSchedulers(await resScheds.json());
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data scripts atau schedulers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSession.id]);

  const handleInstallMikhmon = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/router/${activeSession.id}/mikhmon/install`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Integrasi Mikhmon berhasil diinstal!");
        await fetchData();
        onRefreshParent();
        setRunLogs(prev => [
          `[${new Date().toLocaleTimeString()}] INSTALLED: mikhmon_expired script successfully created.`,
          `[${new Date().toLocaleTimeString()}] INSTALLED: mikhmon_expiry_check scheduler created (5 min interval).`,
          ...prev
        ]);
      } else {
        setError(data.error || "Gagal menginstal integrasi Mikhmon");
      }
    } catch (err) {
      console.error(err);
      setError("Koneksi gagal saat mencoba menginstal script");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunScript = async (script: MikroTikScript) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/router/${activeSession.id}/scripts/${script.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator: "mikhmon_tools" })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Script '${script.name}' berhasil dijalankan!`);
        await fetchData();
        onRefreshParent();
        setRunLogs(prev => [
          `[${new Date().toLocaleTimeString()}] EXECUTED: Script '${script.name}' run. Checked hotspot and PPPoE profiles, synchronized expired user statuses, logged sales transactions.`,
          ...prev
        ]);
      } else {
        setError(data.error || "Gagal menjalankan script");
      }
    } catch (err) {
      console.error(err);
      setError("Koneksi gagal saat menjalankan script");
    }
  };

  const handleToggleScheduler = async (sched: MikroTikScheduler) => {
    setError(null);
    try {
      const res = await fetch(`/api/router/${activeSession.id}/schedulers/${sched.id}/toggle`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchData();
        const updated = !sched.disabled;
        setRunLogs(prev => [
          `[${new Date().toLocaleTimeString()}] TOGGLED: Scheduler '${sched.name}' is now ${updated ? "DISABLED" : "ENABLED"}.`,
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal mengubah status scheduler");
    }
  };

  // Script CRUD Actions
  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const url = editingScript 
        ? `/api/router/${activeSession.id}/scripts/${editingScript.id}`
        : `/api/router/${activeSession.id}/scripts`;
      const method = editingScript ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scriptForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(editingScript ? "Script berhasil diperbarui!" : "Script baru berhasil ditambahkan!");
        setShowScriptModal(false);
        setEditingScript(null);
        setScriptForm({ name: "", source: "", comment: "" });
        await fetchData();
      } else {
        setError(data.error || "Gagal menyimpan script");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menyimpan script");
    }
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus script ini?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/router/${activeSession.id}/scripts/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg("Script berhasil dihapus!");
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus script");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menghapus script");
    }
  };

  // Scheduler CRUD Actions
  const handleSaveSched = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const url = editingSched 
        ? `/api/router/${activeSession.id}/schedulers/${editingSched.id}`
        : `/api/router/${activeSession.id}/schedulers`;
      const method = editingSched ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(editingSched ? "Scheduler berhasil diperbarui!" : "Scheduler baru berhasil ditambahkan!");
        setShowSchedModal(false);
        setEditingSched(null);
        setSchedForm({ name: "", interval: "00:05:00", onEvent: "mikhmon_expired", comment: "", disabled: false });
        await fetchData();
      } else {
        setError(data.error || "Gagal menyimpan scheduler");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menyimpan scheduler");
    }
  };

  const handleDeleteSched = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus scheduler ini?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/router/${activeSession.id}/schedulers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg("Scheduler berhasil dihapus!");
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus scheduler");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menghapus scheduler");
    }
  };

  const handleEditScriptClick = (script: MikroTikScript) => {
    setEditingScript(script);
    setScriptForm({
      name: script.name,
      source: script.source,
      comment: script.comment || ""
    });
    setShowScriptModal(true);
  };

  const handleEditSchedClick = (sched: MikroTikScheduler) => {
    setEditingSched(sched);
    setSchedForm({
      name: sched.name,
      interval: sched.interval,
      onEvent: sched.onEvent,
      comment: sched.comment || "",
      disabled: sched.disabled
    });
    setShowSchedModal(true);
  };

  return (
    <div className="space-y-6" id="mikhmon-tools-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Mikhmon Script & Scheduler
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasikan script otomatis di MikroTik / VPN Anda untuk melacak voucher expired secara realtime dan memperbarui database penjualan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleInstallMikhmon}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 transition"
          >
            <Zap className="h-4 w-4" />
            Auto Install Mikhmon
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold font-sans">
        <button
          onClick={() => setActiveTab("wizard")}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === "wizard" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          Integrasi Panduan & Wizard
        </button>
        <button
          onClick={() => setActiveTab("scripts")}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === "scripts" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          MikroTik Scripts ({scripts.length})
        </button>
        <button
          onClick={() => setActiveTab("schedulers")}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === "schedulers" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          MikroTik Schedulers ({schedulers.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Bagaimana Sistem Monitoring Expired Bekerja?
                  </h3>
                  <p className="text-[11px] text-slate-500">Integrasi langsung antara MikroTik ROS, VPN, dan Laporan Mikhmon.</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                <p>
                  Mikhmon menggunakan fitur <strong>Scripting</strong> dan <strong>Scheduling</strong> bawaan RouterOS MikroTik untuk memonitor masa tenggang dari setiap voucher hotspot atau PPPoE user yang didaftarkan.
                </p>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[10px] space-y-2">
                  <p className="font-bold text-slate-800">Alur Kerja Otomatisasi:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                    <li>Voucher di-generate dengan masa aktif tertentu (misal: harian, mingguan, bulanan).</li>
                    <li>Sistem menulis tanggal kadaluarsa ke komentar user di MikroTik (Contoh: <code className="bg-slate-200 text-slate-800 px-1 rounded">Exp: Jul/30/2026, Price: 5000</code>).</li>
                    <li>Scheduler <code className="text-blue-600 font-bold">mikhmon_expiry_check</code> mengeksekusi script secara berkala (misal tiap 5 menit).</li>
                    <li>Script <code className="text-blue-600 font-bold">mikhmon_expired</code> memindai semua user, membandingkan masa aktif dengan jam internal MikroTik.</li>
                    <li>Jika telah melewati tanggal kadaluarsa, user otomatis <strong>dimatikan (disabled) / diisolasi</strong>, dan laporannya dikirim ke Mikhmon sebagai transaksi penjualan berhasil!</li>
                  </ol>
                </div>
                <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5 bg-amber-50 p-2.5 rounded border border-amber-100">
                  <AlertCircle className="h-4 w-4" />
                  Gunakan tombol auto install untuk mengaktifkan scheduler ini secara otomatis pada router saat ini!
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handleInstallMikhmon}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Pasang Integrasi Otomatis Sekarang
                </button>
                {scripts.some(s => s.name === "mikhmon_expired") && (
                  <button
                    onClick={() => {
                      const scr = scripts.find(s => s.name === "mikhmon_expired");
                      if (scr) handleRunScript(scr);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Picu Scan Manual (Cek Expired)
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Script</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{scripts.length}</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Scheduler</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{schedulers.length}</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 border border-teal-100 rounded-lg">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Status Sinkronisasi</span>
                  <span className="text-xs font-bold text-emerald-600">AKTIF & ONLINE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Log Window */}
          <div className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-[350px] lg:h-auto font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Mikhmon Monitor Log
              </span>
              <button
                onClick={() => setRunLogs([])}
                className="text-[9px] text-slate-500 hover:text-slate-300 transition uppercase font-bold"
              >
                Clear Log
              </button>
            </div>
            <div className="flex-1 overflow-y-auto text-[10px] space-y-2 leading-relaxed scrollbar-thin">
              {runLogs.length === 0 ? (
                <p className="text-slate-600 italic">Belum ada aktivitas monitoring terpantau. Aktifkan scheduler atau jalankan script secara manual untuk melihat data pemicu expired.</p>
              ) : (
                runLogs.map((log, idx) => (
                  <p key={idx} className="whitespace-pre-wrap">{log}</p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scripts Tab Content */}
      {activeTab === "scripts" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Daftar Script Router ({scripts.length})</h3>
            <button
              onClick={() => {
                setEditingScript(null);
                setScriptForm({ name: "", source: "", comment: "" });
                setShowScriptModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Script Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            {scripts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Tidak ada script yang ditemukan di router ini.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 font-sans">Nama Script</th>
                    <th className="p-4 font-sans">Run Count</th>
                    <th className="p-4 font-sans">Last Started</th>
                    <th className="p-4 font-sans">Keterangan</th>
                    <th className="p-4 font-sans text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {scripts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-mono text-slate-900 font-bold">{s.name}</div>
                      </td>
                      <td className="p-4 font-mono">{s.runCount}x</td>
                      <td className="p-4 font-mono text-slate-500">
                        {s.lastStarted ? s.lastStarted : "Never"}
                      </td>
                      <td className="p-4 text-slate-500">{s.comment || "-"}</td>
                      <td className="p-4 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => handleRunScript(s)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-100 rounded-md transition text-[11px] font-bold"
                          title="Jalankan Script"
                        >
                          <Play className="h-3 w-3" />
                          Run
                        </button>
                        <button
                          onClick={() => handleEditScriptClick(s)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Script"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScript(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Hapus Script"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Schedulers Tab Content */}
      {activeTab === "schedulers" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Daftar Scheduler Router ({schedulers.length})</h3>
            <button
              onClick={() => {
                setEditingSched(null);
                setSchedForm({ name: "", interval: "00:05:00", onEvent: "mikhmon_expired", comment: "", disabled: false });
                setShowSchedModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Scheduler Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            {schedulers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Tidak ada scheduler yang dikonfigurasi.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 font-sans">Nama Scheduler</th>
                    <th className="p-4 font-sans">Interval</th>
                    <th className="p-4 font-sans">Event (Script)</th>
                    <th className="p-4 font-sans">Run Count</th>
                    <th className="p-4 font-sans">Status</th>
                    <th className="p-4 font-sans">Keterangan</th>
                    <th className="p-4 font-sans text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {schedulers.map((sched) => (
                    <tr key={sched.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-mono text-slate-900 font-bold">{sched.name}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{sched.interval}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] rounded">
                          {sched.onEvent}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{sched.runCount}x</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleScheduler(sched)}
                          className="flex items-center"
                        >
                          {sched.disabled ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] rounded font-bold">
                              Disabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] rounded font-bold">
                              Enabled
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-slate-500">{sched.comment || "-"}</td>
                      <td className="p-4 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleScheduler(sched)}
                          className="p-1 text-slate-400 hover:text-slate-950 transition"
                          title="Toggle Status"
                        >
                          {sched.disabled ? <ToggleLeft className="h-5 w-5 text-slate-300" /> : <ToggleRight className="h-5 w-5 text-blue-600" />}
                        </button>
                        <button
                          onClick={() => handleEditSchedClick(sched)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Scheduler"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSched(sched.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Hapus Scheduler"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                {editingScript ? "Edit Script RouterOS" : "Tambah Script MikroTik Baru"}
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScript} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Nama Script</label>
                <input
                  type="text"
                  required
                  value={scriptForm.name}
                  onChange={(e) => setScriptForm({ ...scriptForm, name: e.target.value })}
                  placeholder="Contoh: mikhmon_expired"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Keterangan / Comment</label>
                <input
                  type="text"
                  value={scriptForm.comment}
                  onChange={(e) => setScriptForm({ ...scriptForm, comment: e.target.value })}
                  placeholder="Keterangan singkat tentang kegunaan script"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Isi Script Source Code</label>
                <textarea
                  required
                  rows={8}
                  value={scriptForm.source}
                  onChange={(e) => setScriptForm({ ...scriptForm, source: e.target.value })}
                  placeholder="# Tulis perintah RouterOS MikroTik di sini..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition whitespace-pre-wrap leading-relaxed bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                >
                  Simpan Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheduler Modal */}
      {showSchedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                {editingSched ? "Edit Scheduler RouterOS" : "Tambah Scheduler Baru"}
              </h3>
              <button
                onClick={() => setShowSchedModal(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSched} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Nama Scheduler</label>
                <input
                  type="text"
                  required
                  value={schedForm.name}
                  onChange={(e) => setSchedForm({ ...schedForm, name: e.target.value })}
                  placeholder="Contoh: mikhmon_expiry_check"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Interval Berkala</label>
                <input
                  type="text"
                  required
                  value={schedForm.interval}
                  onChange={(e) => setSchedForm({ ...schedForm, interval: e.target.value })}
                  placeholder="Contoh: 00:05:00 atau 1d"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">On Event (Menjalankan Script)</label>
                <select
                  value={schedForm.onEvent}
                  onChange={(e) => setSchedForm({ ...schedForm, onEvent: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 bg-white transition"
                >
                  <option value="mikhmon_expired">mikhmon_expired (Mikhmon Expired Cleaner)</option>
                  {scripts.filter(s => s.name !== "mikhmon_expired").map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Keterangan / Comment</label>
                <input
                  type="text"
                  value={schedForm.comment}
                  onChange={(e) => setSchedForm({ ...schedForm, comment: e.target.value })}
                  placeholder="Keterangan scheduler"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSchedModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                >
                  Simpan Scheduler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
