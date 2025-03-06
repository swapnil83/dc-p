import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

import { CapacityStreamApiResponse } from "../../components/capacity/CapacityStreamTable/CapacityStreamTable.types";

interface CapacityStreamState {
    data: CapacityStreamApiResponse;
    status: 'idle' | 'loading' | 'Success' | 'Failure';
    error?: string | null;
};

const initialState: CapacityStreamState = {
    data: {
        capacityStraem: [],
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

export const fetchCapacityStream = createAsyncThunk(
    'capacityStream/fetchCapacityStream',
    async () => {
        const response = await axiosInstance.get('http://localhost:3000/getCapacityStreamHierarchy', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    }
);

const capacityStreamSlice = createSlice({
    name: 'capacityStream',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCapacityStream.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCapacityStream.fulfilled, (state, action: PayloadAction<CapacityStreamApiResponse>) => {
                state.status = 'Success';
                state.data = action.payload;
            })
            .addCase(fetchCapacityStream.rejected, (state, action) => {
                state.status = 'Failure';
                state.error = action.error.message || 'Failed to fetch Capacity Stream';
            })
    }
});

export default capacityStreamSlice.reducer;