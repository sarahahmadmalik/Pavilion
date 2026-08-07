import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchOfficeAssets,
  createOfficeAsset,
  updateOfficeAsset,
  deleteOfficeAsset
} from '../lib/supabaseService.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { BarcodeScannerModal } from '../components/modules/BarcodeScannerModal.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Scan, X, Upload } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';

export const OfficeAssetList = (props) => {
  const layoutContext = useLayout();
  const triggerExportModal = props.triggerExportModal || layoutContext.triggerExportModal;
  const triggerImportModal = props.triggerImportModal || layoutContext.triggerImportModal;
  const searchQuery = props.searchQuery || layoutContext.searchQuery;
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('office_assets', 'view');
  const canAdd = hasModulePermission('office_assets', 'add');
  const canEdit = hasModulePermission('office_assets', 'edit');
  const canDelete = hasModulePermission('office_assets', 'delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Form State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    barcode: '',
    description: '',
    status: 'In Use',
    location: ''
  });

  // Scanner Modal State
  const [showScanner, setShowScanner] = useState(false);

  // Confirm Delete State
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await fetchOfficeAssets();
    if (!error && Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load office asset records.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!canView) return <AccessDenied moduleName="Office Asset List" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.barcode || '').toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [query, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      barcode: '',
      description: '',
      status: 'In Use',
      location: ''
    });
    setIsSlideOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsViewOnly(false);
    setFormData({ ...item });
    setIsSlideOpen(true);
  };

  const handleOpenView = (item) => {
    setEditingItem(item);
    setIsViewOnly(true);
    setFormData({ ...item });
    setIsSlideOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingItem) {
      const { error } = await updateOfficeAsset(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Asset updated successfully.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { error } = await createOfficeAsset(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Registered asset "${formData.description}".` });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    }
    setIsSlideOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      const itemToDelete = items.find(i => i.id === deletingId);
      const { error } = await deleteOfficeAsset(deletingId, itemToDelete?.description, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Asset record deleted.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Barcode Tag', key: 'barcode' },
    { label: 'Asset Description', key: 'description' },
    { label: 'Status', key: 'status' },
    { label: 'Location', key: 'location' }
  ];

  const resetFilters = () => {
    setStatusFilter('All');
    setLocalSearch('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Central Office Asset Inventory
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage institutional hardware, office equipment, barcode tags, and room deployments.
          </p>
        </div>

        <div className="page-header-actions">
          {canAdd && (
            <button
              className="btn btn-secondary"
              onClick={() => triggerImportModal?.('office_assets')}
              title="Import records from Excel spreadsheet"
            >
              <Upload size={16} /> Import
            </button>
          )}
          <button
            className="btn btn-export"
            onClick={() => triggerExportModal?.('Office Asset List', filteredItems, exportColumns)}
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Responsive Filter Bar */}
      <ResponsiveFilterBar
        searchVal={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search barcode tag, description, or location..."
        activeFilterCount={statusFilter !== 'All' ? 1 : 0}
        onClearFilters={resetFilters}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'In Use', value: 'In Use' },
              { label: 'In Storage', value: 'In Storage' },
              { label: 'Retired', value: 'Retired' }
            ]}
            style={{ width: '160px' }}
          />
        </div>
      </ResponsiveFilterBar>

      {/* Data Table */}
      {loading ? (
        <TableLoader rows={6} cols={5} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Barcode Tag</th>
                <th>Asset Description</th>
                <th>Status</th>
                <th>Current Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {item.barcode}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.description}</span>
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{item.location}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenView(item)}>
                        <Eye size={16} color="var(--text-muted)" />
                      </button>
                      {canEdit && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(item)}>
                          <Edit size={16} color="var(--color-primary)" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeletingId(item.id)}>
                          <Trash2 size={16} color="#DC2626" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No Office Assets Found"
          description="No asset records found."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Register Asset"
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
      />

      {/* SlideOver Form Drawer */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={isViewOnly ? 'Asset Details' : editingItem ? 'Edit Asset Information' : 'Register Office Asset'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Barcode Tag Number
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className="input-control"
                style={{ fontFamily: 'Consolas, monospace', fontWeight: 600 }}
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
              {!isViewOnly && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowScanner(true)}
                  title="Simulate Camera Barcode Scan"
                >
                  <Scan size={16} /> Scan
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Asset Description & Model
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Dell Latitude 5540 i7 16GB Laptop"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CustomSelect
              label="Status"
              value={formData.status}
              onChange={v => setFormData({ ...formData, status: v })}
              disabled={isViewOnly}
              options={[
                { label: 'In Use', value: 'In Use' },
                { label: 'In Storage', value: 'In Storage' },
                { label: 'Retired', value: 'Retired' }
              ]}
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Office / Building Location
              </label>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Server Room"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary">
                Save Asset Record
              </button>
            )}
          </div>
        </form>
      </SlideOver>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(scannedCode) => {
          setFormData(prev => ({ ...prev, barcode: scannedCode }));
          setToast?.({ type: 'success', message: `Scanned barcode: ${scannedCode}` });
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Office Asset"
        message="Are you sure you want to delete this asset record?"
      />
    </div>
  );
};

