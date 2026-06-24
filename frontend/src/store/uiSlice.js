import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeBoardView: "Board",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveBoardView(state, action) {
      state.activeBoardView = action.payload;
    },
  },
});

export const { setActiveBoardView } = uiSlice.actions;
export default uiSlice.reducer;
