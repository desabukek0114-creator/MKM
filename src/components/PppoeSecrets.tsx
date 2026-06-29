import React, { useState } from "react";
import { PppoeSecret, PppoeProfile, RouterSession } from "../types.js";
import { Search, UserPlus, ToggleLeft, ToggleRight, Edit2, Trash2, Printer, Eye, EyeOff, MessageSquare, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";

interface PppoeSecretsProps {
  activeSession: RouterSession;
  secrets: PppoeSecret[];
  profiles: PppoeProfile[];
  onAddSecret: (data: Partial<PppoeSecret>) => Promise<void>;
  onEditSecret: (id: string, data: Partial<PppoeSecret>) => Promise<void>;
  onDeleteSecret: (id: string) => Promise<void>;
  onPrintTicket: (secret: PppoeSecret) => void;
}

export default function PppoeSecrets({
  activeSession,
  secrets,
  profiles,
  onAddSecret,
  onEditSecret,
  onDeleteSecret,
  onPrintTicket
}: PppoeSecretsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<PppoeSecret | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("");
  const [localAddress, setLocalAddress] = useState("");
  const [remoteAddress, setRemoteAddress] = useState("");
  const [service, setService] = useState("pppoe");
  const [expiryDate, setExpiryDate] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [disabled, setDisabled] = useState(false);

  // Form initialization for ADD
  const handleOpenAddModal = () => {
    setEditingSecret(null);
    setUsername("");
    setPassword("");
    setProfile(profiles[0]?.name || "");
    setLocalAddress("");
    setRemoteAddress("");
    setService("pppoe");
    
    // Default expiration is 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const expStr = `${months[nextMonth.getMonth()]}/${String(nextMonth.getDate()).padStart(2, '0')}/${nextMonth.getFullYear()}`;
    setExpiryDate(expStr);

    // Grab price from profile
    const selectedProf = profiles[0];
    setPrice(selectedProf?.price ? String(selectedProf.price) : "150000");
    
    setPhone("");
    setDisabled(false);
    setFormError("");
    setIsModalOpen(true);
  };

  // Form initialization for EDIT
  const handleOpenEditModal = (secret: PppoeSecret) => {
    setEditingSecret(secret);
    setUsername(secret.name);
    setPassword(secret.password || "");
    setProfile(secret.profile);
    setLocalAddress(secret.localAddress || "");
    setRemoteAddress(secret.remoteAddress || "");
    setService(secret.service || "pppoe");
    setDisabled(secret.disabled);

    // Fill details from parsed comment
    const info = secret.parsedComment || {};
    setExpiryDate(info.expiryDate || "");
    setPrice(info.price ? String(info.price) : "");
    setPhone(info.phone || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle profile choice change to auto-update price
  const handleProfileChange = (profileName: string) => {
    setProfile(profileName);
    const selectedProf = profiles.find(p => p.name === profileName);
    if (selectedProf && selectedProf.price) {
      setPrice(String(selectedProf.price));
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!username.trim()) {
      setFormError("Username tidak boleh kosong");
      return;
    }
    if (!password.trim()) {
      setFormError("Password tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);

    // Build standard Mikhmon comment string
    const commentParts = [];
    if (expiryDate.trim()) commentParts.push(`Exp: ${expiryDate.trim()}`);
    if (price.trim()) commentParts.push(`Price: ${price.trim()}`);
    if (phone.trim()) commentParts.push(`Phone: ${phone.trim()}`);
    const compiledComment = commentParts.join(", ");

    const payload = {
      name: username.trim(),
      password: password.trim(),
      service,
      profile,
      localAddress: localAddress.trim(),
      remoteAddress: remoteAddress.trim(),
      comment: compiledComment,
      disabled
    };

    try {
      if (editingSecret) {
        await onEditSecret(editingSecret.id, payload);
      } else {
        await onAddSecret(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan secret. Silakan periksa kembali data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDisabled = async (secret: PppoeSecret) => {
    try {
      await onEditSecret(secret.id, { disabled: !secret.disabled });
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Send WhatsApp Reminder
  const handleSendWA = (secret: PppoeSecret) => {
    const info = secret.parsedComment;
    if (!info || !info.phone) {
      alert("Nomor WhatsApp pelanggan tidak terdaftar!");
      return;
    }

    let phoneClean = info.phone.replace(/[^0-9]/g, "");
    if (phoneClean.startsWith("0")) {
      phoneClean = "62" + phoneClean.substring(1);
    }

    const message = `Halo Kak *${secret.name}*,\n\nKami dari layanan internet rumah ingin mengingatkan bahwa tagihan internet Anda sebesar *${activeSession.currency} ${(info.price || 0).toLocaleString("id-ID")}* dengan masa aktif s/d *${info.expiryDate || "-"}* saat ini sudah mendekati jatuh tempo.\n\nSilakan lakukan pembayaran agar layanan tidak terisolir otomatis oleh sistem.\n\nTerima kasih.`;
    const waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Filter secrets
  const filteredSecrets = secrets.filter(sec => {
    const matchesSearch = 
      sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sec.comment || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProfile = profileFilter === "all" || sec.profile === profileFilter;
    
    // Status resolution
    const info = sec.parsedComment || {};
    let status: "active" | "expired" | "disabled" = "active";
    if (sec.disabled) {
      status = "disabled";
    } else if (info.status === "expired") {
      status = "expired";
    }

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesProfile && matchesStatus;
  });

  return (
    <div className="space-y-5" id="secrets-container">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">PPPoE Secrets</h2>
          <p className="text-slate-500 text-xs mt-1">
            Kelola data akun pelanggan internet PPPoE dan masa kedaluwarsa billing.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition shadow-sm"
          id="btn-add-secret"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Akun Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama pelanggan atau comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
          />
        </div>

        {/* Profile Filter */}
        <div>
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 text-xs text-slate-700 rounded-lg p-2.5 outline-none transition"
          >
            <option value="all">Semua Profile</option>
            {profiles.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 text-xs text-slate-700 rounded-lg p-2.5 outline-none transition"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Masa Tenggang Oke)</option>
            <option value="expired">Kedaluwarsa (Isolir/Tagihan)</option>
            <option value="disabled">Non-Aktif (Disabled)</option>
          </select>
        </div>
      </div>

      {/* Secrets Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="secrets-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">User Pelanggan</th>
                <th className="py-3 px-4 font-semibold w-28">Password</th>
                <th className="py-3 px-4 font-semibold">Layanan Profile</th>
                <th className="py-3 px-4 font-semibold">Masa Aktif (Exp)</th>
                <th className="py-3 px-4 font-semibold text-right">Tarif Bulanan</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center w-40">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSecrets.length > 0 ? (
                filteredSecrets.map((sec) => {
                  const info = sec.parsedComment || {};
                  const isPasswordShown = showPasswords[sec.id] || false;
                  
                  // Calculate dynamic status indicators
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 bg-emerald-55 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                      <CheckCircle className="h-3 w-3" /> AKTIF
                    </span>
                  );
                  let expStyle = "text-slate-600 font-mono";

                  if (sec.disabled) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                        <XCircle className="h-3 w-3" /> DISABLE
                      </span>
                    );
                    expStyle = "text-slate-400 font-mono line-through";
                  } else if (info.status === "expired") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                        <AlertTriangle className="h-3 w-3" /> ISOLIR
                      </span>
                    );
                    expStyle = "text-rose-600 font-bold font-mono";
                  }

                  return (
                    <tr
                      key={sec.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        sec.disabled ? "bg-slate-50/20 opacity-80" : ""
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div>
                          <p className="text-[13px] text-slate-900 font-mono">{sec.name}</p>
                          {info.phone && (
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5 font-normal">
                              WA: {info.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{isPasswordShown ? sec.password : "••••••"}</span>
                          <button
                            onClick={() => togglePasswordVisibility(sec.id)}
                            className="text-slate-400 hover:text-slate-700 transition"
                          >
                            {isPasswordShown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Profile */}
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-600 font-mono">
                          {sec.profile}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4">
                        <span className={expStyle}>
                          {info.expiryDate || <span className="text-slate-400 italic">No limit</span>}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {info.price ? (
                          <span className="font-semibold text-slate-900">
                            {activeSession.currency} {info.price.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Enable / Disable */}
                          <button
                            onClick={() => handleToggleDisabled(sec)}
                            title={sec.disabled ? "Enable Secret" : "Disable Secret"}
                            className={`p-1.5 rounded transition ${
                              sec.disabled 
                                ? "text-emerald-600 hover:bg-emerald-55 hover:bg-emerald-50" 
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                          >
                            {sec.disabled ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          </button>

                          {/* Print ticket */}
                          <button
                            onClick={() => onPrintTicket(sec)}
                            title="Cetak Kuitansi / Voucher"
                            className="p-1.5 rounded text-cyan-600 hover:bg-cyan-50 transition"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* WA Reminder */}
                          {info.phone && (
                            <button
                              onClick={() => handleSendWA(sec)}
                              title="Kirim Pengingat WhatsApp"
                              className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(sec)}
                            title="Edit"
                            className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          {deleteConfirmId === sec.id ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-100">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await onDeleteSecret(sec.id);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setDeleteConfirmId(null);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition shadow-xs"
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
                                setDeleteConfirmId(sec.id);
                              }}
                              title="Hapus"
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic bg-slate-50/50">
                    Tidak ada akun PPPoE Secret yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {editingSecret ? "Edit Akun PPPoE Secret" : "Tambah Akun PPPoE Baru"}
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
                <div className="bg-rose-55 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg flex items-center gap-2 font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 1: Basic Creds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Username Pelanggan *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: budi_net"
                    required
                    disabled={editingSecret !== null} // Disable renaming secret to protect session references
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Password Login *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: 123456"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Profile Selection & Service */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Layanan Profile *</label>
                  <select
                    value={profile}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none text-slate-700 transition"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Jenis Layanan (Service)</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none text-slate-700 transition"
                  >
                    <option value="pppoe">pppoe</option>
                    <option value="any">any</option>
                  </select>
                </div>
              </div>

              {/* Expiry, Price, and Phone (Mikhmon Comments) */}
              <div className="border-t border-slate-100 pt-3 mt-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                  Atribut Billing & Masa Aktif (Mikhmon Comm)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Tgl Kedaluwarsa (Exp)</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="Jul/25/2026"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Harga Layanan ({activeSession.currency})</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="150000"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">No. WA Pelanggan</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* IP Config (Optional) */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">IP Lokal MikroTik (Optional)</label>
                  <input
                    type="text"
                    value={localAddress}
                    onChange={(e) => setLocalAddress(e.target.value)}
                    placeholder="Contoh: 10.10.10.1"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">IP Remote Pelanggan (Optional)</label>
                  <input
                    type="text"
                    value={remoteAddress}
                    onChange={(e) => setRemoteAddress(e.target.value)}
                    placeholder="Contoh: 10.10.10.101"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Status / Disabled */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="chk-disabled"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  className="rounded bg-white border-slate-200 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <label htmlFor="chk-disabled" className="text-slate-700 font-medium cursor-pointer">
                  Non-aktifkan akun ini (Disable PPPoE login)
                </label>
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
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition"
                  id="btn-save-secret"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
