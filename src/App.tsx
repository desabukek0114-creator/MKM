import React, { useState, useEffect } from "react";
import { 
  RouterSession, 
  SystemResource, 
  PppoeSecret, 
  PppoeProfile, 
  PppoeActive, 
  MikroTikLog, 
  BulkGeneratorConfig, 
  HotspotUser, 
  HotspotProfile, 
  HotspotActive, 
  SalesTransaction,
  SystemUser
} from "./types.js";
import { RefreshCw } from "lucide-react";
import Layout from "./components/Layout.js";
import Dashboard from "./components/Dashboard.js";
import PppoeSecrets from "./components/PppoeSecrets.js";
import PppoeProfiles from "./components/PppoeProfiles.js";
import ActiveUsers from "./components/ActiveUsers.js";
import VoucherGenerator from "./components/VoucherGenerator.js";
import PrinterVoucher from "./components/PrinterVoucher.js";
import RouterCli from "./components/RouterCli.js";
import Settings from "./components/Settings.js";
import HotspotUsers from "./components/HotspotUsers.js";
import HotspotProfiles from "./components/HotspotProfiles.js";
import HotspotActiveComponent from "./components/HotspotActive.js";
import HotspotBulkGenerator from "./components/HotspotBulkGenerator.js";
import SalesReport from "./components/SalesReport.js";
import MikhmonTools from "./components/MikhmonTools.js";
import SystemUsers from "./components/SystemUsers.js";

