import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGuests,
  createGuest,
  updateGuest,
  deleteGuest
} from '../lib/supabaseService.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, Calendar, UserCheck, Filter, X, Upload } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { SearchableSelect } from '../components/common/SearchableSelect.jsx';
import { DatePicker } from '../components/common/DatePicker.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';
import { ALL_COUNTRIES } from '../lib/countries.js';

export const GuestList = (props) => {
  const layoutContext = useLayout();
  const triggerExportModal = props.triggerExportModal || layoutContext.triggerExportModal;
  const triggerImportModal = props.triggerImportModal || layoutContext.triggerImportModal;
  const searchQuery = props.searchQuery || layoutContext.searchQuery;
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('guest_list', 'view');
  const canAdd = hasModulePermission('guest_list', 'add');
  const canEdit = hasModulePermission('guest_list', 'edit');
  const canDelete = hasModulePermission('guest_list', 'delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
  const [deletingName, setDeletingName] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await fetchGuests();
    if (!error && Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load guest records.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!canView) return <AccessDenied moduleName="Guest List" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(query) ||
      (item.country || '').toLowerCase().includes(query) ||
      (item.roomAllocated || '').toLowerCase().includes(query) ||
      (item.purposeOfStay && item.purposeOfStay.toLowerCase().includes(query));

    const matchesCountry = countryFilter === 'All' || item.country === countryFilter;
    const matchesDateFrom = !dateFrom || item.checkIn >= dateFrom;
    const matchesDateTo = !dateTo || item.checkIn <= dateTo;

    return matchesSearch && matchesCountry && matchesDateFrom && matchesDateTo;
  });

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [query, countryFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setTouched({});
    setSubmitted(false);
    setFormData({
      name: '',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: '',
      country: '',
      roomAllocated: '',
      purposeOfStay: ''
    });
    setIsSlideOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsViewOnly(false);
    setTouched({});
    setSubmitted(false);
    setFormData({ ...item });
    setIsSlideOpen(true);
  };

  const handleOpenView = (item) => {
    setEditingItem(item);
    setIsViewOnly(true);
    setTouched({});
    setSubmitted(false);
    setFormData({ ...item });
    setIsSlideOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.name.trim() || !formData.country || !formData.roomAllocated.trim()) {
      setToast?.({ type: 'error', message: 'Please fill in all required fields marked in red.' });
      return;
    }

    if (editingItem) {
      const { data, error } = await updateGuest(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Updated guest "${formData.name}" successfully.` });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message || 'Failed to update guest record.' });
      }
    } else {
      const { data, error } = await createGuest(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Added new guest "${formData.name}" successfully.` });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message || 'Failed to add guest record.' });
      }
    }
    setIsSlideOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      const { error } = await deleteGuest(deletingId, deletingName, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Guest record removed successfully.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message || 'Failed to delete record.' });
      }
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

  const countryOptions = [
    { label: 'All Countries', value: 'All' },
    ...ALL_COUNTRIES.map(c => ({ label: c, value: c }))
  ];

  const resetFilters = () => {
    setCountryFilter('All');
    setDateFrom('');
    setDateTo('');
    setLocalSearch('');
  };

  const hasActiveFilters = countryFilter !== 'All' || dateFrom || dateTo || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Module Header */}
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Guest List Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track guest house check-ins, room allocations, stay durations, and delegation purposes.
          </p>
        </div>

        <div className="page-header-actions">
          {canAdd && (
            <button
              className="btn btn-secondary"
              onClick={() => triggerImportModal?.('guest_list')}
              title="Import records from Excel spreadsheet"
            >
              <Upload size={16} /> Import
            </button>
          )}
          <button
            className="btn btn-export"
            onClick={() => triggerExportModal?.('Guest List', filteredItems, exportColumns)}
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add Guest
            </button>
          )}
        </div>
      </div>

      {/* Responsive Filter Bar */}
      <ResponsiveFilterBar
        searchVal={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search by name, room, purpose..."
        activeFilterCount={(countryFilter !== 'All' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
        onClearFilters={resetFilters}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Country:</span>
          <SearchableSelect
            value={countryFilter}
            onChange={setCountryFilter}
            options={countryOptions}
            placeholder="Filter Country"
            searchPlaceholder="Search country..."
            style={{ width: '180px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>From:</span>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Check-in from"
            style={{ width: '150px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>To:</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            placeholder="Check-in to"
            style={{ width: '150px' }}
          />
        </div>
      </ResponsiveFilterBar>

      {/* Table Content */}
      {loading ? (
        <TableLoader rows={6} cols={6} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Country</th>
                <th>Room Allocated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.875rem'
                      }}>
                        {item.name ? item.name.charAt(0) : 'G'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {item.checkIn}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {item.checkOut}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue">{item.country}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.roomAllocated}</span>
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
                        <button className="btn btn-ghost btn-sm" title="Delete Guest" onClick={() => { setDeletingId(item.id); setDeletingName(item.name); }}>
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
          description="No guest records match your search or filter criteria."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Add New Guest"
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
        title={isViewOnly ? 'Guest Record Details' : editingItem ? 'Edit Guest Record' : 'Add New Guest Record'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className={`input-control ${(touched.name || submitted) && !formData.name.trim() ? 'input-invalid' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Bilal Chaudhry"
            />
            {(touched.name || submitted) && !formData.name.trim() && (
              <span className="input-error-msg">Full Name is required.</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <DatePicker
              label="Check In Date *"
              value={formData.checkIn}
              onChange={v => setFormData({ ...formData, checkIn: v })}
              disabled={isViewOnly}
            />
            <DatePicker
              label="Check Out Date"
              value={formData.checkOut}
              onChange={v => setFormData({ ...formData, checkOut: v })}
              disabled={isViewOnly}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <SearchableSelect
                label="Country of Origin *"
                value={formData.country}
                onChange={v => setFormData({ ...formData, country: v })}
                options={ALL_COUNTRIES.map(c => ({ label: c, value: c }))}
                disabled={isViewOnly}
                placeholder="Select Country"
                searchPlaceholder="Search country..."
              />
              {(touched.country || submitted) && !formData.country && (
                <span className="input-error-msg">Country is required.</span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Room Allocated *
              </label>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className={`input-control ${(touched.roomAllocated || submitted) && !formData.roomAllocated.trim() ? 'input-invalid' : ''}`}
                value={formData.roomAllocated}
                onChange={(e) => setFormData({ ...formData, roomAllocated: e.target.value })}
                onBlur={() => handleBlur('roomAllocated')}
                placeholder="e.g. VIP Suite 101"
              />
              {(touched.roomAllocated || submitted) && !formData.roomAllocated.trim() && (
                <span className="input-error-msg">Room Allocated is required.</span>
              )}
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
              placeholder="e.g. Annual Conference & Delegation Inspection Tour"
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
        message={`Are you sure you want to delete the guest record for "${deletingName}"?`}
      />
    </div>
  );
};

