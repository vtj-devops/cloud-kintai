import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// eslint-disable-next-line import/no-cycle
import { RootState } from "../../app/store";

export interface SnackbarState {
  success: string | null;
  error: string | null;
  warn: string | null;
}

const initialState: SnackbarState = {
  success: null,
  error: null,
  warn: null,
};

export const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    setSnackbarSuccess: (state, action: PayloadAction<string | null>) => {
      state.success = action.payload;
    },
    setSnackbarError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSnackbarWarn: (state, action: PayloadAction<string | null>) => {
      state.warn = action.payload;
    },
  },
});

export const { setSnackbarSuccess, setSnackbarError, setSnackbarWarn } =
  snackbarSlice.actions;

export default snackbarSlice.reducer;

export const selectSnackbar = (state: RootState) => state.snackbar;
