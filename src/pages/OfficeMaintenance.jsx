import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchOfficeMaintenance,
  createOfficeMaintenance,
  updateOfficeMaintenance,
  deleteOfficeMaintenance
} from '../lib/supabaseService.js';
import { store, MODULE_STORAGE_MAP } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Wrench, X } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { DatePicker } from '../components/common/DatePicker.jsx';
import { TableLoader } from '../components/common/Loader.jsx';

export const OfficeMaintenance = ({ searchQuery, triggerExportModal, setToast }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('office_maintenance', 'view');
  const canAdd = hasModulePermission('office_maintenance', 'add');
  const canEdit = hasModulePermission('office_maintenance', 'edit');
  const canDelete = hasModulePermission('office_maintenance', 'delete');

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

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await fetchOfficeMaintenance();
    if (!error && data) {
      setItems(data);
    } else {
      setItems(store.getOfficeMaintenance());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!canView) return <AccessDenied moduleName="Office Maintenance" />;

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

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      reportedOn: new Date().toISOString().split('T')[0],
      issue: '',
      status: 'Open',
      updates: '',
      location: 'Central Headquarters',
      nameOfWorker: '',
      cost: 0
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
      const { error } = await updateOfficeMaintenance(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Office maintenance record updated.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { error } = await createOfficeMaintenance(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Reported new office maintenance issue.' });
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
      const { error } = await deleteOfficeMaintenance(deletingId, itemToDelete?.issue, currentUser);
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
    { label: 'Issue Description', key: 'issue' },
    { label: 'Status', key: 'status' },
    { label: 'Location', key: 'location' },
    { label: 'Worker / Engineer', key: 'nameOfWorker' },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Office Facilities & Generator Maintenance
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track office electrical, plumbing, generator servicing, and building infrastructure repairs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => triggerExportModal?.('Office Maintenance', filteredItems, exportColumns)}
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

      {/* Comprehensive Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search issue or location..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Status */}
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

        {/* Date Filters */}
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

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--status-red-text)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <TableLoader rows={6} cols={7} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reported On</th>
                <th>Issue Description</th>
                <th>Status</th>
                <th>Location</th>
                <th>Worker / Engineer</th>
                <th>Cost (GHS)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.reportedOn}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{item.issue}</span>
                    {item.updates && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.updates}</span>}
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
          title="No Office Maintenance Records"
          description="No office maintenance issues found matching your criteria."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Report Office Issue"
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
        title={isViewOnly ? 'Office Maintenance Details' : editingItem ? 'Edit Maintenance Record' : 'Report Office Maintenance'}
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
              placeholder="e.g. Perkins 150kVA Standby Generator monthly service"
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
                Cost (GHS)
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
              Facility Location
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Generator House / Server Room"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Engineer / Contractor Name
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              className="input-control"
              value={formData.nameOfWorker || ''}
              onChange={(e) => setFormData({ ...formData, nameOfWorker: e.target.value })}
              placeholder="e.g. Mantrac Ghana Services"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Service Updates / Notes
            </label>
            <textarea
              rows={3}
              disabled={isViewOnly}
              className="input-control"
              value={formData.updates || ''}
              onChange={(e) => setFormData({ ...formData, updates: e.target.value })}
              placeholder="e.g. Oil filter and fuel filters replaced."
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
        title="Delete Office Maintenance Record"
        message="Are you sure you want to delete this record?"
      />
    </div>
  );
};
