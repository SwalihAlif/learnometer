// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './slices/toastSlice';
import confirmDialogReducer from './slices/confirmDialogSlice';
import paginationReducer from './slices/paginationSlice';
import loaderReducer from './slices/loaderSlice';

const store = configureStore({
  reducer: {
    toast: toastReducer,
    confirmDialog: confirmDialogReducer,
    pagination: paginationReducer,
    loader: loaderReducer,
  },
});

export default store;
