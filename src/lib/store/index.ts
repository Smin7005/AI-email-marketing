import { configureStore } from '@reduxjs/toolkit';
import leadsReducer from './leadsSlice';

export const store = configureStore({
  reducer: {
    leads: leadsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
