import { createSlice } from "@reduxjs/toolkit";

const confirmDialogSlice = createSlice({
  name: "confirmDialog",
  initialState: {
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  },
  reducers: {
    showDialog: (state, action) => {
      const { title, message, onConfirm, onCancel } = action.payload;
      state.open = true;
      state.title = title;
      state.message = message;
      state.onConfirm = onConfirm;
      state.onCancel = onCancel;
    },
    hideDialog: (state) => {
      state.open = false;
      state.title = "";
      state.message = "";
      state.onConfirm = null;
      state.onCancel = null;
    },
  },
});

export const { showDialog, hideDialog } = confirmDialogSlice.actions;
export default confirmDialogSlice.reducer;
