import React, { useState, useEffect } from "react";
import { SystemResource, InterfaceTraffic, MikroTikLog, RouterSession } from "../types.js";
import { Cpu, HardDrive, ShieldAlert, Wifi, Activity, Database, DollarSign, RefreshCw, Terminal, Clock, Users, Zap } from "lucide-react";

interface DashboardProps {
  activeSession: RouterSession;
  resource: SystemResource | null;
  logs: MikroTikLog[];
  secretsCount: number;
  profilesCount: number;
  activeCount: number;
  hsUsersCount?: number;
  hsProfilesCount?: number;
  hsActiveCount?: number;
  onRefresh: () => void;
}

export default function Dashboard({
  activeSession,
  resource,
  logs,
  secretsCount,
  profilesCount,
  activeCount,
  hsUsersCount = 0,
  hsProfilesCount = 0,
  hsActiveCount = 0,
  onRefresh
}: DashboardProps) {
  const [trafficHistory, setTrafficHistory] = useState<InterfaceTraffic[]>([]);
  const [selectedInterface, setSelectedInterface] = useState("pppoe-out1");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll live traffic from our backend
  useEffect(() => {
    // Initialize with dummy historic values
    const now = Date.now();
    const history: InterfaceTraffic[] = [];
    for (let i = 15; i >= 0; i--) {
      history.push({
        timestamp: now - i * 2000,
        rxRate: 1500000 + Math.sin(i) * 500000 + (Math.random() - 0.5) * 200000,
        txRate: 400000 + Math.cos(i) * 100000 + (Math.random() - 0.5) * 50000
      });
    }
    setTrafficHistory(history);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/router/${activeSession.id}/traffic`);
        if (res.ok) {
          const data: InterfaceTraffic = await res.json();
          setTrafficHistory(prev => {
            const updated = [...prev, data];
            if (updated.length > 20) {
              updated.shift();
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("Error polling traffic:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeSession.id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Format bits/bytes helper
  const formatSpeed = (bps: number) => {
    if (bps >= 1000000) {
      return `${(bps / 1000000).toFixed(2)} Mbps`;
    }
    if (bps >= 1000) {
      return `${(bps / 100).toFixed(1)} Kbps`;
    }
    return `${bps} bps`;
  };

  const formatSize = (bytes: number) => {
    const mib = bytes / (1024 * 1024);
    if (mib >= 1024) {
      return `${(mib / 1024).toFixed(1)} GiB`;
    }
    return `${Math.round(mib)} MiB`;
  };

  // Custom SVG path generators for Traffic Graph
  const maxVal = Math.max(...trafficHistory.map(d => Math.max(d.rxRate, d.txRate)), 1000000);
  const width = 600;
  const height = 180;
  const padding = 20;

  const getPoints = (key: "rxRate" | "txRate") => {
    if (trafficHistory.length === 0) return "";
    return trafficHistory
      .map((d, index) => {
        const x = padding + (index / (trafficHistory.length - 1)) * (width - padding * 2);
        const y = height - padding - (d[key] / maxVal) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const getAreaPoints = (key: "rxRate" | "txRate") => {
    const linePoints = getPoints(key);
    if (!linePoints) return "";
    const startX = padding;
    const endX = width - padding;
    const bottomY = height - padding;
    return `${startX},${bottomY} ${linePoints} ${endX},${bottomY}`;
  };

  // Estimate monthly earnings from both services
  const estEarnings = (secretsCount * 135000) + (hsUsersCount * 20000);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Upper Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeSession.sessionName}
            </h1>
          </div>
          <p className="text-slate-500 text-xs font-mono mt-1">
            Router IP: {activeSession.ipAddress} | API Port: {activeSession.apiPort} | User: {activeSession.username}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          id="btn-refresh-dashboard"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Sinkronisasi Ulang
        </button>
      </div>

      {/* Main Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Stat 1: PPPoE Active */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">PPPoE Aktif</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600 font-mono">{activeCount}</span>
              <span className="text-slate-400 text-xs">/ {secretsCount} akun</span>
            </div>
            <p className="text-emerald-600 text-[10px] flex items-center gap-1 font-mono">
              <Activity className="h-3 w-3 animate-pulse" /> Tunneled Online
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 2: Hotspot Active */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-violet-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Hotspot Aktif</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-violet-600 font-mono">{hsActiveCount}</span>
              <span className="text-slate-400 text-xs">/ {hsUsersCount} voucher</span>
            </div>
            <p className="text-emerald-600 text-[10px] flex items-center gap-1 font-mono">
              <Wifi className="h-3 w-3 animate-pulse" /> Wireless Sessions
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
            <Wifi className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 3: PPPoE + Hotspot Profiles */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-indigo-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Layanan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-600 font-mono">{profilesCount + hsProfilesCount}</span>
              <span className="text-slate-400 text-xs">paket profil</span>
            </div>
            <p className="text-slate-500 text-[10px] font-mono">
              PPPoE: {profilesCount} | Hotspot: {hsProfilesCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Zap className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 4: Estimated Earnings */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Estimasi Omset</p>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-500 font-semibold text-sm">{activeSession.currency}</span>
              <span className="text-2xl font-bold text-emerald-600 font-mono">
                {estEarnings.toLocaleString("id-ID")}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-mono">
              Billing PPPoE & Hotspot
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Traffic Chart & System info row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Traffic Monitor */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Traffic Real-time Monitor</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Interface:</span>
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="pppoe-out1">pppoe-out1 (WAN)</option>
                <option value="ether1">ether1 (LAN-Main)</option>
                <option value="ether2-master">ether2-master</option>
                <option value="hotspot-bridge">hotspot-bridge</option>
              </select>
            </div>
          </div>

          {/* SVG Custom Line Graph */}
          <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl relative overflow-hidden" id="traffic-svg-chart">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              {/* Gradients */}
              <defs>
                <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />

              {/* RX (Download) Area */}
              <polygon points={getAreaPoints("rxRate")} fill="url(#rxGrad)" />
              {/* RX Line */}
              <polyline points={getPoints("rxRate")} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

              {/* TX (Upload) Area */}
              <polygon points={getAreaPoints("txRate")} fill="url(#txGrad)" />
              {/* TX Line */}
              <polyline points={getPoints("txRate")} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeDasharray="1,1" />
            </svg>

            {/* Float Legend details */}
            <div className="absolute top-4 left-4 flex gap-4 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Download (RX):</span>
                <span className="text-emerald-600 font-bold">
                  {trafficHistory.length > 0 ? formatSpeed(trafficHistory[trafficHistory.length - 1].rxRate) : "0 bps"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-slate-500">Upload (TX):</span>
                <span className="text-blue-600 font-bold">
                  {trafficHistory.length > 0 ? formatSpeed(trafficHistory[trafficHistory.length - 1].txRate) : "0 bps"}
                </span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 text-[9px] text-slate-400 font-mono">
              Real-time polling (2s)
            </div>
          </div>
        </div>

        {/* System Resource Column */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Sumber Daya Router</h3>
          </div>

          {resource ? (
            <div className="space-y-4" id="resource-stats">
              {/* Uptime and Board */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Tipe Router</span>
                  <span className="text-slate-800 font-semibold">{resource.boardName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">RouterOS</span>
                  <span className="text-slate-800 font-semibold">{resource.version}</span>
                </div>
                <div className="col-span-2 space-y-1 pt-1.5 border-t border-slate-200/60 mt-1">
                  <span className="text-slate-400 block text-[10px]">Uptime</span>
                  <span className="text-cyan-600 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {resource.uptime}
                  </span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3">
                {/* CPU usage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Beban CPU (Load)</span>
                    <span className={`${resource.cpuLoad > 60 ? "text-red-500 font-bold" : "text-slate-700"}`}>
                      {resource.cpuLoad}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                       className={`h-full transition-all duration-700 ${
                        resource.cpuLoad > 80
                          ? "bg-red-500"
                          : resource.cpuLoad > 50
                          ? "bg-amber-500"
                          : "bg-cyan-500"
                      }`}
                      style={{ width: `${resource.cpuLoad}%` }}
                    />
                  </div>
                </div>

                {/* Memory usage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Memory Bebas</span>
                    <span className="text-slate-700">
                      {formatSize(resource.freeMemory)} / {formatSize(resource.totalMemory)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${(resource.freeMemory / resource.totalMemory) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Storage usage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">HDD Bebas</span>
                    <span className="text-slate-700">
                      {formatSize(resource.freeHdd)} / {formatSize(resource.totalHdd)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${(resource.freeHdd / resource.totalHdd) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-slate-200 rounded-lg bg-slate-50/50">
              <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
              <p className="text-xs text-slate-500 mt-2">Menunggu respons RouterOS...</p>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Catatan Router (System Logs)</h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded">
            MikroTik SysLog Stream
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50 max-h-[180px] overflow-y-auto font-mono text-[11px]" id="logs-stream-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-4 font-semibold w-20">Waktu</th>
                <th className="py-2.5 px-4 font-semibold w-24">Topik</th>
                <th className="py-2.5 px-4 font-semibold">Pesan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => {
                  let textStyle = "text-slate-700";
                  if (log.type === "success") textStyle = "text-emerald-600";
                  if (log.type === "warning") textStyle = "text-amber-600 font-medium";
                  if (log.type === "error") textStyle = "text-rose-600 font-bold";

                  return (
                    <tr key={log.id} className="hover:bg-slate-100/50 transition">
                      <td className="py-2 px-4 text-slate-400">{log.time}</td>
                      <td className="py-2 px-4">
                        <span className="bg-slate-200/60 border border-slate-300/50 text-[10px] px-1.5 py-0.5 rounded text-slate-600">
                          {log.topics.join(",")}
                        </span>
                      </td>
                      <td className={`py-2 px-4 ${textStyle}`}>{log.message}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                    Belum ada log log masuk.
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
