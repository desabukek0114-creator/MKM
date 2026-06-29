import React, { useState } from "react";
import { HotspotActive, RouterSession } from "../types.js";
import { Search, Wifi, WifiOff, RefreshCw, Smartphone, Globe, ArrowDown, ArrowUp } from "lucide-react";

interface HotspotActiveProps {
  activeSession: RouterSession;
  activeUsers: HotspotActive[];
  onKickUser: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function HotspotActiveList({
  activeSession,
  activeUsers,
  onKickUser,
  onRefresh
}: HotspotActiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleKick = async (id: string) => {
    try {
      await onKickUser(id);
    } catch (err: any) {
      alert(err.message || "Gagal mengeluarkan user");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filtered = activeUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.macAddress || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to format bytes cleanly
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate stats
  const totalDownload = filtered.reduce((acc, u) => acc + (u.bytesOut || 0), 0);
  const totalUpload = filtered.reduce((acc, u) => acc + (u.bytesIn || 0), 0);

  return (
    <div className="space-y-6" id="hotspot-active-container">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            User Hotspot Aktif
          </h2>
          <p className="text-slate-500 text-xs font-mono mt-1">
            Router: {activeSession.sessionName} ({filtered.length} perangkat online saat ini)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshClick}
            className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs transition flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Active Devices */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Online Devices</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{filtered.length} HP</span>
          </div>
        </div>

        {/* Total Rx (Download) */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ArrowDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Download (Rx)</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatBytes(totalDownload)}</span>
          </div>
        </div>

        {/* Total Tx (Upload) */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ArrowUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Upload (Tx)</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{formatBytes(totalUpload)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Table list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari user aktif, IP address, atau MAC Address..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg outline-none transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">Status</th>
                <th className="p-4">User</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">MAC Address</th>
                <th className="p-4">Uptime koneksi</th>
                <th className="p-4 text-right">Upload (Tx)</th>
                <th className="p-4 text-right">Download (Rx)</th>
                <th className="p-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 text-center">
                      <span className="relative flex h-2.5 w-2.5 mx-auto">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 font-mono">
                      {user.name}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {user.address}
                    </td>
                    <td className="p-4 font-mono text-slate-600 uppercase">
                      {user.macAddress || <span className="text-slate-400 italic">No-MAC</span>}
                    </td>
                    <td className="p-4 font-mono text-slate-600 font-semibold">
                      {user.uptime}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      {formatBytes(user.bytesIn || 0)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 font-medium">
                      {formatBytes(user.bytesOut || 0)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        {deleteConfirmId === user.id ? (
                          <div className="flex items-center justify-center gap-1.5 animate-in fade-in zoom-in duration-100 font-sans">
                            <button
                              onClick={() => handleKick(user.id)}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] transition cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] transition cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(user.id)}
                            title="Disconnect / Putuskan Koneksi"
                            className="flex items-center gap-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition font-medium text-[10px]"
                          >
                            <WifiOff className="h-3 w-3" />
                            KICK
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Wifi className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada perangkat aktif (online) yang cocok atau terhubung.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
