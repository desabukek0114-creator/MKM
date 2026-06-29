import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { RouterSession, SystemResource, PppoeSecret, PppoeProfile, PppoeActive, MikroTikLog, BulkGeneratorConfig, HotspotUser, HotspotProfile, HotspotActive } from "./src/types.js";

// Keep active router sessions and simulated router states in memory
const routerSessions: RouterSession[] = [
  {
    id: "session-1",
    sessionName: "Router-Utama-Kantor",
    ipAddress: "192.168.88.1",
    apiPort: 8728,
    username: "admin",
    dnsName: "hotspot.net",
    currency: "Rp",
    rateLimitSuffix: "M"
  },
  {
    id: "session-2",
    sessionName: "Router-Kost-Indah",
    ipAddress: "10.0.0.1",
    apiPort: 8728,
    username: "mikhmon",
    dnsName: "kostwifi.id",
    currency: "Rp",
    rateLimitSuffix: "M"
  }
];

// Seed profiles for our routers
const initialProfiles: Record<string, PppoeProfile[]> = {
  "session-1": [
    { id: "prof-1", name: "PPPoE-3M", localAddress: "10.10.10.1", remoteAddress: "pppoe-pool", rateLimit: "3M/3M", onlyOne: "yes", price: 100000, sellingPrice: 100000, validity: "30d", parentQueue: "PPPoE-Parent" },
    { id: "prof-2", name: "PPPoE-5M", localAddress: "10.10.10.1", remoteAddress: "pppoe-pool", rateLimit: "5M/5M", onlyOne: "yes", price: 150000, sellingPrice: 150000, validity: "30d", parentQueue: "PPPoE-Parent" },
    { id: "prof-3", name: "PPPoE-10M", localAddress: "10.10.10.1", remoteAddress: "pppoe-pool", rateLimit: "10M/10M", onlyOne: "yes", price: 250000, sellingPrice: 250000, validity: "30d", parentQueue: "PPPoE-Parent" },
    { id: "prof-4", name: "Expired-Isolir", localAddress: "10.10.10.1", remoteAddress: "isolir-pool", rateLimit: "512k/512k", onlyOne: "yes", price: 0, sellingPrice: 0, validity: "1d", parentQueue: "PPPoE-Parent" }
  ],
  "session-2": [
    { id: "prof-a", name: "Kost-Harian", localAddress: "192.168.10.1", remoteAddress: "kost-pool", rateLimit: "2M/2M", onlyOne: "yes", price: 5000, sellingPrice: 5000, validity: "1d", parentQueue: "none" },
    { id: "prof-b", name: "Kost-Mingguan", localAddress: "192.168.10.1", remoteAddress: "kost-pool", rateLimit: "3M/3M", onlyOne: "yes", price: 30000, sellingPrice: 30000, validity: "7d", parentQueue: "none" },
    { id: "prof-c", name: "Kost-Bulanan", localAddress: "192.168.10.1", remoteAddress: "kost-pool", rateLimit: "5M/5M", onlyOne: "yes", price: 120000, sellingPrice: 120000, validity: "30d", parentQueue: "none" }
  ]
};

// Seed secrets for our routers
const initialSecrets: Record<string, PppoeSecret[]> = {
  "session-1": [
    { id: "sec-1", name: "budi_antena", service: "pppoe", profile: "PPPoE-5M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.101", comment: "Exp: Jul/25/2026, Price: 150000, Phone: 08123456781", disabled: false },
    { id: "sec-2", name: "ani_wifi", service: "pppoe", profile: "PPPoE-3M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.102", comment: "Exp: Jul/12/2026, Price: 100000, Phone: 08123456782", disabled: false },
    { id: "sec-3", name: "eko_rtgw", service: "pppoe", profile: "PPPoE-10M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.103", comment: "Exp: Aug/01/2026, Price: 250000, Phone: 08123456783", disabled: false },
    { id: "sec-4", name: "dedi_net", service: "pppoe", profile: "PPPoE-5M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.104", comment: "Exp: Jun/10/2026, Price: 150000, Phone: 08123456784", disabled: true },
    { id: "sec-5", name: "shinta_stream", service: "pppoe", profile: "PPPoE-10M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.105", comment: "Exp: Jul/19/2026, Price: 250000, Phone: 08123456785", disabled: false },
    { id: "sec-6", name: "rudi_game", service: "pppoe", profile: "Expired-Isolir", localAddress: "10.10.10.10", remoteAddress: "10.10.10.106", comment: "Exp: Jun/15/2026, Price: 0, Phone: 08123456786", disabled: false },
    { id: "sec-7", name: "wawan_net", service: "pppoe", profile: "PPPoE-3M", localAddress: "10.10.10.10", remoteAddress: "10.10.10.107", comment: "Exp: Jul/28/2026, Price: 100000, Phone: 08123456787", disabled: false }
  ],
  "session-2": [
    { id: "sec-a1", name: "andi_kamar3", service: "pppoe", profile: "Kost-Bulanan", comment: "Exp: Jul/28/2026, Price: 120000, Phone: 08123456788", disabled: false },
    { id: "sec-a2", name: "siti_kamar5", service: "pppoe", profile: "Kost-Bulanan", comment: "Exp: Jul/29/2026, Price: 120000, Phone: 08123456789", disabled: false },
    { id: "sec-a3", name: "bambang_harian", service: "pppoe", profile: "Kost-Harian", comment: "Exp: Jun/29/2026, Price: 5000", disabled: false },
    { id: "sec-a4", name: "lia_mingguan", service: "pppoe", profile: "Kost-Mingguan", comment: "Exp: Jul/05/2026, Price: 30000", disabled: false }
  ]
};

// Seed active PPPoE connections
const initialActive: Record<string, PppoeActive[]> = {
  "session-1": [
    { id: "act-1", name: "budi_antena", address: "10.10.10.101", macAddress: "00:0C:42:7D:66:F1", uptime: "03:45:12", callerId: "00:0C:42:7D:66:F1" },
    { id: "act-2", name: "ani_wifi", address: "10.10.10.102", macAddress: "2C:F0:EE:A1:B3:CD", uptime: "12:15:33", callerId: "2C:F0:EE:A1:B3:CD" },
    { id: "act-3", name: "eko_rtgw", address: "10.10.10.103", macAddress: "70:4D:7B:64:23:44", uptime: "01:22:10", callerId: "70:4D:7B:64:23:44" },
    { id: "act-5", name: "shinta_stream", address: "10.10.10.105", macAddress: "A4:2B:B0:FF:E1:92", uptime: "23:59:12", callerId: "A4:2B:B0:FF:E1:92" }
  ],
  "session-2": [
    { id: "act-a1", name: "andi_kamar3", address: "192.168.10.12", macAddress: "3C:A8:2A:44:E3:4C", uptime: "05:12:02", callerId: "3C:A8:2A:44:E3:4C" },
    { id: "act-a2", name: "siti_kamar5", address: "192.168.10.14", macAddress: "B8:27:EB:D3:5F:AA", uptime: "08:34:11", callerId: "B8:27:EB:D3:5F:AA" }
  ]
};

