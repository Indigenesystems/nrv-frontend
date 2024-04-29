import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from '../../config/constant';


interface UserState {
    data: UserData | null;
    loading: "idle" | "pending" | "succeeded" | "failed";
    error: string | null;
}

export interface UserData {
    token: string
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    nin: string;
    password: string;
    phoneNumber: string;
    homeAddress: string;
    accountType: string;
}

interface verifyData {
    confirmationCode: string;
    email: string;
}

interface loginData {
    password: string;
    email: string;
}
// Define the initia l state
const initialState: UserState = {
    data: null,
    loading: "idle",
    error: null,
};

// Async thunk to fetch user data
export const createUser = createAsyncThunk<UserData, FormData, {}>(
    "user/create",
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const response: any = await axios.post(`${API_URL}/users`, formData, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            localStorage.setItem("emailToVerify", JSON.stringify(response?.data))
            return response.data;
        } catch (error: any) {
            if (error.response.data.message) {
                return rejectWithValue(error.response.data.message);
            } else {
                return rejectWithValue("An error occurred, please try again later");
            }
        }
    }
);

// Async thunk to verify user
export const verifyAccount = createAsyncThunk<UserData, verifyData, {}>(
    "user/verify",
    async (verifyData: verifyData, { rejectWithValue }) => {
        try {
            const response: any = await axios.post(`${API_URL}/users/confirm-account`, verifyData, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            localStorage.setItem("nrv-user", JSON.stringify(response?.data))
            localStorage.removeItem("emailToVerify");
            return response.data;
        } catch (error: any) {
            if (error.response.data.message) {
                return rejectWithValue(error.response.data.message);
            } else {
                return rejectWithValue("An error occurred, please try again later");
            }
        }
    }
);

// Async thunk to login user
export const loginUser = createAsyncThunk<UserData, loginData, {}>(
    "user/login",
    async (loginData: loginData, { rejectWithValue }) => {
        try {
            const response: any = await axios.post(`${API_URL}/auth/login`, loginData, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            localStorage.setItem("nrv-user", JSON.stringify(response?.data))
            localStorage.removeItem("emailToVerify");
            return response.data;
        } catch (error: any) {
            if (error.response.data.message) {
                return rejectWithValue(error.response.data.message);
            } else {
                return rejectWithValue("An error occurred, please try again later");
            }
        }
    }
);


// Create user slice
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUserData: (state) => {
            state.data = null;
            state.loading = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
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
            });
    },
});

// Export actions and reducer
export const { clearUserData } = userSlice.actions;
export default userSlice.reducer;
