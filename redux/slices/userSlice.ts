import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from '../../config/constant';
import { 
  User, 
  UserToken, 
  LoginFormData, 
  SignUpFormData, 
  AsyncState,
  ApiResponse 
} from '@/types';


// State interface using centralized types
interface UserState extends AsyncState<UserToken> {}

// Request interfaces
interface VerifyData {
  confirmationCode: string;
  email: string;
}

interface VerifyEmailRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface PasswordResetRequestResponse {
  message: string;
  expiresAt: string;
}

export const PASSWORD_RESET_CONTEXT_KEY = 'nrv-password-reset-context';

interface LandlordUserData {
  firstName: string;
  lastName: string;
  email: string;
  nin: string;
  propertyId: string;
  ownerId: string;
  rentEndDate?: string;
  rentStartDate?: string;
  accountType: string;
}

interface UpdateUserRequest {
  id: string;
  payload: Partial<User> | FormData;
}

interface UpdatePlanRequest {
  userId: string;
  planId: string;
}

interface AddCreditsRequest {
  userId: string;
  standardVerification?: number;
  premiumVerification?: number;
}

interface TenancyRequest {
  id: string;
  rentEndDate?: string;
  rentStartDate?: string;
  reason?: string;
  comment?: string;
}

// Initial state
const initialState: UserState = {
  data: null,
  loading: "idle",
  error: null,
};

// API helper function
const handleApiError = (error: any): string => {
  console.log({error})
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return "An error occurred, please try again later";
};

