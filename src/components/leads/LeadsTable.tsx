'use client';

import { useState, useRef, useCallback } from 'react';
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
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowDrag: false,
    },
    {
      headerName: 'Business',
      field: 'company_name',
      filter: true,
      sortable: true,
      width: 250,
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
      width: 200,
      cellRenderer: (params: any) => {
        return <div className="text-sm text-gray-900">{params.value || '-'}</div>;
      },
    },
    {
      headerName: 'Contact',
      width: 250,
      cellRenderer: (params: any) => {
        const data = params.data;
        return (
          <div className="space-y-1 py-2">
            {data.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                <a
                  href={`mailto:${data.email}`}
                  className="hover:text-blue-600 truncate max-w-[200px] block"
                >
                  {data.email}
                </a>
              </div>
            )}
            {data.phone_number && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                <a href={`tel:${data.phone_number}`} className="hover:text-blue-600">
                  {data.phone_number}
                </a>
              </div>
            )}
            {!data.email && !data.phone_number && (
              <div className="text-sm text-gray-400">No contact info</div>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Address',
      width: 300,
      cellRenderer: (params: any) => {
        const data = params.data;
        const addressParts = [
          data.address_suburb,
          data.address_state,
          data.address_postcode
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');
        return (
          <div className="text-sm text-gray-600 truncate py-2 max-w-[280px]">
            {fullAddress || '-'}
          </div>
        );
      },
    },
    {
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return (
          <button
            onClick={() => {
              setSelectedCompanyIds([params.data.listing_id]);
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
          >
            Save
          </button>
        );
      },
    },
  ];

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows();
      setSelectedCompanyIds(selectedRows.map((row: Company) => row.listing_id));
    }
  }, []);

  const selectedCompanies = leads
    .filter((lead) => selectedCompanyIds.includes(lead.listing_id))
    .map((lead) => ({ id: lead.listing_id, name: lead.company_name }));

  const handleSaveSuccess = () => {
    setSelectedCompanyIds([]);
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
      {selectedCompanyIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
            <span className="font-medium">
              {selectedCompanyIds.length} selected
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Save to Collection
            </button>
            <button
              onClick={() => {
                setSelectedCompanyIds([]);
                if (gridApiRef.current) {
                  gridApiRef.current.deselectAll();
                }
              }}
              className="text-blue-100 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-quartz h-[600px] w-full" style={{ height: '600px', width: '100%' }}>
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
        selectedCompanies={selectedCompanies}
        onSuccess={handleSaveSuccess}
      />
    </>
  );
}
