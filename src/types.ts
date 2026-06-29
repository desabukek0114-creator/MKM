export interface RouterSession {
  id: string;
  sessionName: string;
  ipAddress: string;
  apiPort: number;
  username: string;
  password?: string;
  dnsName?: string;
  currency: string;
  rateLimitSuffix: string; // 'M' or 'k' or 'G'
}

export interface SystemResource {
  uptime: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  freeHdd: number;
  totalHdd: number;
  boardName: string;
  version: string;
  model: string;
}

export interface PppoeSecret {
  id: string;
  name: string;
  password?: string;
  service: string; // 'pppoe' or 'any'
  profile: string;
  localAddress?: string;
  remoteAddress?: string;
  comment?: string;
  disabled: boolean;
  // Parsed billing fields from Mikhmon comment conventions
  parsedComment?: {
    expiryDate?: string;
    price?: number;
    phone?: string;
    status?: 'active' | 'expired' | 'disabled';
  };
}

export interface PppoeProfile {
  id: string;
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string; // e.g. "5M/10M" (rx/tx)
  onlyOne?: 'yes' | 'no' | 'default';
  price?: number;
  sellingPrice?: number;
  validity?: string; // e.g. "30d" or "1m"
  parentQueue?: string;
}

export interface PppoeActive {
  id: string;
  name: string;
  address: string;
  macAddress: string;
  uptime: string;
  callerId?: string;
}

export interface InterfaceTraffic {
  timestamp: number;
  txRate: number; // Upload speed in bps
  rxRate: number; // Download speed in bps
}

export interface MikroTikLog {
  id: string;
  time: string;
  topics: string[];
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface BulkGeneratorConfig {
  qty: number;
  prefix: string;
  userLength: number;
  charType: 'lower' | 'upper' | 'numeric' | 'mix';
  profile: string;
  price: number;
  validity: string;
  passMode: 'same' | 'diff' | 'upnp';
}

export interface HotspotUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  limitUptime?: string;
  comment?: string;
  disabled: boolean;
  parsedComment?: {
    expiryDate?: string;
    price?: number;
    phone?: string;
    status?: 'active' | 'expired' | 'disabled';
  };
}

export interface HotspotProfile {
  id: string;
  name: string;
  sharedUsers?: number;
  rateLimit?: string;
  expiredMode?: 'keep' | 'remove' | 'notice' | 'remrec';
  validity?: string;
  price?: number;
  sellingPrice?: number;
  lockUser?: 'yes' | 'no';
}

export interface HotspotActive {
  id: string;
  name: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
}

export interface SalesTransaction {
  id: string;
  timestamp: string; // ISO string
  name: string;      // Username or Voucher Code
  service: "pppoe" | "hotspot";
  profile: string;
  price: number;
  operator: string;
}