// Seed Hotspot Profiles
const initialHotspotProfiles: Record<string, HotspotProfile[]> = {
  "session-1": [
    { id: "hs-prof-1", name: "Hs-Harian-12H", sharedUsers: 1, rateLimit: "1M/1M", expiredMode: "notice", validity: "12h", price: 3000, sellingPrice: 3000, lockUser: "no" },
    { id: "hs-prof-2", name: "Hs-Harian-24H", sharedUsers: 1, rateLimit: "2M/2M", expiredMode: "notice", validity: "1d", price: 5000, sellingPrice: 5000, lockUser: "no" },
    { id: "hs-prof-3", name: "Hs-Bulanan-50K", sharedUsers: 2, rateLimit: "3M/3M", expiredMode: "keep", validity: "30d", price: 50000, sellingPrice: 50000, lockUser: "yes" }
  ],
  "session-2": [
    { id: "hs-prof-a", name: "Kost-Wifi-5K", sharedUsers: 1, rateLimit: "2M/2M", expiredMode: "remove", validity: "1d", price: 5000, sellingPrice: 5000, lockUser: "no" },
    { id: "hs-prof-b", name: "Kost-Wifi-25K", sharedUsers: 1, rateLimit: "3M/3M", expiredMode: "remove", validity: "7d", price: 25000, sellingPrice: 25000, lockUser: "no" },
    { id: "hs-prof-c", name: "Kost-Wifi-90K", sharedUsers: 1, rateLimit: "5M/5M", expiredMode: "notice", validity: "30d", price: 90000, sellingPrice: 90000, lockUser: "yes" }
  ]
};

// Seed Hotspot Users
const initialHotspotUsers: Record<string, HotspotUser[]> = {
  "session-1": [
    { id: "hs-usr-1", name: "938a4", password: "same", profile: "Hs-Harian-12H", comment: "Exp: Jul/25/2026, Price: 3000", disabled: false },
    { id: "hs-usr-2", name: "7w4be", password: "same", profile: "Hs-Harian-12H", comment: "Exp: Jul/25/2026, Price: 3000", disabled: false },
    { id: "hs-usr-3", name: "budi_laptop", password: "123", profile: "Hs-Bulanan-50K", comment: "Exp: Jul/28/2026, Price: 50000, Phone: 08129999991", disabled: false },
    { id: "hs-usr-4", name: "rudi_hp", password: "456", profile: "Hs-Bulanan-50K", comment: "Exp: Jun/12/2026, Price: 50000", disabled: true }
  ],
  "session-2": [
    { id: "hs-usr-a1", name: "k03j8", password: "same", profile: "Kost-Wifi-5K", comment: "Exp: Jul/28/2026, Price: 5000", disabled: false },
    { id: "hs-usr-a2", name: "m74pf", password: "same", profile: "Kost-Wifi-25K", comment: "Exp: Jul/29/2026, Price: 25000", disabled: false }
  ]
};

// Seed active Hotspot connections
const initialHotspotActive: Record<string, HotspotActive[]> = {
  "session-1": [
    { id: "hs-act-1", name: "budi_laptop", address: "192.168.88.251", macAddress: "A8:66:7F:10:20:30", uptime: "01:45:22", bytesIn: 54102948, bytesOut: 1284920492 },
    { id: "hs-act-2", name: "938a4", address: "192.168.88.102", macAddress: "5C:F9:38:D9:A2:B4", uptime: "00:12:44", bytesIn: 4920482, bytesOut: 45294029 }
  ],
  "session-2": [
    { id: "hs-act-a1", name: "k03j8", address: "10.0.0.105", macAddress: "D4:F2:7F:B3:1E:0A", uptime: "04:10:12", bytesIn: 18492048, bytesOut: 204920194 }
  ]
};

// Seed system resources
const systemResources: Record<string, SystemResource> = {
  "session-1": {
    uptime: "14d 06h 22m 15s",
    cpuLoad: 5,
    freeMemory: 412 * 1024 * 1024,
    totalMemory: 1024 * 1024 * 1024,
    freeHdd: 64 * 1024 * 1024,
    totalHdd: 128 * 1024 * 1024,
    boardName: "RB450Gx4",
    version: "6.49.10 (stable)",
    model: "MikroTik RB450Gx4"
  },
  "session-2": {
    uptime: "3d 11h 05m 49s",
    cpuLoad: 12,
    freeMemory: 128 * 1024 * 1024,
    totalMemory: 512 * 1024 * 1024,
    freeHdd: 32 * 1024 * 1024,
    totalHdd: 64 * 1024 * 1024,
    boardName: "hEX gr3",
    version: "6.48.6 (long-term)",
    model: "MikroTik hEX gr3"
  }
};

// Seed initial system logs
const systemLogs: Record<string, MikroTikLog[]> = {
  "session-1": [
    { id: "log-1", time: "10:14:02", topics: ["pppoe", "info"], message: "budi_antena logged in, IP: 10.10.10.101", type: "success" },
    { id: "log-2", time: "10:13:45", topics: ["system", "info"], message: "user admin logged in via local API", type: "info" },
    { id: "log-3", time: "10:11:12", topics: ["pppoe", "info"], message: "shinta_stream connected, callerId: A4:2B:B0:FF:E1:92", type: "success" },
    { id: "log-4", time: "09:55:10", topics: ["system", "warning"], message: "script backup warning: backup storage is low", type: "warning" },
    { id: "log-5", time: "09:44:30", topics: ["pppoe", "error"], message: "dedi_net authentication failed: secret is disabled", type: "error" }
  ],
  "session-2": [
    { id: "log-a1", time: "10:12:15", topics: ["pppoe", "info"], message: "andi_kamar3 logged in, IP: 192.168.10.12", type: "success" },
    { id: "log-a2", time: "10:05:10", topics: ["system", "info"], message: "mikhmon local session established", type: "info" }
  ]
};

interface SalesTransaction {
  id: string;
  timestamp: string; // ISO string
  name: string;      // Username or Voucher Code
  service: "pppoe" | "hotspot";
  profile: string;
  price: number;
  operator: string;
}

const initialSales: Record<string, SalesTransaction[]> = {
  "session-1": [],
  "session-2": []
};

