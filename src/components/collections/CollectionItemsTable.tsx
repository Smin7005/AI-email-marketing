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
import { Mail, Phone, Trash2 } from 'lucide-react';
import { removeCompanyFromCollection } from '@/app/actions/collections';

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

interface CollectionItem {
  id: string;
  collection_id: string;
  listing_id: string;
  created_at: string;
  companyinfo: Company;
}

interface CollectionItemsTableProps {
  items: CollectionItem[];
  collectionId: string;
}

export default function CollectionItemsTable({ items, collectionId }: CollectionItemsTableProps) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

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
      field: 'companyinfo.company_name',
      filter: true,
      sortable: true,
      width: 250,
      cellRenderer: (params: any) => {
        const company = params.data?.companyinfo;
        const companyName = company?.company_name || 'Unknown';
        return (
          <div className="flex items-center py-2">
            <div className="text-sm font-medium text-gray-900">{companyName}</div>
          </div>
        );
      },
    },
    {
      headerName: 'Category',
      field: 'companyinfo.category_name',
      filter: true,
      sortable: true,
      width: 200,
      cellRenderer: (params: any) => {
        const company = params.data?.companyinfo;
        const category = company?.category_name;
        return <div className="text-sm text-gray-900">{category || '-'}</div>;
      },
    },
    {
      headerName: 'Contact',
      width: 250,
      cellRenderer: (params: any) => {
        const data = params.data;
        const company = data?.companyinfo;

        if (!company) {
          return <div className="text-sm text-gray-400">No contact info</div>;
        }

        return (
          <div className="space-y-1 py-2">
            {company.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                <a
                  href={`mailto:${company.email}`}
                  className="hover:text-blue-600 truncate max-w-[200px] block"
                >
                  {company.email}
                </a>
              </div>
            )}
            {company.phone_number && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                <a href={`tel:${company.phone_number}`} className="hover:text-blue-600">
                  {company.phone_number}
                </a>
              </div>
            )}
            {!company.email && !company.phone_number && (
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
        const company = data?.companyinfo;

        if (!company) {
          return <div className="text-sm text-gray-600 truncate py-2 max-w-[280px]">-</div>;
        }

        const addressParts = [
          company.address_suburb,
          company.address_state,
          company.address_postcode
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
            onClick={() => handleRemove(params.data.id)}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-900 font-medium text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Remove
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
      setSelectedItemIds(selectedRows.map((row: CollectionItem) => row.id));
    }
  }, []);

  const handleRemove = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this company from the collection?')) {
      return;
    }

    setIsRemoving(true);
    try {
      await removeCompanyFromCollection(itemId, collectionId);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedItemIds.length === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedItemIds.length} compan${selectedItemIds.length === 1 ? 'y' : 'ies'} from the collection?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      await Promise.all(
        selectedItemIds.map(id => removeCompanyFromCollection(id, collectionId))
      );
      window.location.reload();
    } catch (error) {
      console.error('Error removing items:', error);
      alert('Failed to remove items. Please try again.');
    } finally {
      setIsRemoving(false);
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
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-red-600 text-white rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
            <span className="font-medium">
              {selectedItemIds.length} selected
            </span>
            <button
              onClick={handleBulkRemove}
              disabled={isRemoving}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Remove from Collection
            </button>
            <button
              onClick={() => {
                setSelectedItemIds([]);
                if (gridApiRef.current) {
                  gridApiRef.current.deselectAll();
                }
              }}
              className="text-red-100 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-quartz h-[600px] w-full" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          rowData={items}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          animateRows={true}
          pagination={true}
          paginationPageSize={100}
          enableRangeSelection={true}
          rowMultiSelectWithClick={false}
          suppressAggFuncInHeader={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          loading={false}
        />
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <p className="text-lg font-medium mb-2">No companies in this collection</p>
            <p className="text-sm">
              Save companies from the Leads page to add them to this collection
            </p>
          </div>
        </div>
      )}
    </>
  );
}
