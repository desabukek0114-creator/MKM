import React, { useState } from "react";
import { PppoeProfile, RouterSession, BulkGeneratorConfig, PppoeSecret } from "../types.js";
import { Sparkles, Printer, RefreshCw, Layers, CheckCircle2, AlertTriangle, FileText, Settings, Key, UserCheck } from "lucide-react";

interface VoucherGeneratorProps {
  activeSession: RouterSession;
  profiles: PppoeProfile[];
  onBulkGenerate: (config: BulkGeneratorConfig) => Promise<PppoeSecret[]>;
  onPrintBulk: (vouchers: PppoeSecret[]) => void;
}

export default function VoucherGenerator({
  activeSession,
  profiles,
  onBulkGenerate,
  onPrintBulk
}: VoucherGeneratorProps) {
  // Form State
  const [qty, setQty] = useState(10);
  const [prefix, setPrefix] = useState("kos_");
  const [userLength, setUserLength] = useState(5);
  const [charType, setCharType] = useState<'lower' | 'upper' | 'numeric' | 'mix'>("mix");
  const [profile, setProfile] = useState("");
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState("30");
  const [passMode, setPassMode] = useState<'same' | 'diff' | 'upnp'>("diff");

  // Status State
  const [generatedVouchers, setGeneratedVouchers] = useState<PppoeSecret[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize profile selection
  React.useEffect(() => {
    if (profiles.length > 0 && !profile) {
      setProfile(profiles[0].name);
      setPrice(profiles[0].price ? String(profiles[0].price) : "150000");
    }
  }, [profiles, profile]);

  const handleProfileChange = (profileName: string) => {
    setProfile(profileName);
    const selected = profiles.find(p => p.name === profileName);
    if (selected) {
      if (selected.price) setPrice(String(selected.price));
      if (selected.validity) {
        const valNum = parseInt(selected.validity, 10);
        setValidity(isNaN(valNum) ? "30" : String(valNum));
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setGeneratedVouchers([]);

    if (qty <= 0 || qty > 100) {
      setErrorMsg("Jumlah voucher yang dibuat harus di antara 1 - 100 per proses.");
      return;
    }

    setIsGenerating(true);

    const config: BulkGeneratorConfig = {
      qty,
      prefix,
      userLength,
      charType,
      profile,
      price: price ? Number(price) : 0,
      validity: validity + "d",
      passMode
    };

    try {
      const result = await onBulkGenerate(config);
      setGeneratedVouchers(result);
      setSuccessMsg(`Berhasil membuat ${result.length} Voucher PPPoE Secret baru untuk profile '${profile}'!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat voucher secara massal.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" id="bulk-generator-container">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Bulk Voucher Generator
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Buat banyak akun PPPoE secara instan sekaligus (untuk voucher bulanan, harian, atau rumah sewaan).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-fit">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            Konfigurasi Voucher
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs text-slate-700">
            {/* Qty & Prefix */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Jumlah Voucher</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Prefix (Awalan)</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. kos_"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
            </div>

            {/* Char Length & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Panjang Karakter</label>
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={userLength}
                  onChange={(e) => setUserLength(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Tipe Karakter</label>
                <select
                  value={charType}
                  onChange={(e) => setCharType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-700 transition"
                >
                  <option value="mix">Acak Mix (aB5)</option>
                  <option value="lower">Kecil Saja (abc)</option>
                  <option value="upper">Besar Saja (ABC)</option>
                  <option value="numeric">Angka Saja (123)</option>
                </select>
              </div>
            </div>

            {/* Profile Plan selection */}
            <div className="space-y-1">
              <label className="text-slate-500 font-medium">Layanan Profile *</label>
              <select
                value={profile}
                onChange={(e) => handleProfileChange(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-700 transition"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Price & Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Harga Jual ({activeSession.currency})</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150000"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Masa Aktif (hari)</label>
                <input
                  type="number"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  placeholder="30"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none font-mono text-slate-800 transition"
                />
              </div>
            </div>

            {/* Password Login Mode */}
            <div className="space-y-1">
              <label className="text-slate-500 font-medium">Konfigurasi Password</label>
              <select
                value={passMode}
                onChange={(e) => setPassMode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-700 transition"
              >
                <option value="diff">Username & Password berbeda (Lebih Aman)</option>
                <option value="same">Username SAMA dengan Password</option>
                <option value="upnp">Gunakan Password Default "123456"</option>
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs transition mt-4"
              id="btn-generate-bulk"
            >
              {isGenerating ? "Sedang Memproses..." : "Generate Voucher Massal"}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Hasil Pembuatan Voucher
              </h3>
              {generatedVouchers.length > 0 && (
                <button
                  onClick={() => onPrintBulk(generatedVouchers)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition"
                  id="btn-print-generated"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Semua Voucher
                </button>
              )}
            </div>

            {/* Status alerts */}
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

            {/* Vouchers display grid */}
            {generatedVouchers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-1 font-mono text-[11px]" id="generated-vouchers-grid">
                {generatedVouchers.map((v, i) => (
                  <div
                    key={v.id}
                    className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex justify-between text-slate-400 text-[9px] border-b border-slate-200/60 pb-1 mb-1">
                      <span>Voucher #{i + 1}</span>
                      <span>{profile}</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">User:</span>
                        <span className="text-slate-900 font-bold">{v.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pass:</span>
                        <span className="text-blue-600 font-semibold">{v.password}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                <UserCheck className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs">
                  Gunakan form sebelah kiri untuk melakukan generate voucher PPPoE secara instan.
                </p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                  Setelah dibuat, Anda dapat langsung mengunduh atau mencetak kuitansi pelanggan satu per satu maupun kolektif.
                </p>
              </div>
            )}
          </div>

          {generatedVouchers.length > 0 && (
            <div className="text-[10px] text-slate-500 mt-4 border-t border-slate-100 pt-3 flex items-center gap-2 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
              <Printer className="h-4 w-4 text-indigo-500" />
              <span>
                Tip: Tekan tombol <strong>"Cetak Semua Voucher"</strong> di atas untuk membuka layar pencetakan kuitansi yang modern dengan format struk belanja thermal (58mm) atau layout grid A4.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
