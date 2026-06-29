import React, { useState } from "react";
import { HotspotProfile, RouterSession, HotspotUser } from "../types.js";
import { Sparkles, ArrowRight, CheckCircle, FileSpreadsheet, Copy, Printer, RefreshCw, AlertTriangle } from "lucide-react";

interface HotspotBulkGeneratorProps {
  activeSession: RouterSession;
  profiles: HotspotProfile[];
  onGenerateBulk: (config: any) => Promise<HotspotUser[]>;
  onPrintBatch: (vouchers: HotspotUser[]) => void;
}

export default function HotspotBulkGenerator({
  activeSession,
  profiles,
  onGenerateBulk,
  onPrintBatch
}: HotspotBulkGeneratorProps) {
  const [qty, setQty] = useState("20");
  const [charType, setCharType] = useState("mix"); // lower, upper, numeric, mix
  const [userLength, setUserLength] = useState("5");
  const [prefix, setPrefix] = useState("");
  const [passMode, setPassMode] = useState("same"); // same, upnp (username as pass), separate
  const [profile, setProfile] = useState("");
  const [validity, setValidity] = useState("");
  const [price, setPrice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  
  // Results
  const [generatedBatch, setGeneratedBatch] = useState<HotspotUser[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  // Initialize profile default values
  React.useEffect(() => {
    if (profiles.length > 0 && !profile) {
      const p = profiles[0];
      setProfile(p.name);
      setValidity(p.validity || "1d");
      setPrice(p.price ? String(p.price) : "5000");
    }
  }, [profiles]);

  const handleProfileChange = (profileName: string) => {
    setProfile(profileName);
    const p = profiles.find(prof => prof.name === profileName);
    if (p) {
      setValidity(p.validity || "");
      setPrice(p.price ? String(p.price) : "");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setGeneratedBatch([]);
    
    const count = Number(qty);
    if (isNaN(count) || count <= 0) {
      setError("Jumlah voucher harus minimal 1");
      return;
    }
    if (count > 500) {
      setError("Maksimal pembuatan bulk voucher dalam satu sesi adalah 500 unit");
      return;
    }

    setIsGenerating(true);

    try {
      const config = {
        qty: count,
        charType,
        userLength: Number(userLength) || 5,
        prefix: prefix.trim(),
        passMode,
        profile,
        validity: validity.trim(),
        price: Number(price) || 0
      };

      const result = await onGenerateBulk(config);
      setGeneratedBatch(result);
      setSuccessMsg(`Berhasil membuat ${result.length} voucher hotspot dengan Profile '${profile}'!`);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan bulk generator voucher");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedBatch.length === 0) return;
    const text = generatedBatch.map(u => `Kode: ${u.name} \t Pass: ${u.password || u.name} \t Paket: ${u.profile}`).join("\n");
    navigator.clipboard.writeText(text);
    alert("Daftar voucher berhasil disalin ke clipboard!");
  };

  const exportToCSV = () => {
    if (generatedBatch.length === 0) return;
    const headers = "ID,Kode Voucher,Password,Paket Profile,Komentar\n";
    const rows = generatedBatch.map(u => `${u.id},${u.name},${u.password || u.name},${u.profile},"${u.comment}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mikhmon-vouchers-${profile}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="bulk-generator-container">
      {/* Settings Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-fit">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="h-4.5 w-4.5 text-blue-500" />
          Mikhmon Bulk Voucher Generator
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4 text-xs mt-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Qty */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold">Jumlah Voucher (Qty) *</label>
            <select
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-bold text-slate-800 transition"
            >
              <option value="5">5 Voucher</option>
              <option value="10">10 Voucher</option>
              <option value="20">20 Voucher</option>
              <option value="50">50 Voucher</option>
              <option value="105">100 Voucher</option>
              <option value="250">250 Voucher</option>
            </select>
          </div>

          {/* User profile selection */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold">Pilih Paket Profile *</label>
            <select
              value={profile}
              onChange={(e) => handleProfileChange(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-bold transition"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Length */}
            <div className="space-y-1">
              <label className="text-slate-600 font-bold">Panjang Kode *</label>
              <select
                value={userLength}
                onChange={(e) => setUserLength(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 transition"
              >
                <option value="3">3 Karakter</option>
                <option value="4">4 Karakter</option>
                <option value="5">5 Karakter</option>
                <option value="6">6 Karakter</option>
                <option value="8">8 Karakter</option>
              </select>
            </div>

            {/* Prefix */}
            <div className="space-y-1">
              <label className="text-slate-600 font-bold">Prefix Awalan</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Contoh: Net-"
                maxLength={4}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
              />
            </div>
          </div>

          {/* Char type */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold">Kombinasi Karakter *</label>
            <select
              value={charType}
              onChange={(e) => setCharType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-medium transition"
            >
              <option value="mix">Huruf & Angka (a8k2n)</option>
              <option value="lower">Hanya Huruf Kecil (xkywt)</option>
              <option value="upper">Hanya Huruf Kapital (BKHWR)</option>
              <option value="numeric">Hanya Angka (72948)</option>
            </select>
          </div>

          {/* Password Mode */}
          <div className="space-y-1">
            <label className="text-slate-600 font-bold">Mode Kode / Password</label>
            <select
              value={passMode}
              onChange={(e) => setPassMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-medium transition"
            >
              <option value="same">Username = Password (Sangat Populer)</option>
              <option value="upnp">Tanpa Password (UP=NP / Kolom Password Kosong)</option>
              <option value="separate">Karakter Terpisah (Username Berbeda Password)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            {/* Validity info */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium">Batas Hari (Validity)</label>
              <input
                type="text"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                placeholder="e.g. 1d or 30d"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
              />
            </div>

            {/* Price override */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium">Harga Voucher ({activeSession.currency})</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2 outline-none font-mono text-slate-800 transition"
              />
            </div>
          </div>

          {/* Submit btn */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg transition shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Sedang Membuat Batch..." : "GENERATE BATCH VOUCHER"}
          </button>
        </form>
      </div>

      {/* Results Display */}
      <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col min-h-[450px]">
        {generatedBatch.length > 0 ? (
          <div className="space-y-4 flex flex-col h-full flex-1">
            {/* Batch Header actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs">{successMsg}</h4>
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Voucher telah tersimpan ke dalam database router.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Salin Teks
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                  Unduh CSV
                </button>
                <button
                  onClick={() => onPrintBatch(generatedBatch)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Lembaran
                </button>
              </div>
            </div>

            {/* List Table Preview */}
            <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3 w-12 text-center">No.</th>
                    <th className="p-3">Kode / Username</th>
                    <th className="p-3">Password</th>
                    <th className="p-3">Paket Profile</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3">Komentar Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {generatedBatch.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center text-slate-400 font-sans">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {user.name}
                      </td>
                      <td className="p-3 text-slate-600">
                        {user.password === "" || user.password === "same" ? (
                          <span className="text-slate-400 font-sans italic text-[10px]">Sama dengan nama</span>
                        ) : (
                          user.password
                        )}
                      </td>
                      <td className="p-3 font-sans">
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 font-medium px-2 py-0.5 rounded-full text-[10px]">
                          {user.profile}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-bold">
                        {activeSession.currency} {price || "0"}
                      </td>
                      <td className="p-3 text-slate-400 font-sans text-[10px] truncate max-w-[150px]" title={user.comment}>
                        {user.comment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-xs">Siap Membuat Voucher</h4>
            <p className="max-w-xs text-slate-500 mt-1 leading-relaxed">
              Atur parameter di panel kiri dan klik tombol generate untuk membuat puluhan voucher secara instan.
            </p>
            <div className="flex items-center gap-1.5 mt-5 text-[10px] text-slate-400 font-mono">
              <span>Satu Lembar A4</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Muat hingga 60 - 80 tiket voucher</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
