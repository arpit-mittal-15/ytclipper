export { authApi } from './auth';
export type {
  AddPasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './auth';
export { extensionMessaging } from './extension-messaging';
export type {
  ExtensionAuthMessage,
  ExtensionResponse,
  ExtensionUser,
} from './extension-messaging';
export {
  getExtensionStatus,
  syncAuthenticatedUser,
  syncAuthState,
  syncLogout,
} from './extension-sync';
export type { ExtensionSyncResult } from './extension-sync';