// Seeding function for realistic Sales Report history
function seedSalesTransactions() {
  const sessions = ["session-1", "session-2"];
  sessions.forEach(sid => {
    const txs: SalesTransaction[] = [];
    const profiles = sid === "session-1" 
      ? ["Hs-Harian-12H", "Hs-Bulanan-50K", "PPPoE-Home-3Mbps", "PPPoE-Home-5Mbps"] 
      : ["Kost-Wifi-5K", "Kost-Wifi-25K", "PPPoE-Kost-150K"];
    const operators = ["admin", "kasir-1", "kasir-2"];
    
    // Generate 45 transactions spread across the past 14 days
    for (let i = 0; i < 45; i++) {
      const date = new Date();
      // Distributed randomly over past 14 days
      const daysAgo = Math.floor(Math.random() * 14);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minsAgo = Math.floor(Math.random() * 60);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);
      date.setMinutes(date.getMinutes() - minsAgo);

      const isPppoe = Math.random() > 0.6;
      const profile = profiles[Math.floor(Math.random() * profiles.length)];
      
      let price = 5000;
      if (profile.includes("50K")) price = 50000;
      else if (profile.includes("25K")) price = 25000;
      else if (profile.includes("5K")) price = 5000;
      else if (profile.includes("150K")) price = 150000;
      else if (profile.includes("3Mbps")) price = 135000;
      else if (profile.includes("5Mbps")) price = 175000;
      else if (profile.includes("12H")) price = 3000;

      const randomNames = ["7w4be", "938a4", "budi_laptop", "rudi_hp", "m74pf", "k03j8", "ahmad_wifi", "siti_net", "tony_secret", "ani_pppoe", "joko_client", "wulan_net"];
      const name = randomNames[Math.floor(Math.random() * randomNames.length)] + (Math.random() > 0.5 ? Math.floor(Math.random() * 100) : "");

      txs.push({
        id: `tx-${sid}-${i}`,
        timestamp: date.toISOString(),
        name,
        service: isPppoe ? "pppoe" : "hotspot",
        profile,
        price,
        operator: operators[Math.floor(Math.random() * operators.length)]
      });
    }
    // Sort by timestamp descending
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    initialSales[sid] = txs;
  });
}
seedSalesTransactions();

// Parsed comments helper to structure Mikhmon-style comments
function parseMikhmonComment(comment?: string) {
  if (!comment) return undefined;
  
  const parsed: any = {};
  const parts = comment.split(",").map(p => p.trim());
  
  parts.forEach(part => {
    if (part.startsWith("Exp:")) {
      parsed.expiryDate = part.substring(4).trim();
    } else if (part.startsWith("Price:")) {
      parsed.price = parseInt(part.substring(6).trim(), 10) || 0;
    } else if (part.startsWith("Phone:")) {
      parsed.phone = part.substring(6).trim();
    }
  });

  // Calculate status
  if (parsed.expiryDate) {
    const expDate = new Date(parsed.expiryDate);
    const now = new Date();
    if (expDate < now) {
      parsed.status = "expired";
    } else {
      parsed.status = "active";
    }
  } else {
    parsed.status = "active";
  }

  return parsed;
}

