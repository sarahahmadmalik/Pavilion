import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore, addItem, updateItem, deleteItem, MODULE_STORAGE_MAP } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Calendar, UserCheck } from 'lucide-react';

export const GuestList = ({ searchQuery, triggerExportModal, setToast }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('guest_list', 'view');
  const canAdd = hasModulePermission('guest_list', 'add');
  const canEdit = hasModulePermission('guest_list', 'edit');
  const canDelete = hasModulePermission('guest_list', 'delete');

  const [items, setItems] = useState(store.getGuests());
  const [localSearch, setLocalSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Form State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    checkIn: '',
    checkOut: '',
    country: 'Ghana',
    roomAllocated: '',
    purposeOfStay: ''
  });

  // Confirm Delete State
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setItems(store.getGuests());
    });
    return unsubscribe;
  }, []);

  if (!canView) return <AccessDenied moduleName="Guest List" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query) ||
      item.country.toLowerCase().includes(query) ||
      item.roomAllocated.toLowerCase().includes(query) ||
      (item.purposeOfStay && item.purposeOfStay.toLowerCase().includes(query));

    const matchesCountry = countryFilter === 'All' || item.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      name: '',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      country: 'Ghana',
      roomAllocated: 'Room 101',
      purposeOfStay: ''
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
      updateItem(MODULE_STORAGE_MAP.guest_list, 'Guest List', editingItem.id, formData, currentUser, item => item.name);
      setToast({ type: 'success', message: `Updated guest "${formData.name}" successfully.` });
    } else {
      addItem(MODULE_STORAGE_MAP.guest_list, 'Guest List', formData, currentUser, item => item.name);
      setToast({ type: 'success', message: `Added new guest "${formData.name}" successfully.` });
    }
    setIsSlideOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteItem(MODULE_STORAGE_MAP.guest_list, 'Guest List', deletingId, currentUser, item => item.name);
      setToast({ type: 'success', message: 'Guest record removed successfully.' });
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Name', key: 'name' },
    { label: 'Check In', key: 'checkIn' },
    { label: 'Check Out', key: 'checkOut' },
    { label: 'Country', key: 'country' },
    { label: 'Room Allocated', key: 'roomAllocated' },
    { label: 'Purpose of Stay', key: 'purposeOfStay' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Guest List Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track guest house check-ins, room allocations, stay durations, and delegation purposes.
          </p>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => triggerExportModal('Guest List', filteredItems, exportColumns)}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            <FileSpreadsheet size={16} /> Export to Google Sheets
          </button>

          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> + Add New Guest
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search by guest name or room..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Country Filter:</span>
          <select
            className="input-control"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            style={{ width: '160px', padding: '0.375rem 0.75rem' }}
          >
            <option value="All">All Countries</option>
            <option value="Ghana">Ghana</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Canada">Canada</option>
          </select>
        </div>
      </div>

      {/* Table Data Container */}
      {paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Country</th>
                <th>Room Allocated</th>
                <th>Purpose of Stay</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {item.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      <Calendar size={14} color="var(--text-muted)" /> {item.checkIn}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      <Calendar size={14} color="var(--text-muted)" /> {item.checkOut}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue">{item.country}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{item.roomAllocated}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.purposeOfStay}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => handleOpenView(item)}>
                        <Eye size={16} color="var(--text-muted)" />
                      </button>
                      {canEdit && (
                        <button className="btn btn-ghost btn-sm" title="Edit Guest" onClick={() => handleOpenEdit(item)}>
                          <Edit size={16} color="var(--color-primary)" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-ghost btn-sm" title="Delete Guest" onClick={() => setDeletingId(item.id)}>
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
          title="No Guests Found"
          description="No guest records match your search or filter parameters."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Add New Guest"
        />
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing page {currentPage} of {totalPages} ({filteredItems.length} total records)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              Previous
            </button>
            <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* SlideOver Form Drawer */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={isViewOnly ? 'Guest Record Details' : editingItem ? 'Edit Guest Information' : 'Add New Guest'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Maulana Abdul Rashid"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Check In Date
              </label>
              <input
                type="date"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Check Out Date
              </label>
              <input
                type="date"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Country of Origin
              </label>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. United Kingdom"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Room Allocated
              </label>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.roomAllocated}
                onChange={(e) => setFormData({ ...formData, roomAllocated: e.target.value })}
                placeholder="e.g. VIP Suite 101"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Purpose of Stay
            </label>
            <textarea
              rows={4}
              disabled={isViewOnly}
              className="input-control"
              value={formData.purposeOfStay}
              onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
              placeholder="e.g. Annual Conference & Delegation Inspection"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary">
                Save Guest Record
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
        title="Delete Guest Record"
        message="Are you sure you want to delete this guest record from the system database?"
      />
    </div>
  );
};
