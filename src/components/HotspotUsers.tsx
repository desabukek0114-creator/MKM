import React, { useState } from "react";
import { HotspotUser, HotspotProfile, RouterSession } from "../types.js";
import { Search, UserPlus, ToggleLeft, ToggleRight, Edit2, Trash2, Printer, Eye, EyeOff, AlertTriangle, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface HotspotUsersProps {
  activeSession: RouterSession;
  users: HotspotUser[];
  profiles: HotspotProfile[];
  onAddUser: (data: Partial<HotspotUser>) => Promise<void>;
  onEditUser: (id: string, data: Partial<HotspotUser>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onPrintTicket: (user: any) => void;
}

export default function HotspotUsers({
  activeSession,
  users,
  profiles,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onPrintTicket
}: HotspotUsersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<HotspotUser | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("");
  const [limitUptime, setLimitUptime] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [disabled, setDisabled] = useState(false);

  // Form initialization for ADD
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setProfile(profiles[0]?.name || "");
    setLimitUptime("");
    
    // Default expiration is 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const expStr = `${months[nextMonth.getMonth()]}/${String(nextMonth.getDate()).padStart(2, '0')}/${nextMonth.getFullYear()}`;
    setExpiryDate(expStr);

    const selectedProf = profiles[0];
    setPrice(selectedProf?.price ? String(selectedProf.price) : "5000");
    
    setPhone("");
    setDisabled(false);
    setFormError("");
    setIsModalOpen(true);
  };

  // Form initialization for EDIT
  const handleOpenEditModal = (user: HotspotUser) => {
    setEditingUser(user);
    setUsername(user.name);
    setPassword(user.password || "");
    setProfile(user.profile);
    setLimitUptime(user.limitUptime || "");
    setDisabled(user.disabled);

    const info = user.parsedComment || {};
    setExpiryDate(info.expiryDate || "");
    setPrice(info.price ? String(info.price) : "");
    setPhone(info.phone || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleProfileChange = (profileName: string) => {
    setProfile(profileName);
    const selectedProf = profiles.find(p => p.name === profileName);
    if (selectedProf && selectedProf.price) {
      setPrice(String(selectedProf.price));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!username.trim()) {
      setFormError("Username / Kode Voucher tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);

    const commentParts = [];
    if (expiryDate.trim()) commentParts.push(`Exp: ${expiryDate.trim()}`);
    if (price.trim()) commentParts.push(`Price: ${price.trim()}`);
    if (phone.trim()) commentParts.push(`Phone: ${phone.trim()}`);
    const compiledComment = commentParts.join(", ");

    const payload = {
      name: username.trim(),
      password: password.trim(), // Empty is allowed for Hotspot (username as password)
      profile,
      limitUptime: limitUptime.trim(),
      comment: compiledComment,
      disabled
    };

    try {
      if (editingUser) {
        await onEditUser(editingUser.id, payload);
      } else {
        await onAddUser(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan user. Silakan periksa kembali data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDisabled = async (user: HotspotUser) => {
    try {
      await onEditUser(user.id, { disabled: !user.disabled });
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.comment || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProfile = profileFilter === "all" || user.profile === profileFilter;
    
    const status = user.parsedComment?.status || "active";
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "disabled" && user.disabled) ||
      (statusFilter === "active" && !user.disabled && status === "active") ||
      (statusFilter === "expired" && !user.disabled && status === "expired");

    return matchesSearch && matchesProfile && matchesStatus;
  });

  return (
    <div className="space-y-6" id="hotspot-users-container">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Managemen User Hotspot (Voucher)
          </h2>
          <p className="text-slate-500 text-xs font-mono mt-1">
            Router: {activeSession.sessionName} ({filteredUsers.length} voucher disaring)
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow-sm cursor-pointer"
          id="btn-add-hotspot-user"
        >
          <UserPlus className="h-4 w-4" />
          Tambah User (Voucher)
        </button>
      </div>

      {/* Filter and Search box */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama user atau catatan voucher..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg outline-none transition"
          />
        </div>

        {/* Profile Filter */}
        <div>
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-lg outline-none transition"
          >
            <option value="all">Semua Paket Profile</option>
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
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-lg outline-none transition"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif / Belum Habis</option>
            <option value="expired">Masa Aktif Habis</option>
            <option value="disabled">Nonaktif (X)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">Status</th>
                <th className="p-4">Kode / Username</th>
                <th className="p-4">Password</th>
                <th className="p-4">Profil Paket</th>
                <th className="p-4">Limit Uptime</th>
                <th className="p-4">Masa Berlaku (Exp)</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4 text-center w-40">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const info = user.parsedComment || {};
                  const status = info.status || "active";
                  const isExpired = status === "expired";
                  const showPass = showPasswords[user.id] || false;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/80 transition ${user.disabled ? "opacity-60 bg-slate-50/40" : ""}`}
                    >
                      {/* Status */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleDisabled(user)}
                          title={user.disabled ? "Aktifkan" : "Nonaktifkan"}
                          className="focus:outline-none"
                        >
                          {user.disabled ? (
                            <XCircle className="h-5 w-5 text-rose-500 mx-auto" />
                          ) : isExpired ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" title="Masa Aktif Habis" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Username */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {user.name}
                      </td>

                      {/* Password */}
                      <td className="p-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {user.password === "same" || !user.password ? (
                              <span className="text-slate-400 italic text-[10px]">Sama dengan nama</span>
                            ) : showPass ? (
                              user.password
                            ) : (
                              "••••••"
                            )}
                          </span>
                          {user.password && user.password !== "same" && (
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="text-slate-400 hover:text-slate-600 transition"
                            >
                              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Profile */}
                      <td className="p-4">
                        <span className="bg-blue-50 border border-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full text-[10px]">
                          {user.profile}
                        </span>
                      </td>

                      {/* Limit Uptime */}
                      <td className="p-4 font-mono text-slate-600">
                        {user.limitUptime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {user.limitUptime}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa Batas</span>
                        )}
                      </td>

                      {/* Expiration date */}
                      <td className="p-4 font-mono">
                        {info.expiryDate ? (
                          <span className={isExpired ? "text-rose-600 font-semibold" : "text-slate-600"}>
                            {info.expiryDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-4 text-right font-mono font-bold text-slate-800">
                        {info.price ? (
                          <span>{activeSession.currency} {info.price.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onPrintTicket(user)}
                            title="Cetak Tiket / Voucher"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            title="Edit"
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-lg transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete */}
                          {deleteConfirmId === user.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-100">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await onDeleteUser(user.id);
                                  } catch (err: any) {
                                    alert(err.message || "Gagal menghapus user");
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
                                setDeleteConfirmId(user.id);
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Belum ada Hotspot User terdaftar atau pencarian tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? `Edit Hotspot User: ${editingUser.name}` : "Tambah Hotspot User (Voucher) Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Username field */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Kode Voucher / Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: h73af atau budi_kamar2"
                  required
                  disabled={!!editingUser}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-600 font-medium">Password</label>
                  <span className="text-[10px] text-slate-400 italic">Kosongkan jika username sekaligus password</span>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password untuk kode voucher"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Hotspot profile */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Paket Profile *</label>
                <select
                  value={profile}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-medium transition"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Limit Uptime */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-600 font-medium">Limit Uptime (Batas Waktu)</label>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. 12h, 1d, 30m</span>
                </div>
                <input
                  type="text"
                  value={limitUptime}
                  onChange={(e) => setLimitUptime(e.target.value)}
                  placeholder="Contoh: 12h (Kosongkan jika unlimited)"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mikhmon Billing & Expire Info (Komentar MikroTik)
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Exp date */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Tanggal Exp (Masa Berlaku)</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="Jul/25/2026"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Harga ({activeSession.currency})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">No. WhatsApp Pelanggan (Opsional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>

              {/* Status active / disabled */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="font-medium text-slate-700">Status Dinonaktifkan (Disabled)</span>
                <button
                  type="button"
                  onClick={() => setDisabled(!disabled)}
                  className="text-slate-600 transition outline-none"
                >
                  {disabled ? (
                    <ToggleRight className="h-7 w-7 text-rose-500" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Submit buttons */}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : editingUser ? "Simpan Perubahan" : "Tambah User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
