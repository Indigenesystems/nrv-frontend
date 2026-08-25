export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export interface UserData {
  user: {
    accountType: string;
    status: string;
    email?: string;
    mustChangePassword?: boolean;
  };
  // Current API shape uses `accessToken`; keep `token` optional for legacy usage.
  accessToken?: string;
  token?: string;
  notificationSettings?: any;
}

export interface SocialLoginProvider {
  google: 'google';
  facebook: 'facebook';
} 