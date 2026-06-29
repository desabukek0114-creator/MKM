import React, { useState, useEffect } from "react";
import { RouterSession, SalesTransaction } from "../types.js";
import { 
  TrendingUp, 
  Search, 
  Calendar, 
  Filter, 
  Printer, 
  Trash2, 
  RefreshCw, 
  Wifi, 
  Radio, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Layers,
  Sparkles,
  Users
} from "lucide-react";

interface SalesReportProps {
  activeSession: RouterSession;
  transactions: SalesTransaction[];
  onClearTransactions: () => Promise<void>;
  onRefresh: () => void;
}

export default function SalesReport({
  activeSession,
  transactions,
  onClearTransactions,
  onRefresh
}: SalesReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // 'all', 'today', 'yesterday', '7days'
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom modal state for delete/clear confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Trigger manual refresh
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Search filter (name or profile)
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.profile.toLowerCase().includes(searchQuery.toLowerCase());

    // Service filter
    const matchesService = serviceFilter === "all" || tx.service === serviceFilter;

    // Profile filter
    const matchesProfile = profileFilter === "all" || tx.profile === profileFilter;

    // Date range filter
    let matchesDate = true;
    const txDate = new Date(tx.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if (dateRangeFilter === "today") {
      matchesDate = txDate >= today;
    } else if (dateRangeFilter === "yesterday") {
      const endOfYesterday = new Date(today);
      matchesDate = txDate >= yesterday && txDate < endOfYesterday;
    } else if (dateRangeFilter === "7days") {
      matchesDate = txDate >= sevenDaysAgo;
    }

    return matchesSearch && matchesService && matchesProfile && matchesDate;
  });

  // Calculate unique profiles for filter dropdown
  const uniqueProfiles = Array.from(new Set(transactions.map(tx => tx.profile)));

  // Calculate metrics
  const totalRevenue = filteredTransactions.reduce((acc, tx) => acc + tx.price, 0);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRevenue = filteredTransactions
    .filter(tx => new Date(tx.timestamp) >= todayStart)
    .reduce((acc, tx) => acc + tx.price, 0);

  const hotspotCount = filteredTransactions.filter(tx => tx.service === "hotspot").length;
  const pppoeCount = filteredTransactions.filter(tx => tx.service === "pppoe").length;

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, serviceFilter, profileFilter, dateRangeFilter]);

  // Generate data for past 7 days chart
  const getChartData = () => {
    const data: { label: string; revenue: number; count: number }[] = [];
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayTxs = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= d && txDate < nextD;
      });

      const revenue = dayTxs.reduce((sum, tx) => sum + tx.price, 0);
      const label = i === 0 ? "Hari ini" : `${d.getDate()}/${d.getMonth() + 1}`;
      
      data.push({
        label,
        revenue,
        count: dayTxs.length
      });
    }
    return data;
  };

  const chartData = getChartData();
  const maxRevenueInChart = Math.max(...chartData.map(d => d.revenue)) || 10000;

  // Print report trigger
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pencetakan laporan. Silakan izinkan popup!");
      return;
    }

    const rowsHtml = filteredTransactions.map((tx, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(tx.timestamp).toLocaleString("id-ID")}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; font-family: monospace;">${tx.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-transform: uppercase;">${tx.service}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${tx.profile}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${activeSession.currency} ${tx.price.toLocaleString("id-ID")}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${tx.operator}</td>
      </tr>
    `).join("");

    const totalRevFormatted = `${activeSession.currency} ${totalRevenue.toLocaleString("id-ID")}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Penjualan - ${activeSession.sessionName}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 30px; }
            h2 { text-transform: uppercase; margin-bottom: 5px; }
            .meta { margin-bottom: 25px; font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 10px; text-align: left; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h2>Laporan Penjualan Vocer & Member</h2>
          <div class="meta">
            <strong>Router:</strong> ${activeSession.sessionName} (${activeSession.ipAddress})<br/>
            <strong>Tanggal Laporan:</strong> ${new Date().toLocaleString("id-ID")}<br/>
            <strong>Filter Periode:</strong> ${dateRangeFilter.toUpperCase()}<br/>
            <strong>Total Item Terjual:</strong> ${filteredTransactions.length} (Hotspot: ${hotspotCount}, PPPoE: ${pppoeCount})
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal & Waktu</th>
                <th>Nama / Kode Vocer</th>
                <th>Layanan</th>
                <th>Paket / Profil</th>
                <th style="text-align: right;">Pendapatan</th>
                <th style="text-align: center;">Kasir</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="5" style="border: 1px solid #ddd; padding: 10px; text-align: right;">TOTAL PENDAPATAN:</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: green;">${totalRevFormatted}</td>
                <td style="border: 1px solid #ddd; padding: 10px;"></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Dicetak secara otomatis via SIMULASI MIKHMON ROS</p>
            <br/><br/>
            <p>_______________________<br/>Administrator</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Perform transaction clearing safely
  const handleClearConfirmClick = async () => {
    setIsClearing(true);
    try {
      await onClearTransactions();
      setShowClearConfirm(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus log laporan.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6" id="sales-report-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" /> Laporan Penjualan
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Pantau dan cetak pendapatan hasil penjualan vocer Hotspot serta akun member PPPoE dari router <span className="font-semibold text-slate-700">{activeSession.sessionName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Laporan
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Pendapatan</p>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs border border-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-2">
            {activeSession.currency} {totalRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-slate-500 text-[10px] mt-1 font-mono">
            Dari {filteredTransactions.length} penjualan terfilter
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-indigo-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Hari Ini (Today)</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs border border-indigo-100">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-600 font-mono mt-2">
            {activeSession.currency} {todayRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-slate-500 text-[10px] mt-1 font-mono">
            Penjualan baru hari ini
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-amber-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Vocer Hotspot</p>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs border border-amber-100">
              <Wifi className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 font-mono mt-2">
            {hotspotCount} <span className="text-xs text-slate-400 font-sans">item</span>
          </p>
          <p className="text-slate-500 text-[10px] mt-1 font-mono">
            Rasio: {filteredTransactions.length ? Math.round((hotspotCount / filteredTransactions.length) * 100) : 0}% dari total
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-sky-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Member PPPoE</p>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs border border-sky-100">
              <Radio className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-sky-600 font-mono mt-2">
            {pppoeCount} <span className="text-xs text-slate-400 font-sans">item</span>
          </p>
          <p className="text-slate-500 text-[10px] mt-1 font-mono">
            Rasio: {filteredTransactions.length ? Math.round((pppoeCount / filteredTransactions.length) * 100) : 0}% dari total
          </p>
        </div>
      </div>

      {/* Daily Sales Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Daily Revenue Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-slate-400" /> Grafik Penjualan 7 Hari Terakhir
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Mata Uang: {activeSession.currency}</span>
          </div>

          <div className="h-56 w-full flex items-end justify-between px-2 pt-6 relative border-b border-slate-200">
            {/* Grid Helper Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1 pt-6 text-[9px] text-slate-300 font-mono">
              <div className="border-t border-slate-100 w-full pt-1">
                Max: {activeSession.currency} {maxRevenueInChart.toLocaleString("id-ID")}
              </div>
              <div className="border-t border-slate-100 w-full pt-1">
                {activeSession.currency} {Math.round(maxRevenueInChart / 2).toLocaleString("id-ID")}
              </div>
              <div className="w-full"></div>
            </div>

            {/* Bars */}
            {chartData.map((d, idx) => {
              const heightPct = maxRevenueInChart > 0 ? (d.revenue / maxRevenueInChart) * 80 + 5 : 5; // offset for 0
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-36 bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none transition duration-150 flex flex-col items-center">
                    <span className="font-bold">{activeSession.currency} {d.revenue.toLocaleString("id-ID")}</span>
                    <span>{d.count} transaksi</span>
                    <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mt-0.5"></div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-8 sm:w-12 bg-slate-100 rounded-t-md relative flex items-end justify-center overflow-hidden transition-all duration-300 group-hover:bg-slate-200/75 h-44">
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        idx === 6 
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                          : "bg-gradient-to-t from-slate-400 to-slate-300 group-hover:from-indigo-400 group-hover:to-indigo-300"
                      }`}
                    ></div>
                    {d.count > 0 && (
                      <span className="absolute bottom-1 text-[9px] font-bold text-slate-800 bg-white/70 px-1 rounded font-mono">
                        {d.count}x
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[10px] mt-2 font-mono ${idx === 6 ? "font-bold text-emerald-600" : "text-slate-500"}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Profiles & Packages */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-slate-400" /> Profil Paket Terlaris
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada data penjualan tercatat.
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Aggregate Profiles by revenue and counts */}
                {Array.from(
                  transactions.reduce((acc, tx) => {
                    const existing = acc.get(tx.profile) || { count: 0, revenue: 0, service: tx.service };
                    acc.set(tx.profile, {
                      count: existing.count + 1,
                      revenue: existing.revenue + tx.price,
                      service: tx.service
                    });
                    return acc;
                  }, new Map<string, { count: number; revenue: number; service: string }>())
                )
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 4)
                  .map((prof, i) => (
                    <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-slate-50 last:border-none">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          {prof.service === "hotspot" ? (
                            <Wifi className="h-3 w-3 text-amber-500" />
                          ) : (
                            <Radio className="h-3 w-3 text-sky-500" />
                          )}
                          <span className="font-semibold text-slate-700">{prof.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Terjual {prof.count}x vocer</span>
                      </div>
                      <span className="font-bold font-mono text-slate-800">
                        {activeSession.currency} {prof.revenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Menganalisis profil vocer teraktif untuk efisiensi server.</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Area */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        {/* Filters Panel */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari vocer / profil..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Service filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none w-full"
            >
              <option value="all">Semua Layanan</option>
              <option value="hotspot">Hotspot Only</option>
              <option value="pppoe">PPPoE Member Only</option>
            </select>
          </div>

          {/* Profile filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={profileFilter}
              onChange={e => setProfileFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none w-full"
            >
              <option value="all">Semua Profile</option>
              {uniqueProfiles.map((prof, i) => (
                <option key={i} value={prof}>{prof}</option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={dateRangeFilter}
              onChange={e => setDateRangeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none w-full"
            >
              <option value="all">Semua Periode</option>
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="7days">7 Hari Terakhir</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="sales-report-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Nama / Kode Vocer</th>
                <th className="py-3 px-4 text-center">Tipe Layanan</th>
                <th className="py-3 px-4">Paket / Profile</th>
                <th className="py-3 px-4 text-right">Harga (Price)</th>
                <th className="py-3 px-4 text-center">Kasir / Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada transaksi penjualan yang cocok dengan pencarian / filter Anda.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const number = startIndex + idx + 1;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{number}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(tx.timestamp).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-slate-900 tracking-wide">
                        {tx.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.service === "hotspot" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase font-mono">
                            <Wifi className="h-3 w-3" /> Hotspot
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase font-mono">
                            <Radio className="h-3 w-3" /> PPPoE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {tx.profile}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-800">
                        {activeSession.currency} {tx.price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {tx.operator}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">{startIndex + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> dari <span className="font-semibold text-slate-700">{filteredTransactions.length}</span> transaksi terjual
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs text-slate-600 px-3 font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION MODAL (Bypasses window.confirm for iframe environments) */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-rose-50/50">
              <span className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Konfirmasi Reset Laporan
                </h3>
                <p className="text-[10px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 text-xs text-slate-600 space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus seluruh riwayat log laporan penjualan vocer Hotspot dan member PPPoE untuk sesi router <span className="font-semibold text-slate-800">{activeSession.sessionName}</span>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 flex gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Peringatan:</strong> Seluruh grafik statistik, total pendapatan, dan log transaksi sebelumnya akan dihapus bersih (reset menjadi 0) di sistem.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition disabled:opacity-50"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleClearConfirmClick}
                disabled={isClearing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Ya, Reset Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
