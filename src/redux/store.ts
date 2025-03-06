import { configureStore } from "@reduxjs/toolkit";

import capacityStreamSlice from './slices/capacityStreamSlice';
import appointmentSlotsSlice from './slices/appointmentSlotsSlice';

export const store = configureStore({
    reducer: {
        capacityStream: capacityStreamSlice,
        appointmentSlots: appointmentSlotsSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
