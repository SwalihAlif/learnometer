import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../axios";

export const fetchPaginatedData = createAsyncThunk(
  "pagination/fetchData",
  async ({ url, page = 1, queryParams = {} }, thunkAPI) => {
    const query = new URLSearchParams({ ...queryParams, page }).toString();
    const res = await axiosInstance.get(`${url}?${query}`);
    return { ...res.data, page };
  }
);

const paginationSlice = createSlice({
  name: "pagination",
  initialState: {
    results: [],
    count: 0,
    page: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaginatedData.fulfilled, (state, action) => {
        state.results = action.payload.results;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.loading = false;
      })
      .addCase(fetchPaginatedData.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export default paginationSlice.reducer;
