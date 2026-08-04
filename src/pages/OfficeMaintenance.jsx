import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore, addItem, updateItem, deleteItem, MODULE_STORAGE_MAP } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Wrench } from 'lucide-react';

export const OfficeMaintenance = ({ searchQuery, triggerExportModal, setToast }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('office_maintenance', 'view');
  const canAdd = hasModulePermission('office_maintenance', 'add');
  const canEdit = hasModulePermission('office_maintenance', 'edit');
  const canDelete = hasModulePermission('office_maintenance', 'delete');

  const [items, setItems] = useState(store.getOfficeMaintenance());
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setItems(store.getOfficeMaintenance());
    });
    return unsubscribe;
  }, []);

  if (!canView) return <AccessDenied moduleName="Office Maintenance" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = item.issue.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      (item.nameOfWorker && item.nameOfWorker.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      location: 'Administration Compound',
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

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItem(MODULE_STORAGE_MAP.office_maintenance, 'Office Maintenance', editingItem.id, formData, currentUser, item => item.issue);
      setToast({ type: 'success', message: 'Office maintenance record updated.' });
    } else {
      addItem(MODULE_STORAGE_MAP.office_maintenance, 'Office Maintenance', formData, currentUser, item => item.issue);
      setToast({ type: 'success', message: 'Logged office maintenance request.' });
    }
    setIsSlideOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteItem(MODULE_STORAGE_MAP.office_maintenance, 'Office Maintenance', deletingId, currentUser, item => item.issue);
      setToast({ type: 'success', message: 'Office maintenance record deleted.' });
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Reported On', key: 'reportedOn' },
    { label: 'Issue', key: 'issue' },
    { label: 'Status', key: 'status' },
    { label: 'Updates', key: 'updates' },
    { label: 'Location', key: 'location' },
    { label: 'Worker Name', key: 'nameOfWorker' },
    { label: 'Cost (GHS)', key: 'cost' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Office Maintenance
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage standby generator servicing, conference audio visual systems, and facility upkeep.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => triggerExportModal('Office Maintenance', filteredItems, exportColumns)} style={{ color: '#10B981', borderColor: '#10B981' }}>
            <FileSpreadsheet size={16} /> Export to Google Sheets
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> + Report Office Issue
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ position: 'relative', width: '280px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          <select
            className="input-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px', padding: '0.375rem 0.75rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {paginatedItems.length > 0 ? (
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

      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={isViewOnly ? 'Office Maintenance Details' : editingItem ? 'Edit Maintenance Record' : 'Report Office Maintenance'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Reported On Date
            </label>
            <input
              type="date"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.reportedOn}
              onChange={(e) => setFormData({ ...formData, reportedOn: e.target.value })}
            />
          </div>

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
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Status
              </label>
              <select
                disabled={isViewOnly}
                className="input-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
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
              placeholder="e.g. Main Compound Generator Station"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Worker / Engineering Firm
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              className="input-control"
              value={formData.nameOfWorker}
              onChange={(e) => setFormData({ ...formData, nameOfWorker: e.target.value })}
              placeholder="e.g. Mantrac Ghana Engineers"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Updates
            </label>
            <textarea
              rows={3}
              disabled={isViewOnly}
              className="input-control"
              value={formData.updates}
              onChange={(e) => setFormData({ ...formData, updates: e.target.value })}
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

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Office Maintenance Issue"
        message="Are you sure you want to delete this office maintenance record?"
      />
    </div>
  );
};
