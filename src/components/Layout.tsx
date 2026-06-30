import React, { useState } from "react";
import { RouterSession, SystemUser } from "../types.js";
import { 
  Cpu, 
  Menu, 
  X, 
  LayoutDashboard, 
  Database, 
  Radio, 
  Settings as SettingsIcon, 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  LogOut, 
  User, 
  ChevronDown, 
  Bell, 
  Layers, 
  Globe,
  Wifi,
  TrendingUp,
  Zap,
  Check
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  sessions: RouterSession[];
  activeSessionId: string;
  onSwitchSession: (id: string) => void;
  currentSystemUser: SystemUser | null;
  systemUsers: SystemUser[];
  onSwitchSystemUser: (user: SystemUser) => void;
  onLogout?: () => void;
}

export default function Layout({
  children,
  activeView,
  onViewChange,
  sessions,
  activeSessionId,
  onSwitchSession,
  currentSystemUser,
  systemUsers,
  onSwitchSystemUser,
  onLogout
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRouterDropdownOpen, setIsRouterDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "header-pppoe", label: "PPPoE Management", isHeader: true },
    { id: "secrets", label: "PPPoE Secrets", icon: User },
    { id: "profiles", label: "PPPoE Profiles", icon: Layers },
    { id: "active", label: "PPPoE Active Links", icon: Radio },
    { id: "header-hotspot", label: "Hotspot Management", isHeader: true },
    { id: "hotspot-users", label: "Hotspot Users", icon: User },
    { id: "hotspot-profiles", label: "Hotspot Profiles", icon: Layers },
    { id: "hotspot-active", label: "Hotspot Active Links", icon: Wifi },
    { id: "hotspot-bulk", label: "Voucher Generator", icon: Sparkles },
    { id: "header-mikhmon", label: "Mikhmon Expired Engine", isHeader: true },
    { id: "mikhmon-tools", label: "Mikhmon Integration", icon: Zap },
    { id: "header-system", label: "System & Laporan", isHeader: true },
    { id: "sales-report", label: "Laporan Penjualan", icon: TrendingUp },
    { id: "cli", label: "Router CLI Terminal", icon: Terminal },
    { id: "system-users", label: "User System Admin", icon: ShieldCheck },
    { id: "settings", label: "Sesi Router Settings", icon: SettingsIcon },
  ];

  // Role based filtering of menu items
  const filteredMenuItems = menuItems.filter(item => {
    if (item.isHeader) {
      // Let's filter out headers if they have no visible child items below them
      if (item.id === "header-mikhmon") {
        return currentSystemUser?.role !== "cashier";
      }
      return true;
    }
    
    const role = currentSystemUser?.role || "admin";
    
    if (role === "cashier") {
      // Cashier cannot edit core profiles, router sessions, cli, or mikhmon scripts/system users
      const restricted = ["profiles", "hotspot-profiles", "mikhmon-tools", "cli", "system-users", "settings"];
      if (restricted.includes(item.id)) return false;
    } else if (role === "operator") {
      // Operator cannot edit router sessions or system-users
      const restricted = ["settings", "system-users"];
      if (restricted.includes(item.id)) return false;
    }
    return true;
  });

  const handleSwitchRouter = (id: string) => {
    onSwitchSession(id);
    setIsRouterDropdownOpen(false);
    // Notification action
    setIsNotifyOpen(true);
    setTimeout(() => setIsNotifyOpen(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans select-none antialiased">
      
      {/* ----------------------------------------------------------- */}
      {/* 1. DESKTOP SIDEBAR */}
      {/* ----------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 no-print">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg shadow-md shadow-blue-500/5">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wider uppercase font-mono">
              Mikhmon ROS.6
            </h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans">
              Premium Portal v3
            </span>
          </div>
        </div>

        {/* Router Selector Dropdown inside Sidebar */}
        <div className="px-4 py-4 border-b border-slate-100 relative">
          <button
            onClick={() => setIsRouterDropdownOpen(!isRouterDropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:bg-slate-100 p-2.5 rounded-lg text-xs font-mono text-slate-700 transition"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate font-bold text-slate-900 text-[11px]">
                {activeSession ? activeSession.sessionName : "Connect Router..."}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isRouterDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Router switcher options list */}
          {isRouterDropdownOpen && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-30 overflow-hidden text-xs py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1 border-b border-slate-100 mb-1">
                Pilih Sesi Router:
              </p>
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSwitchRouter(s.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center justify-between ${
                    s.id === activeSessionId ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-600"
                  }`}
                >
                  <span className="truncate font-mono">{s.sessionName}</span>
                  {s.id === activeSessionId && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            if (item.isHeader) {
              return (
                <div 
                  key={item.id} 
                  className="px-3 pt-3 pb-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono"
                >
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon!;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer credit */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/20 text-[10px] text-slate-400 text-center font-mono space-y-1">
          <p>Mikhmon PPPoE v3.4 Clone</p>
          <p>© 2026. Laksa19 mod heruhendri</p>
        </div>
      </aside>

      {/* ----------------------------------------------------------- */}
      {/* 2. MOBILE HEADER & NAVIGATION */}
      {/* ----------------------------------------------------------- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-40 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h1 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-900">
              MIKHMON PPPOE
            </h1>
          </div>
        </div>

        {/* Mobile active router indicator */}
        <div className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1.5 max-w-[130px] truncate">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{activeSession?.sessionName}</span>
        </div>

        {/* Sliding Drawer for Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white/95 z-30 pt-16 flex flex-col p-4 animate-in fade-in duration-200">
            {/* Quick Router Swapper for Mobile */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cabang Router:</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleSwitchRouter(s.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded text-[11px] font-mono border whitespace-nowrap shrink-0 transition ${
                      s.id === activeSessionId
                        ? "bg-blue-600 border-blue-500 text-white font-bold"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {s.sessionName}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            <div className="space-y-1 overflow-y-auto flex-1">
              {filteredMenuItems.map((item) => {
                if (item.isHeader) {
                  return (
                    <div 
                      key={item.id} 
                      className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono"
                    >
                      {item.label}
                    </div>
                  );
                }
                const Icon = item.icon!;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
                      isActive 
                        ? "bg-slate-900 text-white" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
              Mikhmon PPPoE Premium ROS.6
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. MAIN WORKSPACE CONTENT */}
      {/* ----------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto pt-16 lg:pt-0">
        
        {/* Top Header of page (Desktop only) */}
        <header className="hidden lg:flex h-16 border-b border-slate-200/80 bg-white px-6 items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-600">
              Router Board Status: <strong className="text-emerald-600">ONLINE (ROUTING)</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Quick alert notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
              </button>

              {/* Notification Slide Drawer */}
              {isNotifyOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 p-4 space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Notifikasi Sistem
                  </h4>
                  <div className="space-y-2 text-[11px] font-sans text-slate-700">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200/60 space-y-1">
                      <div className="flex justify-between font-bold text-blue-600 font-mono">
                        <span>Router Swapped</span>
                        <span>Baru</span>
                      </div>
                      <p className="text-slate-500 leading-normal">
                        Sesi aktif dialihkan ke <strong>{activeSession.sessionName}</strong>. Semua statistik disinkronkan.
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200/60 space-y-1">
                      <div className="flex justify-between font-bold text-emerald-600">
                        <span>Database Sinkron</span>
                        <span>10:14</span>
                      </div>
                      <p className="text-slate-500 leading-normal">
                        Koneksi API aman dan berjalan lancar dengan bandwidth stabilizer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Dynamic System User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition text-left"
              >
                <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-bold text-slate-800">{currentSystemUser ? currentSystemUser.fullname : "Sistem User"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Role: {currentSystemUser ? currentSystemUser.role.toUpperCase() : "GUEST"}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 py-1.5 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Ganti User Aktif:</p>
                  </div>
                  {systemUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchSystemUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center justify-between ${
                        currentSystemUser && u.id === currentSystemUser.id ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-600"
                      }`}
                    >
                      <div className="truncate">
                        <span className="block font-bold">{u.fullname}</span>
                        <span className="text-[9px] text-slate-400 font-mono">@{u.username} ({u.role})</span>
                      </div>
                      {currentSystemUser && u.id === currentSystemUser.id && (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                  {onLogout && (
                    <div className="border-t border-slate-100 mt-1.5 pt-1.5 px-1.5">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold rounded-lg transition flex items-center gap-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Workspace area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 select-text">
          {children}
        </div>

      </main>

    </div>
  );
}