export default function App() {
  const [sessions, setSessions] = useState<RouterSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [lastView, setLastView] = useState("dashboard"); // Tracker for returning from print

  // Router specific data states
  const [resource, setResource] = useState<SystemResource | null>(null);
  const [logs, setLogs] = useState<MikroTikLog[]>([]);
  const [secrets, setSecrets] = useState<PppoeSecret[]>([]);
  const [profiles, setProfiles] = useState<PppoeProfile[]>([]);
  const [activeUsers, setActiveUsers] = useState<PppoeActive[]>([]);

  // Hotspot specific data states
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUser[]>([]);
  const [hotspotProfiles, setHotspotProfiles] = useState<HotspotProfile[]>([]);
  const [hotspotActive, setHotspotActive] = useState<HotspotActive[]>([]);

  // System Users states
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [currentSystemUser, setCurrentSystemUser] = useState<SystemUser | null>(null);

  // Sales specific data states
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);

  // Printer specific states
  const [vouchersToPrint, setVouchersToPrint] = useState<any[]>([]);

  // -------------------------------------------------------------
  // Data Fetching and Sync
  // -------------------------------------------------------------

  const fetchSystemUsers = async () => {
    try {
      const res = await fetch("/api/system/users");
      if (res.ok) {
        const data: SystemUser[] = await res.json();
        setSystemUsers(data);
        
        // Find stored user, otherwise default to admin
        const storedUserJson = localStorage.getItem("currentSystemUser");
        let activeUser: SystemUser | null = null;
        if (storedUserJson) {
          try {
            const parsed = JSON.parse(storedUserJson);
            activeUser = data.find(u => u.id === parsed.id) || null;
          } catch (e) {
            console.error(e);
          }
        }
        
        if (!activeUser && data.length > 0) {
          activeUser = data.find(u => u.username === "admin") || data[0];
        }
        
        if (activeUser) {
          setCurrentSystemUser(activeUser);
          localStorage.setItem("currentSystemUser", JSON.stringify(activeUser));
        }
      }
    } catch (err) {
      console.error("Gagal memuat pengguna sistem:", err);
    }
  };

  const handleSwitchSystemUser = (user: SystemUser) => {
    setCurrentSystemUser(user);
    localStorage.setItem("currentSystemUser", JSON.stringify(user));
    
    // Safety check: if the new role has restrictions, force back to dashboard
    const role = user.role;
    if (role === "cashier") {
      const restrictedViews = ["profiles", "hotspot-profiles", "mikhmon-tools", "cli", "system-users", "settings"];
      if (restrictedViews.includes(activeView)) {
        setActiveView("dashboard");
      }
    } else if (role === "operator") {
      const restrictedViews = ["settings", "system-users"];
      if (restrictedViews.includes(activeView)) {
        setActiveView("dashboard");
      }
    }
  };

  // Fetch registered router sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data: RouterSession[] = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat sesi router:", err);
    }
  };

  // Fetch metrics for selected session
  const fetchActiveRouterData = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      // Parallelize fetches for maximum performance
      const [
        resResource, 
        resLogs, 
        resSecrets, 
        resProfiles, 
        resActive,
        resHsUsers,
        resHsProfiles,
        resHsActive,
        resSales
      ] = await Promise.all([
        fetch(`/api/router/${sessionId}/resource`),
        fetch(`/api/router/${sessionId}/logs`),
        fetch(`/api/router/${sessionId}/secrets`),
        fetch(`/api/router/${sessionId}/profiles`),
        fetch(`/api/router/${sessionId}/active`),
        fetch(`/api/router/${sessionId}/hotspot/users`),
        fetch(`/api/router/${sessionId}/hotspot/profiles`),
        fetch(`/api/router/${sessionId}/hotspot/active`),
        fetch(`/api/router/${sessionId}/sales`)
      ]);

      if (resResource.ok) setResource(await resResource.json());
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resSecrets.ok) setSecrets(await resSecrets.json());
      if (resProfiles.ok) setProfiles(await resProfiles.json());
      if (resActive.ok) setActiveUsers(await resActive.json());
      if (resHsUsers.ok) setHotspotUsers(await resHsUsers.json());
      if (resHsProfiles.ok) setHotspotProfiles(await resHsProfiles.json());
      if (resHsActive.ok) setHotspotActive(await resHsActive.json());
      if (resSales.ok) setSalesTransactions(await resSales.json());
    } catch (err) {
      console.error("Error loading router detail stats:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchSessions();
    fetchSystemUsers();
  }, []);

  // Update detail stats when switching sessions
  useEffect(() => {
    if (activeSessionId) {
      fetchActiveRouterData(activeSessionId);
    }
  }, [activeSessionId]);

  // Set up periodic poller for resources, active connections and logs (sync every 5 seconds)
  useEffect(() => {
    if (!activeSessionId) return;

    const interval = setInterval(() => {
      // In print view, skip background polling to optimize CPU
      if (activeView === "print") return;

      fetchActiveRouterData(activeSessionId);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSessionId, activeView]);

  // -------------------------------------------------------------
  // Router operations
  // -------------------------------------------------------------

  const handleAddSession = async (data: Omit<RouterSession, "id">) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const newSession = await res.json();
      await fetchSessions();
      setActiveSessionId(newSession.id);
      setActiveView("dashboard");
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mendaftarkan router");
    }
  };

  const handleDeleteSession = async (id: string) => {
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      // If we are deleting the active session, switch to another first
      if (activeSessionId === id) {
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId("");
        }
      }
      await fetchSessions();
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus router");
    }
  };

  const handleSwitchSession = (id: string) => {
    setActiveSessionId(id);
    setResource(null); // loader state
  };

  // Secrets CRUD
  const handleAddSecret = async (payload: Partial<PppoeSecret>) => {
    const res = await fetch(`/api/router/${activeSessionId}/secrets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menambah secret");
    }
  };

  const handleEditSecret = async (id: string, payload: Partial<PppoeSecret>) => {
    const res = await fetch(`/api/router/${activeSessionId}/secrets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengubah secret");
    }
  };

  const handleDeleteSecret = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/secrets/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus secret");
    }
  };

  const handleClearSalesTransactions = async () => {
    const res = await fetch(`/api/router/${activeSessionId}/sales/clear`, {
      method: "POST"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengosongkan laporan penjualan");
    }
  };

  const handleBulkGenerate = async (config: BulkGeneratorConfig): Promise<PppoeSecret[]> => {
    const res = await fetch(`/api/router/${activeSessionId}/secrets/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    if (res.ok) {
      const data = await res.json();
      await fetchActiveRouterData(activeSessionId);
      return data;
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal generate massal");
    }
  };

  // Profiles CRUD
  const handleAddProfile = async (payload: Partial<PppoeProfile>) => {
    const res = await fetch(`/api/router/${activeSessionId}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal membuat profile");
    }
  };

  const handleEditProfile = async (id: string, payload: Partial<PppoeProfile>) => {
    const res = await fetch(`/api/router/${activeSessionId}/profiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengubah profile");
    }
  };

  const handleDeleteProfile = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/profiles/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus profile");
    }
  };

  // Active Users kick
  const handleKickUser = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/active/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal memutus koneksi pelanggan");
    }
  };

  // Hotspot Users CRUD
  const handleAddHotspotUser = async (payload: Partial<HotspotUser>) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menambah user hotspot");
    }
  };

  const handleEditHotspotUser = async (id: string, payload: Partial<HotspotUser>) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengubah user hotspot");
    }
  };

  const handleDeleteHotspotUser = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/users/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus user hotspot");
    }
  };

  const handleBulkGenerateHotspot = async (config: BulkGeneratorConfig): Promise<HotspotUser[]> => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/users/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    if (res.ok) {
      const data = await res.json();
      await fetchActiveRouterData(activeSessionId);
      return data;
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal generate massal voucher");
    }
  };

  // Hotspot Profiles CRUD
  const handleAddHotspotProfile = async (payload: Partial<HotspotProfile>) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal membuat profile hotspot");
    }
  };

  const handleEditHotspotProfile = async (id: string, payload: Partial<HotspotProfile>) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/profiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengubah profile hotspot");
    }
  };

  const handleDeleteHotspotProfile = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/profiles/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus profile hotspot");
    }
  };

  // Hotspot Active kick
  const handleKickHotspotActive = async (id: string) => {
    const res = await fetch(`/api/router/${activeSessionId}/hotspot/active/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      await fetchActiveRouterData(activeSessionId);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Gagal memutus koneksi voucher");
    }
  };

  // -------------------------------------------------------------
  // Printing Actions
  // -------------------------------------------------------------

  const handlePrintSingleVoucher = (secret: PppoeSecret) => {
    setVouchersToPrint([secret]);
    setLastView(activeView);
    setActiveView("print");
  };

  const handlePrintBulk = (vouchers: PppoeSecret[]) => {
    setVouchersToPrint(vouchers);
    setLastView(activeView);
    setActiveView("print");
  };

  const handleClosePrinter = () => {
    setActiveView(lastView);
    setVouchersToPrint([]);
  };

  // Switch navigation helper
  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <Layout
      activeView={activeView}
      onViewChange={handleViewChange}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSwitchSession={handleSwitchSession}
      currentSystemUser={currentSystemUser}
      systemUsers={systemUsers}
      onSwitchSystemUser={handleSwitchSystemUser}
    >
      {activeSession ? (
        <>
          {activeView === "dashboard" && (
            <Dashboard
              activeSession={activeSession}
              resource={resource}
              logs={logs}
              secretsCount={secrets.length}
              profilesCount={profiles.length}
              activeCount={activeUsers.length}
              hsUsersCount={hotspotUsers.length}
              hsProfilesCount={hotspotProfiles.length}
              hsActiveCount={hotspotActive.length}
              onRefresh={() => fetchActiveRouterData(activeSessionId)}
            />
          )}

          {activeView === "secrets" && (
            <PppoeSecrets
              activeSession={activeSession}
              secrets={secrets}
              profiles={profiles}
              onAddSecret={handleAddSecret}
              onEditSecret={handleEditSecret}
              onDeleteSecret={handleDeleteSecret}
              onPrintTicket={handlePrintSingleVoucher}
            />
          )}

          {activeView === "profiles" && (
            <PppoeProfiles
              activeSession={activeSession}
              profiles={profiles}
              onAddProfile={handleAddProfile}
              onEditProfile={handleEditProfile}
              onDeleteProfile={handleDeleteProfile}
            />
          )}

          {activeView === "active" && (
            <ActiveUsers
              activeSession={activeSession}
              activeUsers={activeUsers}
              onKickUser={handleKickUser}
              onRefresh={() => fetchActiveRouterData(activeSessionId)}
            />
          )}

          {activeView === "bulk" && (
            <VoucherGenerator
              activeSession={activeSession}
              profiles={profiles}
              onBulkGenerate={handleBulkGenerate}
              onPrintBulk={handlePrintBulk}
            />
          )}

          {/* Hotspot Views */}
          {activeView === "hotspot-users" && (
            <HotspotUsers
              activeSession={activeSession}
              users={hotspotUsers}
              profiles={hotspotProfiles}
              onAddUser={handleAddHotspotUser}
              onEditUser={handleEditHotspotUser}
              onDeleteUser={handleDeleteHotspotUser}
              onPrintTicket={handlePrintSingleVoucher}
            />
          )}

          {activeView === "hotspot-profiles" && (
            <HotspotProfiles
              activeSession={activeSession}
              profiles={hotspotProfiles}
              onAddProfile={handleAddHotspotProfile}
              onEditProfile={handleEditHotspotProfile}
              onDeleteProfile={handleDeleteHotspotProfile}
            />
          )}

          {activeView === "hotspot-active" && (
            <HotspotActiveComponent
              activeSession={activeSession}
              activeUsers={hotspotActive}
              onKickUser={handleKickHotspotActive}
              onRefresh={() => fetchActiveRouterData(activeSessionId)}
            />
          )}

          {activeView === "hotspot-bulk" && (
            <HotspotBulkGenerator
              activeSession={activeSession}
              profiles={hotspotProfiles}
              onGenerateBulk={handleBulkGenerateHotspot}
              onPrintBatch={handlePrintBulk}
            />
          )}

          {activeView === "mikhmon-tools" && (
            <MikhmonTools
              activeSession={activeSession}
              onRefreshParent={() => fetchActiveRouterData(activeSessionId)}
            />
          )}

          {activeView === "system-users" && (
            <SystemUsers
              currentSystemUser={currentSystemUser}
              onUserChanged={fetchSystemUsers}
            />
          )}

          {activeView === "sales-report" && (
            <SalesReport
              activeSession={activeSession}
              transactions={salesTransactions}
              onClearTransactions={handleClearSalesTransactions}
              onRefresh={() => fetchActiveRouterData(activeSessionId)}
            />
          )}

          {activeView === "cli" && (
            <RouterCli
              activeSession={activeSession}
            />
          )}

          {activeView === "settings" && (
            <Settings
              sessions={sessions}
              activeSessionId={activeSessionId}
              onAddSession={handleAddSession}
              onDeleteSession={handleDeleteSession}
              onSwitchSession={handleSwitchSession}
            />
          )}

          {activeView === "print" && (
            <PrinterVoucher
              activeSession={activeSession}
              vouchers={vouchersToPrint}
              onBack={handleClosePrinter}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center p-6 text-slate-400 font-sans">
          <RefreshCw className="h-10 w-10 text-slate-400 animate-spin mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Menghubungkan Sesi RouterOS...</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Pastikan server backend di port 3000 berjalan dan inisialisasi simulasi router selesai.
          </p>
        </div>
      )}
    </Layout>
  );
}
