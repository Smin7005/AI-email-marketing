import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedLead {
  id: string;
  name: string;
}

interface LeadsState {
  selectedLeads: SelectedLead[];
}

const initialState: LeadsState = {
  selectedLeads: [],
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    addSelectedLead: (state, action: PayloadAction<SelectedLead>) => {
      const exists = state.selectedLeads.some(lead => lead.id === action.payload.id);
      if (!exists) {
        state.selectedLeads.push(action.payload);
      }
    },
    removeSelectedLead: (state, action: PayloadAction<string>) => {
      state.selectedLeads = state.selectedLeads.filter(lead => lead.id !== action.payload);
    },
    setSelectedLeads: (state, action: PayloadAction<SelectedLead[]>) => {
      state.selectedLeads = action.payload;
    },
    toggleSelectedLead: (state, action: PayloadAction<SelectedLead>) => {
      const index = state.selectedLeads.findIndex(lead => lead.id === action.payload.id);
      if (index >= 0) {
        state.selectedLeads.splice(index, 1);
      } else {
        state.selectedLeads.push(action.payload);
      }
    },
    clearSelectedLeads: (state) => {
      state.selectedLeads = [];
    },
  },
});

export const {
  addSelectedLead,
  removeSelectedLead,
  setSelectedLeads,
  toggleSelectedLead,
  clearSelectedLeads,
} = leadsSlice.actions;

export default leadsSlice.reducer;
