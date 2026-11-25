/**
 * PARKIN — Smart Campus Parking
 * Types: Push & Local Notifications
 */

export type NotificationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'unsupported';

export type NotificationTargetScreen =
  | 'parking'
  | 'location'
  | 'prediction'
  | 'history'
  | 'notifications';

export interface NotificationPayloadData {
  screen: NotificationTargetScreen;
  areaId?: string;
  notificationId?: string;
  category?: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  data: NotificationPayloadData;
  receivedAt: number;
  tapped?: boolean;
  source: 'push' | 'local';
}

export interface PushRegistrationResult {
  success: boolean;
  permissionStatus: NotificationPermissionStatus;
  token: string | null;
  isFallbackToken: boolean;
  backendSynced: boolean;
  message: string;
}

export interface SendPushResult {
  success: boolean;
  simulated?: boolean;
  offline?: boolean;
  message: string;
}