// Async thunks
export const createUser = createAsyncThunk<UserToken, SignUpFormData>(
  "user/create",
  async (formData: SignUpFormData, { rejectWithValue }) => {
    try {
      const body = new FormData();
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("email", formData.email);
      body.append("phoneNumber", formData.phoneNumber);
      body.append("password", formData.password);
      body.append("accountType", formData.accountType);
      if (formData.nin) {
        body.append("nin", formData.nin);
      }
      if (formData.homeAddress) {
        body.append("homeAddress", formData.homeAddress);
      }
      if (formData.file instanceof File) {
        body.append("file", formData.file);
      }

      const response = await axios.post<ApiResponse<UserToken>>(
        `${API_URL}/users`,
        body,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      localStorage.setItem("emailToVerify", JSON.stringify(response.data));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateUser = createAsyncThunk<UserToken, UpdateUserRequest>(
  "user/update",
  async ({ id, payload }: UpdateUserRequest, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApiResponse<UserToken>>(
        `${API_URL}/users/${id}`, 
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateUserPlan = createAsyncThunk<UserToken, UpdatePlanRequest>(
  "user/updatePlan",
  async ({ userId, planId }: UpdatePlanRequest, { getState, rejectWithValue }) => {
    try {
      const stored = localStorage.getItem("nrv-user");
      const token = stored ? (JSON.parse(stored)?.accessToken) : undefined;
      const response = await axios.patch<{ data: any; status: string; message: string }>(
        `${API_URL}/users/${userId}/plan`,
        { planId },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const updatedUser = response.data.data;
      const current = (getState() as any).user?.data;
      return {
        ...current,
        user: updatedUser,
      } as UserToken;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

/** One-time purchase: buy a pack and add credits to user (stackable). */
export const purchasePack = createAsyncThunk<UserToken, UpdatePlanRequest>(
  "user/purchasePack",
  async ({ userId, planId }: UpdatePlanRequest, { getState, rejectWithValue }) => {
    try {
      const stored = localStorage.getItem("nrv-user");
      const token = stored ? (JSON.parse(stored)?.accessToken) : undefined;
      const response = await axios.post<{ data: any; status: string; message: string }>(
        `${API_URL}/users/${userId}/purchase-pack`,
        { planId },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const updatedUser = response.data.data;
      const current = (getState() as any).user?.data;
      return {
        ...current,
        user: updatedUser,
      } as UserToken;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

/** Add credits one at a time (or in quantity) for affordability. */
export const addCredits = createAsyncThunk<UserToken, AddCreditsRequest>(
  "user/addCredits",
  async (
    { userId, standardVerification, premiumVerification }: AddCreditsRequest,
    { getState, rejectWithValue },
  ) => {
    try {
      const stored = localStorage.getItem("nrv-user");
      const token = stored ? (JSON.parse(stored)?.accessToken) : undefined;
      const response = await axios.post<{ data: any; status: string; message: string }>(
        `${API_URL}/users/${userId}/add-credits`,
        { standardVerification, premiumVerification },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const updatedUser = response.data.data;
      const current = (getState() as any).user?.data;
      return {
        ...current,
        user: updatedUser,
      } as UserToken;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyAccount = createAsyncThunk<UserToken, VerifyData>(
  "user/verify",
  async (verifyData: VerifyData, { rejectWithValue }) => {
    try {
      const response: any = await axios.post<ApiResponse<UserToken>>(
        `${API_URL}/users/confirm-account`, 
        verifyData,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      
      const payload = response.data?.data ?? response.data;
      const userData = {
        user: payload?.user ?? response.data?.user,
        accessToken: payload?.accessToken ?? response.data?.accessToken,
        notificationSettings: payload?.notificationSettings ?? response.data?.notificationSettings,
      };
      localStorage.setItem("nrv-user", JSON.stringify(userData));
      localStorage.removeItem("emailToVerify");
      return userData;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const resendVerificationOtp = createAsyncThunk<string, { email: string }>(
  "user/resendVerificationOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ status: string; message: string }>(
        `${API_URL}/users/resend-verification`,
        { email },
        { headers: { "Content-Type": "application/json" } },
      );
      return response.data?.message || "Verification code sent.";
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const loginUser = createAsyncThunk<UserToken, LoginFormData>(
  "user/login",
  async (loginData: LoginFormData, { rejectWithValue }) => {
    try {
      const response: any = await axios.post<ApiResponse<UserToken>>(
        `${API_URL}/auth/login`, 
        {
          email: loginData.email,
          password: loginData.password,
          rememberMe: Boolean(loginData.rememberMe),
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      const safeUser = { ...(response.data.user || {}) };
      delete safeUser.password;
      delete safeUser.confirmationCode;
      delete safeUser.passwordResetToken;
      delete safeUser.passwordResetExpires;

      const userData = {
        user: safeUser,
        accessToken: response.data.accessToken,
        notificationSettings: response.data.notificationSettings
      };

      // Only persist a session for active users.
      // For inactive users, store the email so they can verify, but don't create a session token.
      // Suspended / deactivated accounts must never get a local session.
      const accountStatus = String(userData?.user?.status || "").toLowerCase();
      if (accountStatus === "suspended" || accountStatus === "deactivated") {
        localStorage.removeItem("nrv-user");
        const { clearRoleCookie, getAccountBlockedMessage } = await import(
          "@/lib/authSession"
        );
        clearRoleCookie();
        return rejectWithValue(getAccountBlockedMessage(accountStatus));
      }
      if (accountStatus === "inactive") {
        localStorage.removeItem("nrv-user");
        const { clearRoleCookie } = await import("@/lib/authSession");
        clearRoleCookie();
        if (userData?.user?.email) {
          localStorage.setItem("emailToVerify", JSON.stringify({ data: { email: userData.user.email } }));
        }
      } else {
        localStorage.setItem("nrv-user", JSON.stringify(userData));
        localStorage.removeItem("emailToVerify");
        if (loginData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
        const { touchSessionActivity } = await import("@/lib/sessionIdle");
        const { syncRoleCookieFromSession } = await import("@/lib/authSession");
        touchSessionActivity();
        syncRoleCookieFromSession(userData);
      }
      return userData;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createUserByLandlord = createAsyncThunk<UserToken, LandlordUserData>(
  "user/create/landlord",
  async (formData: LandlordUserData, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse<UserToken>>(
        `${API_URL}/users/landlord`, 
        formData,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getTenantsOnboardedByLandlord = createAsyncThunk<any, { id: string }>(
  "onboarded-by-landlord/get",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApiResponse<any>>(
        `${API_URL}/properties/tenant/landlord-onboarded/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyEmail = createAsyncThunk<
  PasswordResetRequestResponse,
  VerifyEmailRequest
>(
  "user/reset-code-token",
  async (verifyEmail: VerifyEmailRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post<PasswordResetRequestResponse>(
        `${API_URL}/users/request-password-reset`, 
        verifyEmail,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const resetPassword = createAsyncThunk<UserToken, ResetPasswordRequest>(
  "user/reset-password",
  async (resetData: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse<UserToken>>(
        `${API_URL}/users/reset-password`, 
        resetData,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const setPasswordAfterInvite = createAsyncThunk<
  UserToken,
  { newPassword: string; confirmPassword: string }
>(
  "user/set-password-after-invite",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const stored = localStorage.getItem("nrv-user");
      const token = stored ? JSON.parse(stored)?.accessToken : undefined;
      if (!token) {
        return rejectWithValue("Please sign in again to set your password.");
      }
      const response = await axios.post<{
        status: string;
        message: string;
        data: any;
      }>(`${API_URL}/users/set-password`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUser = response.data.data;
      const current =
        (getState() as any).user?.data ||
        (stored ? JSON.parse(stored) : null) ||
        {};
      const userData = {
        ...current,
        user: {
          ...(current?.user || {}),
          ...updatedUser,
          mustChangePassword: false,
        },
        accessToken: current?.accessToken || token,
      };
      localStorage.setItem("nrv-user", JSON.stringify(userData));
      return userData as UserToken;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const endTenancyTenure = createAsyncThunk<UserToken, TenancyRequest>(
  "tenancy/end",
  async ({ id, reason, comment }: TenancyRequest, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApiResponse<UserToken>>(
        `${API_URL}/rooms/${id}/end-tenure`,
        {
          reason,
          comment,
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const addTenancyComment = createAsyncThunk<
  any,
  { id: string; comment: string; authorId?: string }
>(
  "tenancy/comment",
  async ({ id, comment, authorId }, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse<any>>(
        `${API_URL}/rooms/${id}/tenancy-comments`,
        {
          comment,
          authorId,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const extendTenancyTenure = createAsyncThunk<UserToken, TenancyRequest>(
  "tenancy/update",
  async ({ id, rentEndDate }: TenancyRequest, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApiResponse<UserToken>>(
        `${API_URL}/rooms/${id}/extend-tenancy`, 
        { rentEndDate },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const assignDateTenancyTenure = createAsyncThunk<UserToken, TenancyRequest>(
  "tenancy/assign-date",
  async ({ id, rentEndDate, rentStartDate }: TenancyRequest, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApiResponse<UserToken>>(
        `${API_URL}/rooms/${id}/assign-tenancy-date`, 
        { rentEndDate, rentStartDate },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Create user slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserToken: (state) => {
      state.data = null;
      state.loading = "idle";
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    /** Merge fresh user profile (credits, etc.) after payment or verification use. */
    setUserFromPayment: (state, action: PayloadAction<{ user: any }>) => {
      if (!state.data || !action.payload.user) return;
      const next = { ...action.payload.user };
      delete next.password;
      state.data = { ...state.data, user: next };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Verify account
      .addCase(verifyAccount.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(verifyAccount.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Update user plan
      .addCase(updateUserPlan.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(updateUserPlan.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(updateUserPlan.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Purchase pack (one-time, stackable credits)
      .addCase(purchasePack.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(purchasePack.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(purchasePack.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Add credits (1 by 1 for affordability)
      .addCase(addCredits.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(addCredits.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(addCredits.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Create user by landlord
      .addCase(createUserByLandlord.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(createUserByLandlord.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(createUserByLandlord.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Get tenants onboarded by landlord
      .addCase(getTenantsOnboardedByLandlord.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(getTenantsOnboardedByLandlord.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(getTenantsOnboardedByLandlord.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Verify email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = "succeeded";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      .addCase(setPasswordAfterInvite.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(setPasswordAfterInvite.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(setPasswordAfterInvite.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // End tenancy tenure
      .addCase(endTenancyTenure.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(endTenancyTenure.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(endTenancyTenure.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Extend tenancy tenure
      .addCase(extendTenancyTenure.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(extendTenancyTenure.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(extendTenancyTenure.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      // Assign date tenancy tenure
      .addCase(assignDateTenancyTenure.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(assignDateTenancyTenure.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(assignDateTenancyTenure.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { clearUserToken, clearError, setUserFromPayment } = userSlice.actions;
export default userSlice.reducer;
