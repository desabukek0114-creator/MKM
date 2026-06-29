import React, { useState } from "react";
import { HotspotProfile, RouterSession } from "../types.js";
import { Search, Plus, Edit2, Trash2, Zap, Settings, HelpCircle, Shield, ToggleLeft, ToggleRight, DollarSign } from "lucide-react";

interface HotspotProfilesProps {
  activeSession: RouterSession;
  profiles: HotspotProfile[];
  onAddProfile: (data: Partial<HotspotProfile>) => Promise<void>;
  onEditProfile: (id: string, data: Partial<HotspotProfile>) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
}

export default function HotspotProfiles({
  activeSession,
  profiles,
  onAddProfile,
  onEditProfile,
  onDeleteProfile
}: HotspotProfilesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HotspotProfile | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [sharedUsers, setSharedUsers] = useState("1");
  const [rateLimit, setRateLimit] = useState("");
  const [expiredMode, setExpiredMode] = useState<any>("notice");
  const [validity, setValidity] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [lockUser, setLockUser] = useState<"yes" | "no">("no");

  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setName("");
    setSharedUsers("1");
    setRateLimit("1M/1M");
    setExpiredMode("notice");
    setValidity("1d");
    setPrice("5000");
    setSellingPrice("5000");
    setLockUser("no");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: HotspotProfile) => {
    setEditingProfile(prof);
    setName(prof.name);
    setSharedUsers(String(prof.sharedUsers || 1));
    setRateLimit(prof.rateLimit || "");
    setExpiredMode(prof.expiredMode || "notice");
    setValidity(prof.validity || "");
    setPrice(prof.price ? String(prof.price) : "");
    setSellingPrice(prof.sellingPrice ? String(prof.sellingPrice) : "");
    setLockUser(prof.lockUser || "no");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Nama profile tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      sharedUsers: Number(sharedUsers) || 1,
      rateLimit: rateLimit.trim(),
      expiredMode,
      validity: validity.trim(),
      price: Number(price) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      lockUser
    };

    try {
      if (editingProfile) {
        await onEditProfile(editingProfile.id, payload);
      } else {
        await onAddProfile(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProfiles = profiles.filter(prof =>
    prof.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="hotspot-profiles-container">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Paket Profile Hotspot
          </h2>
          <p className="text-slate-500 text-xs font-mono mt-1">
            Router: {activeSession.sessionName} ({filteredProfiles.length} paket)
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow-sm cursor-pointer"
          id="btn-add-hotspot-profile"
        >
          <Plus className="h-4 w-4" />
          Tambah Profile Baru
        </button>
      </div>

      {/* Search and Helper Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama paket profile..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg outline-none transition"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nama Paket Profile</th>
                    <th className="p-4">Limit Bandwidth (Rate)</th>
                    <th className="p-4">Shared Devices</th>
                    <th className="p-4">Mode Expired</th>
                    <th className="p-4">Masa Berlaku</th>
                    <th className="p-4 text-right">Harga</th>
                    <th className="p-4 text-right">Harga Jual</th>
                    <th className="p-4 text-center w-28">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((prof) => (
                      <tr key={prof.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900 font-mono">
                          {prof.name}
                        </td>
                        <td className="p-4 font-mono text-slate-600">
                          {prof.rateLimit ? (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-500" />
                              {prof.rateLimit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Tanpa Batas</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-700 font-medium">
                          {prof.sharedUsers || 1} User
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${
                            prof.expiredMode === "remove" 
                              ? "bg-rose-50 border-rose-100 text-rose-600" 
                              : prof.expiredMode === "notice" 
                              ? "bg-amber-50 border-amber-100 text-amber-600"
                              : prof.expiredMode === "remrec"
                              ? "bg-purple-50 border-purple-100 text-purple-600"
                              : "bg-slate-50 border-slate-100 text-slate-600"
                          }`}>
                            {prof.expiredMode === "remrec" ? "Rem & Record" : prof.expiredMode}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-600">
                          {prof.validity || <span className="text-slate-400 italic">No-Limit</span>}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">
                          {activeSession.currency} {prof.price?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-600 bg-emerald-50/20">
                          {activeSession.currency} {prof.sellingPrice?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(prof)}
                              title="Edit Paket"
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-lg transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {/* Delete */}
                            {deleteConfirmId === prof.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-100 font-sans">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await onDeleteProfile(prof.id);
                                    } catch (err: any) {
                                      alert(err.message || "Gagal menghapus profile");
                                    } finally {
                                      setDeleteConfirmId(null);
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(prof.id);
                                }}
                                title="Hapus"
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-lg transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Zap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        Belum ada Paket Profile Hotspot terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <HelpCircle className="h-4 w-4" />
              Panduan Mikhmon Expire Mode
            </h3>
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="space-y-1">
                <p className="font-bold text-rose-600 flex items-center gap-1">
                  ● REMOVE
                </p>
                <p className="text-slate-500 pl-4 leading-relaxed">
                  Menghapus voucher secara otomatis ketika masa aktif habis (Sangat hemat resource memori MikroTik).
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-amber-600 flex items-center gap-1">
                  ● NOTICE
                </p>
                <p className="text-slate-500 pl-4 leading-relaxed">
                  Menonaktifkan user & memicu halaman captive portal redirect yang menyatakan voucher habis (User tetap tersimpan di MikroTik).
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-purple-600 flex items-center gap-1">
                  ● REMOVE & RECORD (REMREC)
                </p>
                <p className="text-slate-500 pl-4 leading-relaxed">
                  Menghapus voucher tapi mencatat rincian transaksi penjualan ke log laporan bulanan Mikhmon secara detail.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  ● KEEP
                </p>
                <p className="text-slate-500 pl-4 leading-relaxed">
                  Membiarkan akun tetap ada meskipun masa aktif habis. Kecepatan diturunkan sesuai rule opsional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProfile ? `Edit Paket Hotspot: ${editingProfile.name}` : "Tambah Paket Profile Hotspot Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold font-mono"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Profile Name */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Nama Paket Profile *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Hs-Harian-5K"
                  required
                  disabled={!!editingProfile}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Shared Users */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Shared Users (Batas Perangkat Bersamaan)</label>
                <input
                  type="number"
                  value={sharedUsers}
                  onChange={(e) => setSharedUsers(e.target.value)}
                  placeholder="1"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Rate Limit */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-600 font-medium">Rate Limit (Upload/Download)</label>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. 512k/1M or 1M/2M</span>
                </div>
                <input
                  type="text"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  placeholder="Contoh: 1M/2M"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Expired Mode */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Expired Mode</label>
                <select
                  value={expiredMode}
                  onChange={(e) => setExpiredMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-medium transition"
                >
                  <option value="keep">Keep</option>
                  <option value="remove">Remove</option>
                  <option value="notice">Notice</option>
                  <option value="remrec">Remove & Record</option>
                </select>
              </div>

              {/* Validity */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-600 font-medium">Masa Berlaku (Validity)</label>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. 12h, 1d, 30d</span>
                </div>
                <input
                  type="text"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  placeholder="Contoh: 1d (24 jam) atau 12h (12 jam)"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Price */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Harga Modal ({activeSession.currency})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Harga Jual ({activeSession.currency})</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Lock User MAC */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-700 block">Kunci ke MAC Perangkat (Lock User)</span>
                  <span className="text-[10px] text-slate-400">Kunci voucher agar hanya bisa digunakan oleh 1 HP pertama</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLockUser(lockUser === "yes" ? "no" : "yes")}
                  className="text-slate-600 transition outline-none"
                >
                  {lockUser === "yes" ? (
                    <ToggleRight className="h-7 w-7 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : editingProfile ? "Simpan Perubahan" : "Tambah Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
