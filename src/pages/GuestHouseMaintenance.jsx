import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGHMaintenance,
  createGHMaintenance,
  updateGHMaintenance,
  deleteGHMaintenance,
  bulkDeleteRecords,
  bulkUpdateFields
} from '../lib/supabaseService.js';
import { useSelection } from '../lib/useSelection.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { BulkActionBar } from '../components/common/BulkActionBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Wrench, X, Upload } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { DatePicker } from '../components/common/DatePicker.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';

export const GuestHouseMaintenance = (props) => {
  const layoutContext = useLayout();
  const triggerExportModal = props.triggerExportModal || layoutContext.triggerExportModal;
  const triggerImportModal = props.triggerImportModal || layoutContext.triggerImportModal;
  const searchQuery = props.searchQuery || layoutContext.searchQuery;
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('gh_maintenance', 'view');
  const canAdd = hasModulePermission('gh_maintenance', 'add');
  const canEdit = hasModulePermission('gh_maintenance', 'edit');
  const canDelete = hasModulePermission('gh_maintenance', 'delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Form State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    reportedOn: '',
    issue: '',
    status: 'Open',
    updates: '',
    location: '',
    nameOfWorker: '',
    cost: 0
  });

  // Confirm Delete State
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async (q) => {
    setLoading(true);
    const searchTerm = q !== undefined ? q : (searchQuery || localSearch);
    const { data, error } = await fetchGHMaintenance(searchTerm);
    if (!error && Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load maintenance tickets.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(searchQuery || localSearch);
  }, [searchQuery, localSearch]);

  if (!canView) return <AccessDenied moduleName="Guest House Maintenance" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.issue || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query) ||
      (item.nameOfWorker && item.nameOfWorker.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesDateFrom = !dateFrom || item.reportedOn >= dateFrom;
    const matchesDateTo = !dateTo || item.reportedOn <= dateTo;
    const matchesMinCost = !minCost || Number(item.cost) >= Number(minCost);
    const matchesMaxCost = !maxCost || Number(item.cost) <= Number(maxCost);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesMinCost && matchesMaxCost;
  });

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [query, statusFilter, dateFrom, dateTo, minCost, maxCost]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const { selected, toggle, toggleAll, isAllSelected, clear: clearSelection, count: selectedCount } = useSelection(paginatedItems.map(i => i.id));
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const handleBulkDelete = async () => {
    const { error } = await bulkDeleteRecords('guest_house_maintenance', Array.from(selected), currentUser, 'Guest House Maintenance');
    if (!error) {
      setToast?.({ type: 'success', message: `${selectedCount} maintenance record(s) deleted.` });
      clearSelection();
      loadData();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleBulkStatus = async (status) => {
    const { error } = await bulkUpdateFields('guest_house_maintenance', Array.from(selected), { status }, currentUser, 'Guest House Maintenance');
    if (!error) {
      setToast?.({ type: 'success', message: `${selectedCount} record(s) updated to "${status}".` });
      clearSelection();
      loadData();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      reportedOn: new Date().toISOString().split('T')[0],
      issue: '',
      status: 'Open',
      updates: '',
      location: '',
      nameOfWorker: '',
      cost: ''
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
      const { error } = await updateGHMaintenance(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Maintenance record updated successfully.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { error } = await createGHMaintenance(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Reported new guest house maintenance issue.' });
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
      const { error } = await deleteGHMaintenance(deletingId, itemToDelete?.issue, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Maintenance record removed.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Reported On', key: 'reportedOn' },
    { label: 'Issue', key: 'issue' },
    { label: 'Status', key: 'status' },
    { label: 'Location', key: 'location' },
    { label: 'Assigned Worker', key: 'nameOfWorker' },
    { label: 'Cost (GHS)', key: 'cost' }
  ];

  const resetFilters = () => {
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setMinCost('');
    setMaxCost('');
    setLocalSearch('');
  };

  const hasActiveFilters = statusFilter !== 'All' || dateFrom || dateTo || minCost || maxCost || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Guest House Maintenance Tracker
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Report issues, assign technicians, track repair statuses, and monitor facility upkeep costs.
          </p>
        </div>

        <div className="page-header-actions">
          {canAdd && (
            <button
              className="btn btn-secondary"
              onClick={() => triggerImportModal?.('gh_maintenance')}
              title="Import records from Excel spreadsheet"
            >
              <Upload size={16} /> Import
            </button>
          )}
          <button
            className="btn btn-export"
            onClick={() => triggerExportModal?.('Guest House Maintenance', filteredItems, exportColumns, items)}
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Report Issue
            </button>
          )}
        </div>
      </div>

      {/* Responsive Filter Bar */}
      <ResponsiveFilterBar
        searchVal={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search issue or location..."
        activeFilterCount={(statusFilter !== 'All' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (minCost ? 1 : 0) + (maxCost ? 1 : 0)}
        onClearFilters={resetFilters}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Open', value: 'Open' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' }
            ]}
            style={{ width: '150px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>From:</span>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Date from"
            style={{ width: '140px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>To:</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            placeholder="Date to"
            style={{ width: '140px' }}
          />
        </div>

        {/* Cost Range Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Min GHS:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Min"
            value={minCost}
            onChange={e => setMinCost(e.target.value)}
            style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Max GHS:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Max"
            value={maxCost}
            onChange={e => setMaxCost(e.target.value)}
            style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          />
        </div>
      </ResponsiveFilterBar>

      {(canDelete || canEdit) && (
        <BulkActionBar
          count={selectedCount}
          onClear={clearSelection}
          onDelete={canDelete ? () => setConfirmBulkDeleteOpen(true) : undefined}
          statusOptions={canEdit ? [
            { label: 'Open', value: 'Open' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Resolved', value: 'Resolved' }
          ] : undefined}
          onApplyStatus={handleBulkStatus}
        />
      )}

      {/* Data Table */}
      {loading ? (
        <TableLoader rows={6} cols={7} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {(canDelete || canEdit) && (
                  <th style={{ width: '36px' }}>
                    <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                  </th>
                )}
                <th>Reported On</th>
                <th>Issue Description</th>
                <th>Status</th>
                <th>Location</th>
                <th>Assigned Worker</th>
                <th>Cost (GHS)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  {(canDelete || canEdit) && (
                    <td>
                      <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                    </td>
                  )}
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.reportedOn}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{item.issue}</span>
                    {item.updates && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Update: {item.updates}</span>
                    )}
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{item.location}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{item.nameOfWorker || 'Unassigned'}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      GHS {Number(item.cost).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-sm" title="View" onClick={() => handleOpenView(item)}>
                        <Eye size={16} color="var(--text-muted)" />
                      </button>
                      {canEdit && (
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleOpenEdit(item)}>
                          <Edit size={16} color="var(--color-primary)" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => setDeletingId(item.id)}>
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
          title="No Maintenance Issues Found"
          description="No maintenance records match your filter criteria."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Report New Issue"
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
        title={isViewOnly ? 'Maintenance Issue Details' : editingItem ? 'Edit Maintenance Issue' : 'Report Guest House Maintenance'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <DatePicker
            label="Reported On Date"
            value={formData.reportedOn}
            onChange={v => setFormData({ ...formData, reportedOn: v })}
            disabled={isViewOnly}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Issue Description
            </label>
            <textarea
              rows={3}
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="e.g. Air Conditioner leaking water in Room 204"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CustomSelect
              label="Status"
              value={formData.status}
              onChange={v => setFormData({ ...formData, status: v })}
              disabled={isViewOnly}
              options={[
                { label: 'Open', value: 'Open' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Resolved', value: 'Resolved' }
              ]}
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Repair Cost (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                disabled={isViewOnly}
                className="input-control"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Location
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Guest House Room 204"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Assigned Worker / Technician Name
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              className="input-control"
              value={formData.nameOfWorker || ''}
              onChange={(e) => setFormData({ ...formData, nameOfWorker: e.target.value })}
              placeholder="e.g. Kwame Mensah (HVAC Tech)"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Progress Updates / Technician Notes
            </label>
            <textarea
              rows={3}
              disabled={isViewOnly}
              className="input-control"
              value={formData.updates || ''}
              onChange={(e) => setFormData({ ...formData, updates: e.target.value })}
              placeholder="e.g. Replacement compressor ordered. Expected completion Friday."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary">
                Save Record
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
        title="Delete Maintenance Record"
        message="Are you sure you want to delete this maintenance record?"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Maintenance Records"
        message={`Are you sure you want to delete ${selectedCount} selected record(s)? This cannot be undone.`}
      />
    </div>
  );
};

