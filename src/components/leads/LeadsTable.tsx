'use client';

import { useRef, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule
} from 'ag-grid-community';
import { Mail, Phone } from 'lucide-react';
import AddToCollectionModal from './AddToCollectionModal';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  addSelectedLead,
  removeSelectedLead,
  clearSelectedLeads,
} from '@/lib/store/leadsSlice';
import { useState } from 'react';

// Register all AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Company {
  listing_id: string;
  company_name: string;
  category_name: string | null;
  email: string | null;
  phone_number: string | null;
  address_suburb: string | null;
  address_state: string | null;
  address_postcode: string | null;
}

interface LeadsTableProps {
  leads: Company[];
  activeFilters?: string[];
}

export default function LeadsTable({ leads, activeFilters = [] }: LeadsTableProps) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redux state
  const dispatch = useAppDispatch();
  const selectedLeads = useAppSelector((state) => state.leads.selectedLeads);
  const selectedCompanyIds = selectedLeads.map(lead => lead.id);

  // Column definitions - removed inner checkbox column and Actions column
  const columnDefs: ColDef[] = [
    {
      headerName: 'Business',
      field: 'company_name',
      filter: true,
      sortable: true,
      width: 200,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center py-2">
            <div className="text-sm font-medium text-gray-900">{params.value}</div>
          </div>
        );
      },
    },
    {
      headerName: 'Category',
      field: 'category_name',
      filter: true,
      sortable: true,
      width: 150,
      cellRenderer: (params: any) => {
        return <div className="text-sm text-gray-900">{params.value || '-'}</div>;
      },
    },
    {
      headerName: 'Phone_Number',
      field: 'phone_number',
      filter: true,
      sortable: true,
      width: 140,
      cellRenderer: (params: any) => {
        const data = params.data;
        return (
          <div className="py-2">
            {data.phone_number ? (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                <a href={`tel:${data.phone_number}`} className="hover:text-blue-600">
                  {data.phone_number}
                </a>
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Email',
      field: 'email',
      filter: true,
      sortable: true,
      width: 200,
      cellRenderer: (params: any) => {
        const data = params.data;
        return (
          <div className="py-2">
            {data.email ? (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                <a
                  href={`mailto:${data.email}`}
                  className="hover:text-blue-600 truncate max-w-[180px] block"
                >
                  {data.email}
                </a>
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Detail_Address',
      field: 'address_suburb',
      filter: true,
      sortable: true,
      width: 150,
      cellRenderer: (params: any) => {
        return (
          <div className="text-sm text-gray-600 truncate py-2">
            {params.value || '-'}
          </div>
        );
      },
    },
    {
      headerName: 'State_Abbreviation',
      field: 'address_state',
      filter: true,
      sortable: true,
      width: 80,
      cellRenderer: (params: any) => {
        return (
          <div className="text-sm text-gray-600 py-2">
            {params.value || '-'}
          </div>
        );
      },
    },
    {
      headerName: 'Postcode',
      field: 'address_postcode',
      filter: true,
      sortable: true,
      width: 90,
      cellRenderer: (params: any) => {
        return (
          <div className="text-sm text-gray-600 py-2">
            {params.value || '-'}
          </div>
        );
      },
    },
  ];

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;

    // Restore selection state from Redux when grid is ready
    setTimeout(() => {
      if (gridApiRef.current) {
        gridApiRef.current.forEachNode((node) => {
          if (selectedCompanyIds.includes(node.data.listing_id)) {
            node.setSelected(true);
          }
        });
      }
    }, 0);
  }, [selectedCompanyIds]);

  // Sync grid selection when leads data changes (pagination)
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.forEachNode((node) => {
        const isSelected = selectedCompanyIds.includes(node.data.listing_id);
        if (node.isSelected() !== isSelected) {
          node.setSelected(isSelected);
        }
      });
    }
  }, [leads, selectedCompanyIds]);

  const onSelectionChanged = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows() as Company[];
      const currentPageIds = leads.map(lead => lead.listing_id);

      // Get IDs of rows selected on current page
      const newSelectedIds = selectedRows.map(row => row.listing_id);

      // For each lead on the current page, update Redux state
      currentPageIds.forEach(id => {
        const lead = leads.find(l => l.listing_id === id);
        if (!lead) return;

        const isNowSelected = newSelectedIds.includes(id);
        const wasSelected = selectedCompanyIds.includes(id);

        if (isNowSelected && !wasSelected) {
          dispatch(addSelectedLead({ id: lead.listing_id, name: lead.company_name }));
        } else if (!isNowSelected && wasSelected) {
          dispatch(removeSelectedLead(id));
        }
      });
    }
  }, [dispatch, leads, selectedCompanyIds]);

  const handleSaveSuccess = () => {
    dispatch(clearSelectedLeads());
    if (gridApiRef.current) {
      gridApiRef.current.deselectAll();
    }
  };

  const handleCancelSelection = () => {
    dispatch(clearSelectedLeads());
    if (gridApiRef.current) {
      gridApiRef.current.deselectAll();
    }
  };

  // Default column definition for all columns
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: false,
  };

  return (
    <>
      {/* Floating Action Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
            <span className="font-medium">
              {selectedLeads.length} selected
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Save to Collection
            </button>
            <button
              onClick={handleCancelSelection}
              className="text-blue-100 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-quartz w-full">
        <AgGridReact
          rowData={leads}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          rowSelection={{
            mode: 'multiRow',
            headerCheckbox: true,
            checkboxes: true,
            enableClickSelection: false
          }}
          animateRows={true}
          pagination={false}
          suppressAggFuncInHeader={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          loading={false}
          domLayout="autoHeight"
          getRowId={(params) => params.data.listing_id}
        />
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <p className="text-lg font-medium mb-2">
              {activeFilters.length > 0 ? 'No leads found' : 'No leads yet'}
            </p>
            <p className="text-sm">
              {activeFilters.length > 0
                ? 'Try adjusting your search criteria'
                : 'Use the filters above to find business leads'}
            </p>
          </div>
        </div>
      )}

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCompanyIds={selectedCompanyIds}
        selectedCompanies={selectedLeads.map(lead => ({ id: lead.id, name: lead.name }))}
        onSuccess={handleSaveSuccess}
      />
    </>
  );
}
