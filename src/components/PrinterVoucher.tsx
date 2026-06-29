import React, { useState } from "react";
import { RouterSession } from "../types.js";
import { Printer, Settings, ArrowLeft, RefreshCw, Eye, EyeOff, CheckCircle2, ChevronRight, Bookmark } from "lucide-react";

interface PrinterVoucherProps {
  activeSession: RouterSession;
  vouchers: any[]; // Can be PPPoE Secrets or Hotspot Users
  onBack: () => void;
}

export default function PrinterVoucher({
  activeSession,
  vouchers,
  onBack
}: PrinterVoucherProps) {
  // Config state
  const [businessName, setBusinessName] = useState("BUANA NET INDONESIA");
  const [address, setAddress] = useState("Jl. Merpati No. 12, Bali");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [notes, setNotes] = useState("Simpan struk pembayaran ini sebagai bukti resmi.");
  const [templateType, setTemplateType] = useState<'thermal' | 'invoice' | 'card' | 'classic'>('thermal');

  const handlePrint = () => {
    window.print();
  };

  const getFormatDate = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6" id="printer-flow-container">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Cetak Invoice & Voucher ({vouchers.length} akun)</h2>
            <p className="text-slate-500 text-xs font-mono mt-0.5">Router: {activeSession.sessionName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Sekarang (Print)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout Customizer (Hidden on Print) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-fit space-y-4 no-print">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Settings className="h-3.5 w-3.5" />
            Pengaturan Desain Cetak
          </h3>

          <div className="space-y-4 text-xs text-slate-700">
            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Format Kertas / Template</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 font-medium transition"
              >
                <option value="thermal">Thermal Struk Kasir (58mm)</option>
                <option value="invoice">Business Invoice Formal (Letter/A4)</option>
                <option value="card">Voucher Card Mini (Grid fisik)</option>
                <option value="classic">Mikhmon Classic Card (Clean)</option>
              </select>
            </div>

            {/* Business Details */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Nama Usaha / Internet ISP</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Contoh: BUANA NET ISP"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Alamat Usaha</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Merpati Raya No. 12"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Kontak WhatsApp / HP</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Catatan / Footnote</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ketentuan layanan..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 outline-none text-slate-800 resize-none transition"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Display Panel */}
        <div className="lg:col-span-2 bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-inner flex justify-center overflow-auto max-h-[650px] relative">
          
          {/* Watermark label for browser viewing */}
          <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-700 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm no-print">
            <Eye className="h-3.5 w-3.5" /> Live Print Preview
          </div>

          {/* Actual render page */}
          <div className="print-area w-full flex flex-col items-center">
            
            {/* 1. THERMAL TEMPLATE */}
            {templateType === "thermal" && (
              <div className="space-y-6 w-full max-w-[320px]">
                {vouchers.map((voucher, idx) => {
                  const info = voucher.parsedComment || {};
                  return (
                    <div
                      key={voucher.id}
                      className="bg-white text-slate-900 border border-slate-200 shadow-sm p-4 rounded font-mono text-xs w-full relative overflow-hidden print-no-shadow print-no-border"
                      style={{ pageBreakAfter: idx < vouchers.length - 1 ? 'always' : 'auto' }}
                    >
                      {/* Thermal Ticket Head */}
                      <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2 space-y-0.5">
                        <p className="font-bold text-sm tracking-tight">{businessName}</p>
                        <p className="text-[10px] text-slate-600">{address}</p>
                        <p className="text-[10px] text-slate-600">HP: {phone}</p>
                      </div>

                      {/* Receipt Title */}
                      <div className="text-center pb-2.5">
                        <p className="font-bold text-[11px] uppercase tracking-wider">KUITANSI INTERNET RUMAHAN</p>
                        <p className="text-[9px] text-slate-500">Tanggal: {getFormatDate()}</p>
                      </div>

                      {/* Content details */}
                      <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2.5 mb-2 text-[11px]">
                        <div className="flex justify-between">
                          <span>User ID:</span>
                          <span className="font-bold">{voucher.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Password:</span>
                          <span className="font-bold text-slate-800">{voucher.password || "******"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paket Plan:</span>
                          <span className="font-bold">{voucher.profile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jatuh Tempo:</span>
                          <span className="font-bold">{info.expiryDate || "Seterusnya"}</span>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex justify-between items-center py-1 font-bold text-sm mb-3">
                        <span>TOTAL TAGIHAN:</span>
                        <span>
                          {activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}
                        </span>
                      </div>

                      {/* simulated barcode blocks */}
                      <div className="flex flex-col items-center justify-center space-y-1 py-1.5 opacity-80">
                        <div className="flex gap-0.5 h-6">
                          <div className="w-0.5 bg-black" /><div className="w-1.5 bg-black" /><div className="w-0.5 bg-black" /><div className="w-0.5 bg-black" /><div className="w-1.5 bg-black" /><div className="w-0.5 bg-black" /><div className="w-2.5 bg-black" /><div className="w-0.5 bg-black" /><div className="w-1 bg-black" /><div className="w-0.5 bg-black" /><div className="w-1.5 bg-black" /><div className="w-0.5 bg-black" />
                        </div>
                        <span className="text-[8px] text-slate-600 tracking-[0.25em]">{voucher.id.toUpperCase()}</span>
                      </div>

                      {/* Footnote */}
                      <div className="text-center border-t border-dashed border-slate-400 pt-2 mt-2 text-[9px] text-slate-600 leading-normal">
                        <p>{notes}</p>
                        <p className="mt-1 font-bold">Terima Kasih Atas Kepercayaan Anda</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. BUSINESS INVOICE TEMPLATE */}
            {templateType === "invoice" && (
              <div className="space-y-8 w-full max-w-[620px]">
                {vouchers.map((voucher, idx) => {
                  const info = voucher.parsedComment || {};
                  return (
                    <div
                      key={voucher.id}
                      className="bg-white text-slate-900 border border-slate-200 shadow-md p-8 rounded-lg font-sans w-full relative overflow-hidden print-no-shadow print-no-border"
                      style={{ pageBreakAfter: idx < vouchers.length - 1 ? 'always' : 'auto' }}
                    >
                      {/* Logo header */}
                      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5 mb-5">
                        <div className="space-y-1">
                          <h4 className="text-lg font-extrabold text-blue-900 tracking-tight">{businessName}</h4>
                          <p className="text-xs text-slate-500 font-medium">{address}</p>
                          <p className="text-xs text-slate-500 font-medium">WhatsApp: {phone}</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">INVOICE</h2>
                          <p className="text-[10px] font-mono text-slate-500 mt-1">INV-{voucher.id.toUpperCase()}</p>
                        </div>
                      </div>

                      {/* Dates and bill-to */}
                      <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Ditagihkan Kepada:</p>
                          <p className="font-bold text-slate-800 text-sm mt-1">{voucher.name}</p>
                          {info.phone && <p className="text-slate-600 mt-0.5">Kontak: {info.phone}</p>}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-slate-600"><strong>Tanggal Cetak:</strong> {getFormatDate()}</p>
                          <p className="text-slate-600"><strong>Metode Layanan:</strong> {voucher.service === "pppoe" ? "PPPoE Tunneling Client" : "Hotspot Captive Voucher"}</p>
                          <p className="text-rose-600"><strong>Batas Expiry:</strong> {info.expiryDate || "Seterusnya"}</p>
                        </div>
                      </div>

                      {/* Items table */}
                      <table className="w-full text-xs text-left border-collapse mb-8">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="py-2.5 px-3">Deskripsi Layanan</th>
                            <th className="py-2.5 px-3">Uptime Limit</th>
                            <th className="py-2.5 px-3 text-right">Tarif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800">Sewa Bandwidth {voucher.service === "pppoe" ? "PPPoE" : "Hotspot"} - Paket {voucher.profile}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {voucher.service === "pppoe" 
                                  ? `IP Gateway Client: ${voucher.remoteAddress || "Automatis/DHCP"}` 
                                  : `Kode Voucher / User: ${voucher.name}`
                                }
                              </p>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{voucher.limitUptime || "Sesuai Paket"}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800">
                              {activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Summary Section */}
                      <div className="flex justify-between items-start text-xs">
                        <div className="w-2/3 bg-slate-50 p-3 rounded text-slate-500 text-[11px] leading-normal">
                          <p className="font-bold text-slate-600 mb-1">Syarat & Ketentuan:</p>
                          <p>{notes}</p>
                        </div>
                        <div className="w-1/3 text-right space-y-2 pl-4">
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Subtotal:</span>
                            <span>{activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Pajak (PPN 0%):</span>
                            <span>-</span>
                          </div>
                          <div className="flex justify-between font-black text-sm text-blue-900 border-t border-slate-200 pt-2">
                            <span>TOTAL:</span>
                            <span>{activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stamp Sign */}
                      <div className="flex justify-between items-end pt-12 border-t border-slate-100 mt-12 text-xs text-slate-500">
                        <div className="italic text-[10px]">
                          Pembayaran sah setelah divalidasi oleh kasir {businessName}
                        </div>
                        <div className="text-center w-40 space-y-12">
                          <p className="font-bold text-slate-700">Kasir Pembayaran</p>
                          <p className="border-t border-slate-400 font-bold pt-1.5 text-slate-800">{activeSession.username.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. CARD VOUCHER TICKET (GRID) */}
            {templateType === "card" && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-[620px] print:grid-cols-3">
                {vouchers.map((voucher) => {
                  const info = voucher.parsedComment || {};
                  return (
                    <div
                      key={voucher.id}
                      className="bg-white text-slate-900 border-2 border-indigo-500 p-3 rounded-lg font-mono text-[11px] w-full relative flex flex-col justify-between shadow-sm overflow-hidden"
                    >
                      {/* Ticket Header */}
                      <div className="flex justify-between items-center border-b border-dashed border-indigo-200 pb-1.5 mb-1.5">
                        <span className="font-bold text-indigo-700 font-sans tracking-wide truncate text-[10px]">{businessName}</span>
                        <span className="bg-indigo-600 text-white font-sans text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {voucher.service === "pppoe" ? "PPPOE" : "HOTSPOT"}
                        </span>
                      </div>

                      {/* Auth credentials block */}
                      <div className="space-y-1 pb-1.5 border-b border-indigo-100 mb-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Username / Kode:</span>
                          <span className="font-bold text-indigo-900">{voucher.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Password:</span>
                          <span className="font-bold text-indigo-950 bg-indigo-50/50 px-1 rounded">
                            {voucher.password === "same" || !voucher.password ? voucher.name : voucher.password}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Layanan:</span>
                          <span className="text-indigo-700 font-bold">{voucher.profile}</span>
                        </div>
                      </div>

                      {/* Pricing and instructions */}
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="text-[8px] leading-tight text-slate-500">
                          <p>Masa Aktif:</p>
                          <p className="font-bold text-indigo-900">{info.expiryDate || "Seterusnya"}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-600 text-[11px]">
                            {activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}
                          </span>
                        </div>
                      </div>

                      {/* Tiny border visual decoration */}
                      <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-slate-950 rounded-full border border-indigo-500" />
                      <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-slate-950 rounded-full border border-indigo-500" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. CLASSIC MIKHMON CARD */}
            {templateType === "classic" && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-[620px] print:grid-cols-2">
                {vouchers.map((voucher) => {
                  const info = voucher.parsedComment || {};
                  return (
                    <div
                      key={voucher.id}
                      className="bg-white text-slate-900 border border-slate-300 p-3 rounded font-mono text-[10px] w-full flex flex-col justify-between"
                    >
                      <div className="text-center font-bold uppercase pb-1 border-b border-slate-300 text-[10px]">
                        {businessName}
                      </div>
                      <div className="grid grid-cols-3 py-2 text-[10px] gap-x-1">
                        <span className="text-slate-500">User ID:</span>
                        <span className="font-bold col-span-2">{voucher.name}</span>

                        <span className="text-slate-500">Password:</span>
                        <span className="font-bold col-span-2 text-indigo-900">{voucher.password === "same" || !voucher.password ? voucher.name : voucher.password}</span>

                        <span className="text-slate-500">Paket:</span>
                        <span className="font-bold col-span-2 text-slate-800">{voucher.profile}</span>

                        <span className="text-slate-500">Expired:</span>
                        <span className="col-span-2">{info.expiryDate || "-"}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-1 flex justify-between font-bold items-center">
                        <span className="text-[8px] text-slate-500 font-sans uppercase">Mikhmon ROS.6</span>
                        <span className="text-slate-800 text-[11px]">
                          {activeSession.currency} {info.price ? info.price.toLocaleString("id-ID") : "0"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