// Function to generate simulated traffic rates
function getSimulatedTraffic(sessionName: string) {
  // Return fluctuating traffic based on session
  const multiplier = sessionName.includes("Kantor") ? 1.5 : 0.8;
  const baseRx = 4500000 * multiplier; // Download speed
  const baseTx = 1200000 * multiplier; // Upload speed
  
  // Introduce random variation up to 30%
  const variationRx = (Math.random() - 0.5) * 2 * 0.25 * baseRx;
  const variationTx = (Math.random() - 0.5) * 2 * 0.20 * baseTx;

  return {
    rxRate: Math.max(200000, Math.round(baseRx + variationRx)),
    txRate: Math.max(50000, Math.round(baseTx + variationTx))
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // -------------------------------------------------------------
  // API Endpoints
  // -------------------------------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Mikhmon PPPoE Monitor Service" });
  });

  // Get all Router Sessions
  app.get("/api/sessions", (req, res) => {
    res.json(routerSessions);
  });

  // Add a Router Session
  app.post("/api/sessions", (req, res) => {
    const { sessionName, ipAddress, apiPort, username, password, dnsName, currency, rateLimitSuffix } = req.body;
    
    if (!sessionName || !ipAddress || !username) {
      return res.status(400).json({ error: "Missing required fields: sessionName, ipAddress, username" });
    }

    const newSession: RouterSession = {
      id: "session-" + Math.random().toString(36).substring(2, 9),
      sessionName,
      ipAddress,
      apiPort: Number(apiPort) || 8728,
      username,
      password: password || "",
      dnsName: dnsName || "hotspot.net",
      currency: currency || "Rp",
      rateLimitSuffix: rateLimitSuffix || "M"
    };

    routerSessions.push(newSession);

    // Seed data for the newly created router so user can immediately play with it
    initialProfiles[newSession.id] = [
      { id: `prof-new-1`, name: "PPPoE-2Mbps", localAddress: "172.16.10.1", remoteAddress: "new-pool", rateLimit: "2M/2M", price: 75000, validity: "30d" },
      { id: `prof-new-2`, name: "PPPoE-5Mbps", localAddress: "172.16.10.1", remoteAddress: "new-pool", rateLimit: "5M/5M", price: 130000, validity: "30d" }
    ];

    initialSecrets[newSession.id] = [
      { id: `sec-new-1`, name: "user_kurnia", service: "pppoe", profile: "PPPoE-5Mbps", comment: "Exp: Jul/30/2026, Price: 130000", disabled: false },
      { id: `sec-new-2`, name: "user_fajar", service: "pppoe", profile: "PPPoE-2Mbps", comment: "Exp: Jul/15/2026, Price: 75000", disabled: false }
    ];

    initialActive[newSession.id] = [
      { id: `act-new-1`, name: "user_kurnia", address: "172.16.10.51", macAddress: "BC:24:11:22:33:AA", uptime: "02:11:00", callerId: "BC:24:11:22:33:AA" }
    ];

    initialHotspotProfiles[newSession.id] = [
      { id: `hs-prof-new-1`, name: "Hotspot-3k", sharedUsers: 1, rateLimit: "1M/1M", expiredMode: "remove", validity: "12h", price: 3000, sellingPrice: 3000, lockUser: "no" },
      { id: `hs-prof-new-2`, name: "Hotspot-5k", sharedUsers: 1, rateLimit: "2M/2M", expiredMode: "notice", validity: "1d", price: 5000, sellingPrice: 5000, lockUser: "no" }
    ];

    initialHotspotUsers[newSession.id] = [
      { id: `hs-usr-new-1`, name: "a84df", password: "same", profile: "Hotspot-5k", comment: "Exp: Jul/30/2026, Price: 5000", disabled: false },
      { id: `hs-usr-new-2`, name: "x92kd", password: "same", profile: "Hotspot-3k", comment: "Exp: Jul/15/2026, Price: 3000", disabled: false }
    ];

    initialHotspotActive[newSession.id] = [
      { id: `hs-act-new-1`, name: "a84df", address: "192.168.88.15", macAddress: "AA:BB:CC:DD:EE:01", uptime: "00:32:15", bytesIn: 5029482, bytesOut: 12948102 }
    ];

    systemResources[newSession.id] = {
      uptime: "00h 15m 30s",
      cpuLoad: 2,
      freeMemory: 210 * 1024 * 1024,
      totalMemory: 512 * 1024 * 1024,
      freeHdd: 20 * 1024 * 1024,
      totalHdd: 64 * 1024 * 1024,
      boardName: "hAP lite",
      version: "6.49.8",
      model: "MikroTik hAP lite"
    };

    systemLogs[newSession.id] = [
      { id: `log-new-1`, time: "10:15:00", topics: ["system", "info"], message: `Router Session ${sessionName} initiated`, type: "success" }
    ];

    res.status(201).json(newSession);
  });

  // Delete a session
  app.delete("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const idx = routerSessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      routerSessions.splice(idx, 1);
      // Clean up seed states
      delete initialProfiles[id];
      delete initialSecrets[id];
      delete initialActive[id];
      delete initialHotspotProfiles[id];
      delete initialHotspotUsers[id];
      delete initialHotspotActive[id];
      delete systemResources[id];
      delete systemLogs[id];
      return res.json({ success: true, message: "Session removed successfully" });
    }
    res.status(404).json({ error: "Session not found" });
  });

  // Get active session metrics & resources
  app.get("/api/router/:sessionId/resource", (req, res) => {
    const { sessionId } = req.params;
    const resource = systemResources[sessionId];
    if (!resource) {
      return res.status(404).json({ error: "Router session state not found" });
    }

    // Slightly fluctuate CPU load for extreme realism
    const loadDelta = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
    resource.cpuLoad = Math.max(1, Math.min(99, resource.cpuLoad + loadDelta));
    
    // Memory and HDD fluctuate very slightly
    const memDelta = Math.floor((Math.random() - 0.5) * 1024 * 1024);
    resource.freeMemory = Math.max(10 * 1024 * 1024, Math.min(resource.totalMemory, resource.freeMemory + memDelta));

    res.json(resource);
  });

  // Get logs
  app.get("/api/router/:sessionId/logs", (req, res) => {
    const { sessionId } = req.params;
    const logs = systemLogs[sessionId] || [];
    res.json(logs);
  });

  // Post a log message manually or from actions
  app.post("/api/router/:sessionId/logs", (req, res) => {
    const { sessionId } = req.params;
    const { message, type, topics } = req.body;
    
    const logs = systemLogs[sessionId] || [];
    const date = new Date();
    const timeStr = date.toTimeString().split(' ')[0];

    const newLog: MikroTikLog = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: topics || ["mikhmon", "info"],
      message,
      type: type || "info"
    };

    logs.unshift(newLog);
    if (logs.length > 50) logs.pop(); // limit log list size
    systemLogs[sessionId] = logs;

    res.status(201).json(newLog);
  });

  // Live traffic graph endpoint (emulated live stream)
  app.get("/api/router/:sessionId/traffic", (req, res) => {
    const { sessionId } = req.params;
    const session = routerSessions.find(s => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: "Router session not found" });
    }
    const traffic = getSimulatedTraffic(session.sessionName);
    res.json({
      timestamp: Date.now(),
      ...traffic
    });
  });

  // Get PPPoE Secrets
  app.get("/api/router/:sessionId/secrets", (req, res) => {
    const { sessionId } = req.params;
    const secrets = initialSecrets[sessionId] || [];
    
    // Add parsed comment objects dynamically
    const enrichedSecrets = secrets.map(sec => ({
      ...sec,
      parsedComment: parseMikhmonComment(sec.comment)
    }));

    res.json(enrichedSecrets);
  });

  // Add PPPoE Secret
  app.post("/api/router/:sessionId/secrets", (req, res) => {
    const { sessionId } = req.params;
    const { name, password, service, profile, localAddress, remoteAddress, comment, disabled } = req.body;

    if (!name || !profile) {
      return res.status(400).json({ error: "Missing required fields: name, profile" });
    }

    const secrets = initialSecrets[sessionId] || [];
    
    // Check if name already exists
    if (secrets.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: `Secret name '${name}' already exists in this MikroTik!` });
    }

    const newSecret: PppoeSecret = {
      id: "sec-" + Math.random().toString(36).substring(2, 9),
      name,
      password: password || "123456",
      service: service || "pppoe",
      profile,
      localAddress: localAddress || "",
      remoteAddress: remoteAddress || "",
      comment: comment || "",
      disabled: disabled === undefined ? false : disabled
    };

    secrets.push(newSecret);
    initialSecrets[sessionId] = secrets;

    // Record to sales report
    let secPrice = 135000;
    if (comment) {
      const match = comment.match(/Price:\s*(\d+)/i);
      if (match) secPrice = parseInt(match[1], 10) || 135000;
    } else {
      const pList = initialProfiles[sessionId] || [];
      const matchedProf = pList.find(p => p.name === profile);
      if (matchedProf && matchedProf.price) secPrice = matchedProf.price;
    }
    const salesList = initialSales[sessionId] || [];
    salesList.unshift({
      id: `tx-${sessionId}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      name,
      service: "pppoe",
      profile,
      price: secPrice,
      operator: "admin"
    });
    initialSales[sessionId] = salesList;

    // Log the event
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Secret '${name}' created via Mikhmon API`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    // Add to Active list randomly as simulated user logging in
    if (!newSecret.disabled && Math.random() > 0.4) {
      const active = initialActive[sessionId] || [];
      const randIP = `10.10.10.${Math.floor(Math.random() * 150) + 10}`;
      const randMAC = Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
      
      active.push({
        id: "act-" + Math.random().toString(36).substring(2, 9),
        name: newSecret.name,
        address: newSecret.remoteAddress || randIP,
        macAddress: randMAC,
        uptime: "00:00:01",
        callerId: randMAC
      });
      initialActive[sessionId] = active;
    }

    res.status(201).json(newSecret);
  });

  // Edit PPPoE Secret
  app.put("/api/router/:sessionId/secrets/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const { name, password, service, profile, localAddress, remoteAddress, comment, disabled } = req.body;

    const secrets = initialSecrets[sessionId] || [];
    const secIndex = secrets.findIndex(s => s.id === id);

    if (secIndex === -1) {
      return res.status(404).json({ error: "Secret not found" });
    }

    const oldSecret = secrets[secIndex];
    
    // Check name collision
    if (name && name !== oldSecret.name && secrets.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: "Secret name already exists" });
    }

    secrets[secIndex] = {
      ...oldSecret,
      name: name || oldSecret.name,
      password: password !== undefined ? password : oldSecret.password,
      service: service || oldSecret.service,
      profile: profile || oldSecret.profile,
      localAddress: localAddress !== undefined ? localAddress : oldSecret.localAddress,
      remoteAddress: remoteAddress !== undefined ? remoteAddress : oldSecret.remoteAddress,
      comment: comment !== undefined ? comment : oldSecret.comment,
      disabled: disabled !== undefined ? disabled : oldSecret.disabled
    };

    initialSecrets[sessionId] = secrets;

    // Log the edit
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Secret '${secrets[secIndex].name}' updated`,
      type: "info"
    });
    systemLogs[sessionId] = logList;

    // If disabled, remove from Active connections immediately
    if (disabled) {
      const active = initialActive[sessionId] || [];
      const cleanActive = active.filter(act => act.name !== oldSecret.name);
      initialActive[sessionId] = cleanActive;
    }

    res.json(secrets[secIndex]);
  });

  // Delete PPPoE Secret
  app.delete("/api/router/:sessionId/secrets/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const secrets = initialSecrets[sessionId] || [];
    const secIndex = secrets.findIndex(s => s.id === id);

    if (secIndex === -1) {
      return res.status(404).json({ error: "Secret not found" });
    }

    const deletedSecName = secrets[secIndex].name;
    secrets.splice(secIndex, 1);
    initialSecrets[sessionId] = secrets;

    // Remove from active list
    const active = initialActive[sessionId] || [];
    initialActive[sessionId] = active.filter(act => act.name !== deletedSecName);

    // Log deletion
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Secret '${deletedSecName}' deleted`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true, message: `PPPoE Secret deleted successfully` });
  });

  // Bulk Generate PPPoE Secrets (Voucher Generator)
  app.post("/api/router/:sessionId/secrets/generate", (req, res) => {
    const { sessionId } = req.params;
    const config: BulkGeneratorConfig = req.body;

    if (!config.qty || !config.profile) {
      return res.status(400).json({ error: "Missing qty or profile for generation" });
    }

    const secrets = initialSecrets[sessionId] || [];
    const generatedVouchers: PppoeSecret[] = [];
    
    const charsMix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charsLower = "abcdefghijklmnopqrstuvwxyz";
    const charsUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charsNum = "0123456789";

    const getRandChar = (type: string) => {
      let activeSet = charsMix;
      if (type === "lower") activeSet = charsLower;
      if (type === "upper") activeSet = charsUpper;
      if (type === "numeric") activeSet = charsNum;
      return activeSet[Math.floor(Math.random() * activeSet.length)];
    };

    // Calculate expiry date comment string
    let expCommentStr = "";
    if (config.validity) {
      const validityNum = parseInt(config.validity, 10);
      if (!isNaN(validityNum)) {
        const d = new Date();
        d.setDate(d.getDate() + validityNum);
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const dayStr = String(d.getDate()).padStart(2, '0');
        expCommentStr = `Exp: ${months[d.getMonth()]}/${dayStr}/${d.getFullYear()}`;
      }
    }

    // Build comment
    let commentParts = [];
    if (expCommentStr) commentParts.push(expCommentStr);
    if (config.price) commentParts.push(`Price: ${config.price}`);
    commentParts.push("Mikhmon-Generated");
    const commentVal = commentParts.join(", ");

    for (let i = 0; i < config.qty; i++) {
      // Generate unique name
      let generatedName = "";
      let attempts = 0;
      do {
        let namePart = "";
        for (let c = 0; c < config.userLength; c++) {
          namePart += getRandChar(config.charType);
        }
        generatedName = (config.prefix || "") + namePart;
        attempts++;
      } while (
        (secrets.some(s => s.name === generatedName) || generatedVouchers.some(s => s.name === generatedName)) && 
        attempts < 100
      );

      // Generate password
      let generatedPass = "";
      if (config.passMode === "same") {
        generatedPass = generatedName;
      } else if (config.passMode === "upnp") {
        generatedPass = "123456";
      } else {
        // dynamic diff pass
        for (let c = 0; c < config.userLength; c++) {
          generatedPass += getRandChar(config.charType);
        }
      }

      const freshSecret: PppoeSecret = {
        id: "sec-gen-" + Math.random().toString(36).substring(2, 9),
        name: generatedName,
        password: generatedPass,
        service: "pppoe",
        profile: config.profile,
        comment: commentVal,
        disabled: false
      };

      generatedVouchers.push(freshSecret);
      secrets.push(freshSecret);
    }

    initialSecrets[sessionId] = secrets;

    // Record to sales report
    const salesList = initialSales[sessionId] || [];
    generatedVouchers.forEach(v => {
      salesList.unshift({
        id: `tx-${sessionId}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        name: v.name,
        service: "pppoe",
        profile: v.profile,
        price: config.price || 135000,
        operator: "admin"
      });
    });
    initialSales[sessionId] = salesList;

    // Log the event
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `Bulk generated ${config.qty} PPPoE voucher secrets for profile '${config.profile}'`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    res.status(201).json(generatedVouchers);
  });

  // Get PPPoE Profiles
  app.get("/api/router/:sessionId/profiles", (req, res) => {
    const { sessionId } = req.params;
    const profiles = initialProfiles[sessionId] || [];
    res.json(profiles);
  });

  // Add PPPoE Profile
  app.post("/api/router/:sessionId/profiles", (req, res) => {
    const { sessionId } = req.params;
    const { name, localAddress, remoteAddress, rateLimit, onlyOne, price, sellingPrice, validity, parentQueue } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing profile name" });
    }

    const profiles = initialProfiles[sessionId] || [];
    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: `PPPoE Profile '${name}' already exists!` });
    }

    const newProfile: PppoeProfile = {
      id: "prof-" + Math.random().toString(36).substring(2, 9),
      name,
      localAddress: localAddress || "",
      remoteAddress: remoteAddress || "",
      rateLimit: rateLimit || "",
      onlyOne: onlyOne || "default",
      price: Number(price) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      validity: validity || "",
      parentQueue: parentQueue || "none"
    };

    profiles.push(newProfile);
    initialProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Profile '${name}' created`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    res.status(201).json(newProfile);
  });

  // Edit PPPoE Profile
  app.put("/api/router/:sessionId/profiles/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const { name, localAddress, remoteAddress, rateLimit, onlyOne, price, sellingPrice, validity, parentQueue } = req.body;

    const profiles = initialProfiles[sessionId] || [];
    const profIdx = profiles.findIndex(p => p.id === id);

    if (profIdx === -1) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const oldProf = profiles[profIdx];

    profiles[profIdx] = {
      ...oldProf,
      name: name || oldProf.name,
      localAddress: localAddress !== undefined ? localAddress : oldProf.localAddress,
      remoteAddress: remoteAddress !== undefined ? remoteAddress : oldProf.remoteAddress,
      rateLimit: rateLimit !== undefined ? rateLimit : oldProf.rateLimit,
      onlyOne: onlyOne !== undefined ? onlyOne : oldProf.onlyOne,
      price: price !== undefined ? Number(price) : oldProf.price,
      sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : oldProf.sellingPrice,
      validity: validity !== undefined ? validity : oldProf.validity,
      parentQueue: parentQueue !== undefined ? parentQueue : oldProf.parentQueue
    };

    initialProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Profile '${profiles[profIdx].name}' updated`,
      type: "info"
    });
    systemLogs[sessionId] = logList;

    res.json(profiles[profIdx]);
  });

  // Delete PPPoE Profile
  app.delete("/api/router/:sessionId/profiles/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const profiles = initialProfiles[sessionId] || [];
    const profIdx = profiles.findIndex(p => p.id === id);

    if (profIdx === -1) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const deletedProfName = profiles[profIdx].name;
    profiles.splice(profIdx, 1);
    initialProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `PPPoE Profile '${deletedProfName}' removed`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true, message: "Profile deleted successfully" });
  });

  // Get active PPPoE connections
  app.get("/api/router/:sessionId/active", (req, res) => {
    const { sessionId } = req.params;
    const active = initialActive[sessionId] || [];
    res.json(active);
  });

  // Kick/Disconnect active user
  app.delete("/api/router/:sessionId/active/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const active = initialActive[sessionId] || [];
    const actIdx = active.findIndex(a => a.id === id);

    if (actIdx === -1) {
      return res.status(404).json({ error: "Active connection not found" });
    }

    const kickedUser = active[actIdx].name;
    active.splice(actIdx, 1);
    initialActive[sessionId] = active;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["pppoe", "info"],
      message: `Active connection of user '${kickedUser}' kicked/terminated`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true, message: `Disconnected user '${kickedUser}'` });
  });

  // -------------------------------------------------------------
  // Hotspot User Endpoints
  // -------------------------------------------------------------

  // Get Hotspot Users
  app.get("/api/router/:sessionId/hotspot/users", (req, res) => {
    const { sessionId } = req.params;
    const users = initialHotspotUsers[sessionId] || [];
    
    // Add parsed comment objects dynamically
    const enrichedUsers = users.map(u => ({
      ...u,
      parsedComment: parseMikhmonComment(u.comment)
    }));

    res.json(enrichedUsers);
  });

  // Add Hotspot User
  app.post("/api/router/:sessionId/hotspot/users", (req, res) => {
    const { sessionId } = req.params;
    const { name, password, profile, limitUptime, comment, disabled } = req.body;

    if (!name || !profile) {
      return res.status(400).json({ error: "Missing required fields: name, profile" });
    }

    const users = initialHotspotUsers[sessionId] || [];
    
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: `Hotspot user '${name}' already exists!` });
    }

    const newUser: HotspotUser = {
      id: "hs-usr-" + Math.random().toString(36).substring(2, 9),
      name,
      password: password || "",
      profile,
      limitUptime: limitUptime || "",
      comment: comment || "",
      disabled: disabled === undefined ? false : disabled
    };

    users.push(newUser);
    initialHotspotUsers[sessionId] = users;

    // Record to sales report
    let hsPrice = 5000;
    if (comment) {
      const match = comment.match(/Price:\s*(\d+)/i);
      if (match) hsPrice = parseInt(match[1], 10) || 5000;
    } else {
      const pList = initialHotspotProfiles[sessionId] || [];
      const matchedProf = pList.find(p => p.name === profile);
      if (matchedProf && matchedProf.price) hsPrice = matchedProf.price;
    }
    const salesList = initialSales[sessionId] || [];
    salesList.unshift({
      id: `tx-${sessionId}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      name,
      service: "hotspot",
      profile,
      price: hsPrice,
      operator: "admin"
    });
    initialSales[sessionId] = salesList;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot user '${name}' created`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    res.status(201).json(newUser);
  });

  // Edit Hotspot User
  app.put("/api/router/:sessionId/hotspot/users/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const { name, password, profile, limitUptime, comment, disabled } = req.body;

    const users = initialHotspotUsers[sessionId] || [];
    const idx = users.findIndex(u => u.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Hotspot user not found" });
    }

    const oldUser = users[idx];

    if (name && name !== oldUser.name && users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: "Hotspot username already exists" });
    }

    users[idx] = {
      ...oldUser,
      name: name || oldUser.name,
      password: password !== undefined ? password : oldUser.password,
      profile: profile || oldUser.profile,
      limitUptime: limitUptime !== undefined ? limitUptime : oldUser.limitUptime,
      comment: comment !== undefined ? comment : oldUser.comment,
      disabled: disabled !== undefined ? disabled : oldUser.disabled
    };

    initialHotspotUsers[sessionId] = users;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot user '${users[idx].name}' updated`,
      type: "info"
    });
    systemLogs[sessionId] = logList;

    // If disabled, disconnect them if they're active
    if (disabled) {
      const active = initialHotspotActive[sessionId] || [];
      initialHotspotActive[sessionId] = active.filter(act => act.name !== oldUser.name);
    }

    res.json(users[idx]);
  });

  // Delete Hotspot User
  app.delete("/api/router/:sessionId/hotspot/users/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const users = initialHotspotUsers[sessionId] || [];
    const idx = users.findIndex(u => u.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Hotspot user not found" });
    }

    const deletedName = users[idx].name;
    users.splice(idx, 1);
    initialHotspotUsers[sessionId] = users;

    // Clean up active
    const active = initialHotspotActive[sessionId] || [];
    initialHotspotActive[sessionId] = active.filter(act => act.name !== deletedName);

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot user '${deletedName}' deleted`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true });
  });

  // Bulk Generate Hotspot Users
  app.post("/api/router/:sessionId/hotspot/users/generate", (req, res) => {
    const { sessionId } = req.params;
    const config: BulkGeneratorConfig = req.body;

    if (!config.qty || !config.profile) {
      return res.status(400).json({ error: "Missing qty or profile for generation" });
    }

    const users = initialHotspotUsers[sessionId] || [];
    const generatedVouchers: HotspotUser[] = [];
    
    const charsMix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charsLower = "abcdefghijklmnopqrstuvwxyz";
    const charsUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charsNum = "0123456789";

    const getRandChar = (type: string) => {
      let activeSet = charsMix;
      if (type === "lower") activeSet = charsLower;
      if (type === "upper") activeSet = charsUpper;
      if (type === "numeric") activeSet = charsNum;
      return activeSet[Math.floor(Math.random() * activeSet.length)];
    };

    // Calculate expiry date comment string
    let expCommentStr = "";
    if (config.validity) {
      const validityNum = parseInt(config.validity, 10);
      if (!isNaN(validityNum)) {
        const d = new Date();
        d.setDate(d.getDate() + validityNum);
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const dayStr = String(d.getDate()).padStart(2, '0');
        expCommentStr = `Exp: ${months[d.getMonth()]}/${dayStr}/${d.getFullYear()}`;
      }
    }

    // Build comment
    let commentParts = [];
    if (expCommentStr) commentParts.push(expCommentStr);
    if (config.price) commentParts.push(`Price: ${config.price}`);
    commentParts.push("Mikhmon-Generated");
    const commentVal = commentParts.join(", ");

    for (let i = 0; i < config.qty; i++) {
      let generatedName = "";
      let attempts = 0;
      do {
        let namePart = "";
        for (let c = 0; c < config.userLength; c++) {
          namePart += getRandChar(config.charType);
        }
        generatedName = (config.prefix || "") + namePart;
        attempts++;
      } while (
        (users.some(u => u.name === generatedName) || generatedVouchers.some(u => u.name === generatedName)) && 
        attempts < 100
      );

      let generatedPass = "";
      if (config.passMode === "same") {
        generatedPass = generatedName;
      } else if (config.passMode === "upnp") {
        generatedPass = ""; // Empty password for hotspot means user-only login
      } else {
        for (let c = 0; c < config.userLength; c++) {
          generatedPass += getRandChar(config.charType);
        }
      }

      const freshUser: HotspotUser = {
        id: "hs-usr-gen-" + Math.random().toString(36).substring(2, 9),
        name: generatedName,
        password: generatedPass,
        profile: config.profile,
        comment: commentVal,
        disabled: false
      };

      generatedVouchers.push(freshUser);
      users.push(freshUser);
    }

    initialHotspotUsers[sessionId] = users;

    // Record to sales report
    const salesList = initialSales[sessionId] || [];
    generatedVouchers.forEach(v => {
      salesList.unshift({
        id: `tx-${sessionId}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        name: v.name,
        service: "hotspot",
        profile: v.profile,
        price: config.price || 5000,
        operator: "admin"
      });
    });
    initialSales[sessionId] = salesList;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Bulk generated ${config.qty} Hotspot vouchers for profile '${config.profile}'`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    res.status(201).json(generatedVouchers);
  });

  // -------------------------------------------------------------
  // Hotspot Profile Endpoints
  // -------------------------------------------------------------

  // Get Hotspot Profiles
  app.get("/api/router/:sessionId/hotspot/profiles", (req, res) => {
    const { sessionId } = req.params;
    const profiles = initialHotspotProfiles[sessionId] || [];
    res.json(profiles);
  });

  // Add Hotspot Profile
  app.post("/api/router/:sessionId/hotspot/profiles", (req, res) => {
    const { sessionId } = req.params;
    const { name, sharedUsers, rateLimit, expiredMode, validity, price, sellingPrice, lockUser } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing profile name" });
    }

    const profiles = initialHotspotProfiles[sessionId] || [];
    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: `Hotspot Profile '${name}' already exists!` });
    }

    const newProfile: HotspotProfile = {
      id: "hs-prof-" + Math.random().toString(36).substring(2, 9),
      name,
      sharedUsers: sharedUsers !== undefined ? Number(sharedUsers) : 1,
      rateLimit: rateLimit || "",
      expiredMode: expiredMode || "notice",
      validity: validity || "",
      price: Number(price) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      lockUser: lockUser || "no"
    };

    profiles.push(newProfile);
    initialHotspotProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot Profile '${name}' created`,
      type: "success"
    });
    systemLogs[sessionId] = logList;

    res.status(201).json(newProfile);
  });

  // Edit Hotspot Profile
  app.put("/api/router/:sessionId/hotspot/profiles/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const { name, sharedUsers, rateLimit, expiredMode, validity, price, sellingPrice, lockUser } = req.body;

    const profiles = initialHotspotProfiles[sessionId] || [];
    const idx = profiles.findIndex(p => p.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Hotspot Profile not found" });
    }

    const oldProfile = profiles[idx];

    profiles[idx] = {
      ...oldProfile,
      name: name || oldProfile.name,
      sharedUsers: sharedUsers !== undefined ? Number(sharedUsers) : oldProfile.sharedUsers,
      rateLimit: rateLimit !== undefined ? rateLimit : oldProfile.rateLimit,
      expiredMode: expiredMode !== undefined ? expiredMode : oldProfile.expiredMode,
      validity: validity !== undefined ? validity : oldProfile.validity,
      price: price !== undefined ? Number(price) : oldProfile.price,
      sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : oldProfile.sellingPrice,
      lockUser: lockUser !== undefined ? lockUser : oldProfile.lockUser
    };

    initialHotspotProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot Profile '${profiles[idx].name}' updated`,
      type: "info"
    });
    systemLogs[sessionId] = logList;

    res.json(profiles[idx]);
  });

  // Delete Hotspot Profile
  app.delete("/api/router/:sessionId/hotspot/profiles/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const profiles = initialHotspotProfiles[sessionId] || [];
    const idx = profiles.findIndex(p => p.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Hotspot Profile not found" });
    }

    const deletedName = profiles[idx].name;
    profiles.splice(idx, 1);
    initialHotspotProfiles[sessionId] = profiles;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot Profile '${deletedName}' removed`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // Hotspot Active Endpoints
  // -------------------------------------------------------------

  // Get active Hotspot connections
  app.get("/api/router/:sessionId/hotspot/active", (req, res) => {
    const { sessionId } = req.params;
    const active = initialHotspotActive[sessionId] || [];
    res.json(active);
  });

  // Disconnect active Hotspot connection
  app.delete("/api/router/:sessionId/hotspot/active/:id", (req, res) => {
    const { sessionId, id } = req.params;
    const active = initialHotspotActive[sessionId] || [];
    const idx = active.findIndex(a => a.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Active connection not found" });
    }

    const kickedUser = active[idx].name;
    active.splice(idx, 1);
    initialHotspotActive[sessionId] = active;

    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["hotspot", "info"],
      message: `Hotspot session for user '${kickedUser}' kicked/disconnected`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // Sales & Report Endpoints
  // -------------------------------------------------------------

  // Get Sales Transactions
  app.get("/api/router/:sessionId/sales", (req, res) => {
    const { sessionId } = req.params;
    const sales = initialSales[sessionId] || [];
    res.json(sales);
  });

  // Clear/Reset Sales Transactions
  app.post("/api/router/:sessionId/sales/clear", (req, res) => {
    const { sessionId } = req.params;
    initialSales[sessionId] = [];
    
    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logList = systemLogs[sessionId] || [];
    logList.unshift({
      id: "log-" + Math.random().toString(36).substring(2, 9),
      time: timeStr,
      topics: ["system", "info"],
      message: `Sales transactions history cleared by administrator`,
      type: "warning"
    });
    systemLogs[sessionId] = logList;

    res.json({ success: true, message: "Laporan penjualan berhasil di-reset" });
  });

  // Router CLI terminal endpoint
  app.post("/api/router/:sessionId/cli", (req, res) => {
    const { sessionId } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    const trimmed = command.trim();
    let reply = "";

    // Implement cute RouterOS CLI command parsing simulation
    if (trimmed === "help" || trimmed === "?") {
      reply = "Simulated RouterOS commands:\n  /interface print       - Print interfaces\n  /ppp secret print      - Print PPPoE Secrets\n  /ppp active print      - Print active users\n  /ppp profile print     - Print PPPoE profiles\n  /ip hotspot user print - Print Hotspot Users\n  /ip hotspot active print - Print active hotspot users\n  /ip hotspot profile print - Print Hotspot profiles\n  /system resource print  - Show resource status\n  /log print             - Show logs\n  ping <ip>              - Ping IP Address";
    } else if (trimmed.startsWith("/interface print")) {
      reply = "Flags: X - disabled, R - running, S - slave\n #    NAME                                TYPE         ACTUAL-MTU L2MTU  MAX-L2MTU\n 0  R  ether1                              ether        1500       1598   4074\n 1  R  ether2-master                       ether        1500       1598   4074\n 2  R  pppoe-out1                          pppoe-out    1480\n 3  RS hotspot-bridge                      bridge       1500       1598";
    } else if (trimmed.startsWith("/ip hotspot user print")) {
      const users = initialHotspotUsers[sessionId] || [];
      reply = "Flags: X - disabled\n #    NAME               PROFILE            LIMIT-UPTIME   COMMENT\n" + 
        users.map((u, i) => `${u.disabled ? 'X' : ' '} ${i}  ${u.name.padEnd(18)} ${(u.profile || 'default').padEnd(18)} ${(u.limitUptime || 'unlimited').padEnd(14)} ${u.comment || ''}`).join("\n");
    } else if (trimmed.startsWith("/ip hotspot active print")) {
      const active = initialHotspotActive[sessionId] || [];
      reply = " #    USER               ADDRESS         MAC-ADDRESS       UPTIME     BYTES-IN   BYTES-OUT\n" + 
        active.map((a, i) => `   ${i}  ${a.name.padEnd(18)} ${a.address.padEnd(15)} ${a.macAddress.padEnd(17)} ${a.uptime.padEnd(10)} ${(a.bytesIn).toString().padEnd(10)} ${a.bytesOut}`).join("\n");
    } else if (trimmed.startsWith("/ip hotspot profile print")) {
      const profiles = initialHotspotProfiles[sessionId] || [];
      reply = "Flags: * - default\n #    NAME               RATE-LIMIT  SHARED-USERS VALIDITY    PRICE      EXPIRED-MODE\n" + 
        profiles.map((p, i) => `   ${i}  ${p.name.padEnd(18)} ${(p.rateLimit || 'none').padEnd(11)} ${(p.sharedUsers || 1).toString().padEnd(12)} ${(p.validity || 'unlimited').padEnd(11)} ${(p.price || 0).toString().padEnd(10)} ${p.expiredMode || 'notice'}`).join("\n");
    } else if (trimmed.startsWith("/ppp secret print")) {
      const secrets = initialSecrets[sessionId] || [];
      reply = "Flags: X - disabled\n #    NAME               SERVICE  PROFILE            REMOTE-ADDRESS  COMMENT\n" + 
        secrets.map((s, i) => `${s.disabled ? 'X' : ' '} ${i}  ${s.name.padEnd(18)} ${s.service.padEnd(8)} ${(s.profile || 'default').padEnd(18)} ${(s.remoteAddress || 'dynamic').padEnd(15)} ${s.comment || ''}`).join("\n");
    } else if (trimmed.startsWith("/ppp active print")) {
      const active = initialActive[sessionId] || [];
      reply = " #    NAME               SERVICE  ADDRESS         MAC-ADDRESS       UPTIME\n" + 
        active.map((a, i) => `   ${i}  ${a.name.padEnd(18)} pppoe    ${a.address.padEnd(15)} ${a.macAddress.padEnd(17)} ${a.uptime}`).join("\n");
    } else if (trimmed.startsWith("/ppp profile print")) {
      const profiles = initialProfiles[sessionId] || [];
      reply = "Flags: * - default\n #    NAME               LOCAL-ADDRESS   REMOTE-ADDRESS  RATE-LIMIT  ONLY-ONE\n" + 
        profiles.map((p, i) => `   ${i}  ${p.name.padEnd(18)} ${(p.localAddress || 'none').padEnd(15)} ${(p.remoteAddress || 'none').padEnd(15)} ${(p.rateLimit || 'none').padEnd(11)} ${p.onlyOne || 'default'}`).join("\n");
    } else if (trimmed.startsWith("/system resource print")) {
      const res = systemResources[sessionId];
      if (res) {
        reply = `                   uptime: ${res.uptime}\n                  version: ${res.version}\n               build-time: Jun/10/2026 12:44:11\n               free-memory: ${(res.freeMemory / (1024*1024)).toFixed(1)}MiB\n             total-memory: ${(res.totalMemory / (1024*1024)).toFixed(1)}MiB\n                      cpu: MIPS\n                cpu-count: 1\n                 cpu-frequency: 650MHz\n                 cpu-load: ${res.cpuLoad}%\n           free-hdd-space: ${(res.freeHdd / (1024*1024)).toFixed(1)}MiB\n          total-hdd-space: ${(res.totalHdd / (1024*1024)).toFixed(1)}MiB\n  write-sect-since-reboot: 14502\n         write-sect-total: 395914\n               bad-blocks: 0%\n        architecture-name: mipsbe\n               board-name: ${res.boardName}\n                 platform: MikroTik`;
      } else {
        reply = "Error: resources could not be loaded";
      }
    } else if (trimmed.startsWith("/log print")) {
      const logs = systemLogs[sessionId] || [];
      reply = logs.map(l => `${l.time} ${l.topics.join(',')} -> ${l.message}`).reverse().join("\n");
    } else if (trimmed.startsWith("ping")) {
      const host = trimmed.substring(5).trim() || "192.168.88.1";
      reply = `SEQ HOST                                     SIZE TTL TIME  STATUS\n  0 ${host}                                  56  64 1ms\n  1 ${host}                                  56  64 2ms\n  2 ${host}                                  56  64 1ms\n  3 ${host}                                  56  64 1ms\n  sent=4 received=4 packet-loss=0% min-rtt=1ms avg-rtt=1ms max-rtt=2ms`;
    } else {
      reply = `bad command name ${trimmed} (line 1 column 1)`;
    }

    res.json({ reply });
  });


  // -------------------------------------------------------------
  // Serve Frontend / Vite Middleware
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mikhmon PPPoE Monitor Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start Mikhmon server:", err);
});
