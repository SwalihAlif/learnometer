// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './slices/toastSlice';
import confirmDialogReducer from './slices/confirmDialogSlice';
import paginationReducer from './slices/paginationSlice'

const store = configureStore({
  reducer: {
    toast: toastReducer,
    confirmDialog: confirmDialogReducer,
    pagination: paginationReducer,
  },
});

export default store;
