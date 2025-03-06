import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

import { AppointmentSlotsApiResponse } from "../../components/capacity/AppointmentSlotsTable/AppointmentSlotsTable.types";

interface AppointmentSlotsState {
    data: AppointmentSlotsApiResponse;
    status: 'idle' | 'loading' | 'Success' | 'Failure';
    error?: string | null;
};

const initialState: AppointmentSlotsState = {
    data: {
        serviceTerritories: [],
        lastUpdatedDate: '',
        baseResponse: {
            message: '',
            responseStatus: '',
            reasonCode: '',
        },
    },
    status: 'idle',
    error: null,
};

export const fetchAppointmentSlots = createAsyncThunk(
    'appointmentSlots/fetchAppointmentSlots',
    async () => {
        const response = await axiosInstance.get('http://localhost:3000/getAppointmentSlotsHierarchy', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    }
);

const appointmentSlotsSlice = createSlice({
    name: 'AppointmentSlots',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAppointmentSlots.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAppointmentSlots.fulfilled, (state, action: PayloadAction<AppointmentSlotsApiResponse>) => {
                state.status = 'Success';
                state.data = action.payload;
            })
            .addCase(fetchAppointmentSlots.rejected, (state, action) => {
                state.status = 'Failure';
                state.error = action.error.message || 'Failed to fetch Capacity Stream';
            })
    }
});

export default appointmentSlotsSlice.reducer;