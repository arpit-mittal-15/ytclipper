export type {
  DashboardData,
  DashboardStats,
  MostUsedTag,
  RecentActivity,
  RecentNote,
  RecentVideo,
} from './dashboard';
export { extensionMessaging } from './extension-messaging';
export type {
  ExtensionAuthMessage,
  ExtensionResponse,
  ExtensionUser,
} from './extension-messaging';
export {
  getExtensionStatus,
  syncAuthState,
  syncAuthenticatedUser,
  syncLogout,
} from './extension-sync';
export type { ExtensionSyncResult } from './extension-sync';
export type {
  CreateTimestampRequest,
  DeleteTimestampResponse,
  GetTimestampsResponse,
  Timestamp,
} from './timestamps';
export type { GetUserVideosResponse, VideoSummary } from './videos';
