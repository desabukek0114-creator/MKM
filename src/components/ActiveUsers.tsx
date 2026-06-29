import React, { useState } from "react";
import { PppoeActive, RouterSession } from "../types.js";
import { Search, Radio, RefreshCw, ZapOff, ShieldAlert, Cpu } from "lucide-react";

interface ActiveUsersProps {
  activeSession: RouterSession;
  activeUsers: PppoeActive[];
  onKickUser: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function ActiveUsers({
  activeSession,
  activeUsers,
  onKickUser,
  onRefresh
}: ActiveUsersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isKicking, setIsKicking] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleKick = async (id: string) => {
    setIsKicking(prev => ({ ...prev, [id]: true }));
    try {
      await onKickUser(id);
    } catch (err) {
      console.error("Gagal kick user:", err);
    } finally {
      setIsKicking(prev => ({ ...prev, [id]: false }));
      setDeleteConfirmId(null);
    }
  };

  const filteredUsers = activeUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.macAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5" id="active-users-container">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Koneksi PPPoE Aktif</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Daftar pelanggan yang saat ini sedang online, melakukan transfer data, dan terhubung ke router.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Segarkan Data
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <span className="absolute inset-y-0 left-7 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Cari user aktif berdasarkan nama, IP address, atau MAC Address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
        />
      </div>

      {/* Active connections table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="active-users-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">User Pelanggan</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold">MAC Address / Caller ID</th>
                <th className="py-3 px-4 font-semibold">Uptime Koneksi</th>
                <th className="py-3 px-4 font-semibold text-center w-28">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    {/* Username */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2 font-sans">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-xs">{user.name}</span>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 text-slate-700">{user.address}</td>

                    {/* MAC Address */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {user.macAddress || user.callerId || "unknown"}
                    </td>

                    {/* Uptime */}
                    <td className="py-3.5 px-4 text-blue-600 font-semibold">{user.uptime}</td>

                    {/* Disconnect action */}
                    <td className="py-3.5 px-4 text-center">
                      {deleteConfirmId === user.id ? (
                        <div className="flex items-center justify-center gap-1 animate-in fade-in zoom-in duration-100">
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
                          disabled={isKicking[user.id]}
                          className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <ZapOff className="h-3 w-3" />
                          {isKicking[user.id] ? "Kick..." : "Kick User"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic bg-slate-50/50 font-sans">
                    {searchQuery ? "Tidak ditemukan koneksi aktif yang cocok." : "Belum ada pelanggan PPPoE yang online."}
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
