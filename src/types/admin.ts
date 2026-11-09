export interface CustomChannel {
  id: string;
  name: string;
  type?: string;
  streamUrl: string;
  group?: string;
  logoUrl?: string;
  licenseKey?: string;
  licenseType?: string;
  userAgent?: string;
  referer?: string;
  tvgId?: string;
}

export interface TokenObject {
  code: string;
  expiresAt: number | null;
  label: string;
  badgeIcon?: string;
  badgeColor?: string;
  nameEffect?: string;
  deviceId?: string;
  maxDevices?: number;
  deviceIds?: string[];
  isTrial?: boolean;
  _resetDevice?: boolean;
}

export interface ActiveUser {
  token: string;
  channel: string;
  country?: string;
  deviceBrand?: string;
  deviceModel?: string;
  isTv?: boolean;
  lastSeen: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export interface ConfigData {
  appName: string;
  backgroundUrl: string;
  welcomeBannerUrl: string;
  isMaintenance: boolean;
  notificationText: string;
  notificationColor: string;
  notificationEnabled: boolean;
  latestVersionCode: number;
  apkUpdateUrl: string;
  adminContactUrl: string;
  chatEnabled: boolean;
  prerollAdUrl: string;
  prerollAdEnabled: boolean;
  tokens: TokenObject[];
  customChannels: CustomChannel[];
}
