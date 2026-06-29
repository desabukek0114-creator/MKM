import React, { useState } from "react";
import { PppoeProfile, RouterSession } from "../types.js";
import { FolderPlus, Settings, Edit3, Trash2, DollarSign, Activity, Lock, Layers, RefreshCw, AlertTriangle, ListFilter } from "lucide-react";

interface PppoeProfilesProps {
  activeSession: RouterSession;
  profiles: PppoeProfile[];
  onAddProfile: (data: Partial<PppoeProfile>) => Promise<void>;
  onEditProfile: (id: string, data: Partial<PppoeProfile>) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
}

export default function PppoeProfiles({
  activeSession,
  profiles,
  onAddProfile,
  onEditProfile,
  onDeleteProfile
}: PppoeProfilesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<PppoeProfile | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [localAddress, setLocalAddress] = useState("");
  const [remoteAddress, setRemoteAddress] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [onlyOne, setOnlyOne] = useState<'yes' | 'no' | 'default'>("yes");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [validity, setValidity] = useState("");
  const [parentQueue, setParentQueue] = useState("");

  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setName("");
    setLocalAddress("10.10.10.1");
    setRemoteAddress("pppoe-pool");
    setRateLimit("5M/5M");
    setOnlyOne("yes");
    setPrice("150000");
    setSellingPrice("150000");
    setValidity("30d");
    setParentQueue("PPPoE-Parent");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: PppoeProfile) => {
    setEditingProfile(prof);
    setName(prof.name);
    setLocalAddress(prof.localAddress || "");
    setRemoteAddress(prof.remoteAddress || "");
    setRateLimit(prof.rateLimit || "");
    setOnlyOne(prof.onlyOne || "yes");
    setPrice(prof.price ? String(prof.price) : "");
    setSellingPrice(prof.sellingPrice ? String(prof.sellingPrice) : "");
    setValidity(prof.validity || "");
    setParentQueue(prof.parentQueue || "");
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
      localAddress: localAddress.trim(),
      remoteAddress: remoteAddress.trim(),
      rateLimit: rateLimit.trim(),
      onlyOne,
      price: price ? Number(price) : 0,
      sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
      validity: validity.trim(),
      parentQueue: parentQueue.trim()
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

  return (
    <div className="space-y-5" id="profiles-container">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">PPPoE Profiles (Paket Layanan)</h2>
          <p className="text-slate-500 text-xs mt-1">
            Definisikan paket internet, batas kecepatan bandwidth, harga jual, dan masa aktif voucher billing.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition shadow-sm"
          id="btn-add-profile"
        >
          <FolderPlus className="h-4 w-4" />
          Buat Profile Baru
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="profiles-grid">
        {profiles.map((prof) => (
          <div
            key={prof.id}
            className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm relative group overflow-hidden hover:border-indigo-300 transition-all duration-300"
          >
            {/* Top Row with Profile Name and Settings */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">
                    PPPoE Profile Plan
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition font-mono">
                    {prof.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleOpenEditModal(prof)}
                    title="Edit Profile"
                    className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  {deleteConfirmId === prof.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-100">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await onDeleteProfile(prof.id);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setDeleteConfirmId(null);
                          }
                        }}
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition"
                      >
                        Ya
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] transition border border-slate-200"
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
                      title="Hapus Profile"
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bandwidth & Price Banner */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block uppercase">Bandwidth</span>
                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-indigo-55 text-indigo-600" />
                    {prof.rateLimit || "Unlimited"}
                  </span>
                </div>
                <div className="space-y-0.5 border-l border-slate-200 pl-3">
                  <span className="text-[9px] text-slate-400 block uppercase">Harga Jual</span>
                  <span className="text-emerald-600 font-bold">
                    {prof.price ? `${activeSession.currency} ${prof.price.toLocaleString("id-ID")}` : "Gratis"}
                  </span>
                </div>
              </div>

              {/* Detail fields */}
              <div className="space-y-2 text-[11px] font-mono text-slate-500 pt-1">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Masa Aktif:</span>
                  <span className="text-slate-800">{prof.validity || "Seterusnya"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>IP Pool (Remote):</span>
                  <span className="text-slate-800">{prof.remoteAddress || "dynamic"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>IP Lokal MikroTik:</span>
                  <span className="text-slate-800">{prof.localAddress || "dynamic"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Satu Login Saja:</span>
                  <span className="text-slate-800 capitalize">{prof.onlyOne || "yes"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue Parent:</span>
                  <span className="text-slate-800 font-semibold">{prof.parentQueue || "none"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Glow bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
            <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-sm">Belum ada PPPoE Profile yang ditambahkan di router ini.</p>
          </div>
        )}
      </div>

      {/* Profile Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                {editingProfile ? "Edit PPPoE Profile Plan" : "Tambah PPPoE Profile Plan"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg flex items-center gap-2 font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Profile Name & Bandwidth Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Nama Profile Plan *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: PPPoE-10M"
                    required
                    disabled={editingProfile !== null}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Limit Bandwidth (rx/tx) *</label>
                  <input
                    type="text"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    placeholder="Contoh: 10M/10M"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Row 2: Price and Validity */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 font-medium">Masa Aktif Plan</label>
                  <input
                    type="text"
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    placeholder="Contoh: 30d (30 hari)"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 font-medium">Harga Dasar ({activeSession.currency})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="150000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 font-medium">Harga Jual ({activeSession.currency})</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="150000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Row 3: IP Config */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">IP Lokal Gateway Router</label>
                  <input
                    type="text"
                    value={localAddress}
                    onChange={(e) => setLocalAddress(e.target.value)}
                    placeholder="Contoh: 10.10.10.1"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Remote Pool Pelanggan</label>
                  <input
                    type="text"
                    value={remoteAddress}
                    onChange={(e) => setRemoteAddress(e.target.value)}
                    placeholder="Contoh: pppoe-pool"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* OnlyOne & Queue Config */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Hanya Satu Login (Only One)</label>
                  <select
                    value={onlyOne}
                    onChange={(e) => setOnlyOne(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none text-slate-700 transition"
                  >
                    <option value="yes">yes (Satu akun per router)</option>
                    <option value="no">no (Boleh login multipel)</option>
                    <option value="default">default (Ikuti global)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Queue Parent</label>
                  <input
                    type="text"
                    value={parentQueue}
                    onChange={(e) => setParentQueue(e.target.value)}
                    placeholder="Contoh: PPPoE-Parent atau none"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="bg-slate-50 -mx-5 -mb-5 p-4 border-t border-slate-200 flex justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition"
                  id="btn-save-profile"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Profile Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
