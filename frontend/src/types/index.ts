// User and Authentication
export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  store?: Store;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
  role: 'CLIENT' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Store and Setup
export interface Store {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  policeNumber: string;
  cameras: Camera[];
}

export interface SetupFormData {
  cameraIPs: string[];
  policeNumber: string;
  storeName: string;
  address: string;
  location: { lat: number; lng: number };
  email: string;
  phone: string;
}

// Camera
export type CameraStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface Camera {
  id: string;
  storeId: string;
  ipAddress: string;
  streamUrl?: string;
  status: CameraStatus;
  position: number;
}

// Alerts
export type DetectionType = 'HELMET' | 'GUN' | 'MANUAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
  id: string;
  storeId: string;
  storeName: string;
  detectionType: DetectionType;
  imageUrl: string;
  timestamp: Date;
  status: AlertStatus;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  storeContact?: {
    phone: string;
    policeNumber: string;
  };
  resolvedAt?: Date;
  resolvedBy?: string;
  initiatedBy?: string;
}

// Siren
export type SirenAction = 'ON' | 'OFF';

export interface SirenLog {
  id: string;
  storeId: string;
  action: SirenAction;
  triggeredBy: string;
  timestamp: Date;
  alertId?: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Socket Events
export interface SocketEvents {
  'alert:new': (alert: Alert) => void;
  'alert:resolved': (alertId: string) => void;
  'siren:status': (data: { storeId: string; status: boolean }) => void;
  'camera:status': (data: { cameraId: string; status: CameraStatus }) => void;
}

// Stats
export interface SystemStats {
  totalUsers: number;
  activeCamera: number;
  activeAlerts: number;
}
