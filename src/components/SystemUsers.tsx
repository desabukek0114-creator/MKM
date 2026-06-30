import React, { useState, useEffect } from "react";
import { SystemUser } from "../types.js";
import { 
  User, 
  UserCheck, 
  Trash2, 
  Edit, 
  Plus, 
  Check, 
  AlertCircle, 
  ShieldAlert,
  Shield,
  Key,
  X,
  UserPlus
} from "lucide-react";

interface SystemUsersProps {
  currentSystemUser: SystemUser | null;
  onUserChanged: () => void;
}

export default function SystemUsers({ currentSystemUser, onUserChanged }: SystemUsersProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullname: "",
    role: "operator" as "admin" | "operator" | "cashier"
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setError("Gagal memuat pengguna sistem");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat memuat pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      const url = editingUser 
        ? `/api/system/users/${editingUser.id}`
        : `/api/system/users`;
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(editingUser ? "Pengguna berhasil diperbarui!" : "Pengguna baru berhasil ditambahkan!");
        setShowModal(false);
        setEditingUser(null);
        setForm({ username: "", password: "", fullname: "", role: "operator" });
        await fetchUsers();
        onUserChanged();
      } else {
        setError(data.error || "Gagal menyimpan pengguna");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menyimpan pengguna");
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (user.username === "admin") {
      alert("Pengguna utama 'admin' tidak dapat dihapus!");
      return;
    }
    if (currentSystemUser && user.id === currentSystemUser.id) {
      alert("Anda tidak dapat menghapus pengguna yang sedang aktif digunakan!");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna sistem '${user.fullname}' (${user.username})?`)) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/system/users/${user.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg("Pengguna sistem berhasil dihapus!");
        await fetchUsers();
        onUserChanged();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus pengguna");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat menghapus pengguna");
    }
  };

  const handleEditClick = (user: SystemUser) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: user.password || "",
      fullname: user.fullname,
      role: user.role
    });
    setShowModal(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Administrator", color: "bg-purple-50 text-purple-700 border-purple-150" };
      case "operator":
        return { label: "Operator Jaringan", color: "bg-blue-50 text-blue-700 border-blue-150" };
      case "cashier":
        return { label: "Kasir Penjualan", color: "bg-amber-50 text-amber-700 border-amber-150" };
      default:
        return { label: role, color: "bg-slate-50 text-slate-700 border-slate-150" };
    }
  };

  return (
    <div className="space-y-6" id="system-users-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            User System Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur pengguna sistem yang dapat masuk ke aplikasi ini (seperti Administrator, Operator Jaringan, atau Kasir Penjualan).
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setForm({ username: "", password: "", fullname: "", role: "operator" });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 transition"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Pengguna Sistem
        </button>
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

      {/* Main Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const isCurrentUser = currentSystemUser && user.id === currentSystemUser.id;
          const roleInfo = getRoleLabel(user.role);
          
          return (
            <div 
              key={user.id} 
              className={`bg-white border rounded-xl p-5 shadow-sm space-y-4 transition hover:shadow-md relative overflow-hidden ${
                isCurrentUser ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200"
              }`}
            >
              {isCurrentUser && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-2.5 py-0.5 text-[9px] font-bold rounded-bl-lg font-sans">
                  Sesi Aktif
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {user.fullname}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                </div>
              </div>

              <div className="pt-1.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Hak Akses / Group:</span>
                  <span className={`px-2 py-0.5 border text-[10px] rounded font-bold uppercase ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Dibuat Pada:</span>
                  <span className="text-slate-600 font-mono text-[10px]">
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Pass: {user.username === "admin" ? "••••••" : user.password}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition"
                    title="Edit Pengguna"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  {user.username !== "admin" && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role explanation alert */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-blue-500" />
          Keterangan Level Akses Pengguna Sistem:
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-500">
          <li><strong>Administrator:</strong> Memiliki akses penuh terhadap seluruh fitur, termasuk membuat/menghapus router session, mengatur profile PPPoE/Hotspot, mengedit user, dan mengelola pengguna sistem.</li>
          <li><strong>Operator Jaringan:</strong> Memiliki akses membaca semua dashboard, memonitor status router, serta membuat dan mencetak voucher hotspot/PPPoE baru. Namun tidak diizinkan menghapus sesi router, mengedit profil utama, atau mengelola pengguna sistem.</li>
          <li><strong>Kasir Penjualan:</strong> Hanya memiliki akses untuk melihat dasbor laporan penjualan, melihat voucher hotspot/PPPoE aktif, serta menghasilkan dan mencetak voucher (Bulk Generator). Kasir tidak dapat mengubah konfigurasi sistem, terminal CLI, atau profil router.</li>
        </ul>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                {editingUser ? "Edit Pengguna Sistem" : "Tambah Pengguna Sistem Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  placeholder="Contoh: Heru Hendriawan"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Username</label>
                <input
                  type="text"
                  required
                  disabled={editingUser?.username === "admin"}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Contoh: kasirtoko"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Password</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password untuk login"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Hak Akses / Group Role</label>
                <select
                  disabled={editingUser?.username === "admin"}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 bg-white transition disabled:bg-slate-100"
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="operator">Operator Jaringan (Akses Konfigurasi + Cetak)</option>
                  <option value="cashier">Kasir Penjualan (Hanya Cetak & Laporan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
