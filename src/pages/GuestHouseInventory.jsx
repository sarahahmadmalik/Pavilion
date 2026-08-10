import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGHInventory,
  createGHInventory,
  updateGHInventory,
  deleteGHInventory
} from '../lib/supabaseService.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Package, X, Upload } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';

export const GuestHouseInventory = (props) => {
  const layoutContext = useLayout();
  const triggerExportModal = props.triggerExportModal || layoutContext.triggerExportModal;
  const triggerImportModal = props.triggerImportModal || layoutContext.triggerImportModal;
  const searchQuery = props.searchQuery || layoutContext.searchQuery;
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('gh_inventory', 'view');
  const canAdd = hasModulePermission('gh_inventory', 'add');
  const canEdit = hasModulePermission('gh_inventory', 'edit');
  const canDelete = hasModulePermission('gh_inventory', 'delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Form State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    qty: 1,
    condition: 'Good',
    location: '',
    notes: ''
  });

  // Confirm Delete State
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async (q) => {
    setLoading(true);
    const searchTerm = q !== undefined ? q : (searchQuery || localSearch);
    const { data, error } = await fetchGHInventory(searchTerm);
    if (!error && Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load inventory items.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(searchQuery || localSearch);
  }, [searchQuery, localSearch]);

  if (!canView) return <AccessDenied moduleName="Guest House Inventory" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.item || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query) ||
      (item.notes && item.notes.toLowerCase().includes(query));

    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter;
    const matchesMinQty = !minQty || Number(item.qty) >= Number(minQty);
    const matchesMaxQty = !maxQty || Number(item.qty) <= Number(maxQty);

    return matchesSearch && matchesCondition && matchesMinQty && matchesMaxQty;
  });

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [query, conditionFilter, minQty, maxQty]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      item: '',
      qty: '',
      condition: 'Good',
      location: '',
      notes: ''
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
      const { error } = await updateGHInventory(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Updated inventory item "${formData.item}".` });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { error } = await createGHInventory(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Added "${formData.item}" to inventory.` });
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
      const { error } = await deleteGHInventory(deletingId, itemToDelete?.item, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Inventory item deleted.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Item Name', key: 'item' },
    { label: 'Quantity', key: 'qty' },
    { label: 'Condition', key: 'condition' },
    { label: 'Location', key: 'location' },
    { label: 'Notes', key: 'notes' }
  ];

  const resetFilters = () => {
    setConditionFilter('All');
    setMinQty('');
    setMaxQty('');
    setLocalSearch('');
  };

  const hasActiveFilters = conditionFilter !== 'All' || minQty || maxQty || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Guest House Inventory Stock
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track furniture, bedding, electronics, appliances, and room inventory status.
          </p>
        </div>

        <div className="page-header-actions">
          {canAdd && (
            <button
              className="btn btn-secondary"
              onClick={() => triggerImportModal?.('gh_inventory')}
              title="Import records from Excel spreadsheet"
            >
              <Upload size={16} /> Import
            </button>
          )}
          <button
            className="btn btn-export"
            onClick={() => triggerExportModal?.('Guest House Inventory', filteredItems, exportColumns, items)}
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Responsive Filter Bar */}
      <ResponsiveFilterBar
        searchVal={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search item, location, notes..."
        activeFilterCount={(conditionFilter !== 'All' ? 1 : 0) + (minQty ? 1 : 0) + (maxQty ? 1 : 0)}
        onClearFilters={resetFilters}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Condition:</span>
          <CustomSelect
            value={conditionFilter}
            onChange={setConditionFilter}
            options={[
              { label: 'All Conditions', value: 'All' },
              { label: 'Good', value: 'Good' },
              { label: 'Fair', value: 'Fair' },
              { label: 'Damaged', value: 'Damaged' }
            ]}
            style={{ width: '160px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Min Qty:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Min"
            value={minQty}
            onChange={e => setMinQty(e.target.value)}
            style={{ width: '80px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Max Qty:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Max"
            value={maxQty}
            onChange={e => setMaxQty(e.target.value)}
            style={{ width: '80px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          />
        </div>
      </ResponsiveFilterBar>

      {/* Data Table */}
      {loading ? (
        <TableLoader rows={6} cols={6} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Condition</th>
                <th>Storage / Room Location</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.item}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.qty} units</span>
                  </td>
                  <td><StatusBadge status={item.condition} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{item.location}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.notes || '�'}
                  </td>
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
          title="No Inventory Items Found"
          description="No items found in guest house inventory matching filters."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Add Inventory Item"
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
        title={isViewOnly ? 'Inventory Item Details' : editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Item Name
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              placeholder="e.g. Egyptian Cotton Bedding Sets"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Quantity
              </label>
              <input
                type="number"
                min={1}
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 1 })}
              />
            </div>
            <CustomSelect
              label="Condition"
              value={formData.condition}
              onChange={v => setFormData({ ...formData, condition: v })}
              disabled={isViewOnly}
              options={[
                { label: 'Good', value: 'Good' },
                { label: 'Fair', value: 'Fair' },
                { label: 'Damaged', value: 'Damaged' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Storage / Room Location
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Laundry Linen Closet"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Notes / Description
            </label>
            <textarea
              rows={3}
              disabled={isViewOnly}
              className="input-control"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Purchased in Jan 2026 for VIP Delegation suites"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary">
                Save Item
              </button>
            )}
          </div>
        </form>
      </SlideOver>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item?"
      />
    </div>
  );
};

