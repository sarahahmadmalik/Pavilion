import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchBillPayments,
  createBillPayment,
  updateBillPayment,
  deleteBillPayment
} from '../lib/supabaseService.js';
import { store, MODULE_STORAGE_MAP } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, CreditCard, X } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { DatePicker } from '../components/common/DatePicker.jsx';
import { TableLoader } from '../components/common/Loader.jsx';

export const OfficeBillPayments = ({ searchQuery, triggerExportModal, setToast }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('office_bills', 'view');
  const canAdd = hasModulePermission('office_bills', 'add');
  const canEdit = hasModulePermission('office_bills', 'edit');
  const canDelete = hasModulePermission('office_bills', 'delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Form State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    company: '',
    chequeNo: '',
    payee: '',
    amount: 0
  });

  // Confirm Delete State
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await fetchBillPayments();
    if (!error && data) {
      setItems(data);
    } else {
      setItems(store.getBillPayments());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!canView) return <AccessDenied moduleName="Office Bill Payments" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.company || '').toLowerCase().includes(query) ||
      (item.chequeNo || '').toLowerCase().includes(query) ||
      (item.payee || '').toLowerCase().includes(query);

    const matchesDateFrom = !dateFrom || item.date >= dateFrom;
    const matchesDateTo = !dateTo || item.date <= dateTo;
    const matchesMinAmount = !minAmount || Number(item.amount) >= Number(minAmount);
    const matchesMaxAmount = !maxAmount || Number(item.amount) <= Number(maxAmount);

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
  });

  // Reset to page 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [query, dateFrom, dateTo, minAmount, maxAmount]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      company: '',
      chequeNo: `CHK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      payee: '',
      amount: 0
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
      const { error } = await updateBillPayment(editingItem.id, formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Bill payment record updated.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { error } = await createBillPayment(formData, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: `Recorded payment to "${formData.company}".` });
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
      const { error } = await deleteBillPayment(deletingId, itemToDelete?.company, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'Bill payment record deleted.' });
        loadData();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Disbursement Date', key: 'date' },
    { label: 'Company / Utility', key: 'company' },
    { label: 'Cheque No.', key: 'chequeNo' },
    { label: 'Payee Name', key: 'payee' },
    { label: 'Amount (GHS)', key: 'amount' }
  ];

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setLocalSearch('');
  };

  const hasActiveFilters = dateFrom || dateTo || minAmount || maxAmount || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Office Bill Payments
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Record and audit utility bills, cheque disbursements, internet subscriptions, and vendor invoices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => triggerExportModal?.('Office Bill Payments', filteredItems, exportColumns)}
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar with Date Filters & Amount Filters */}
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
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search company, cheque no, or payee..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Date Range Filters */}
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

        {/* Amount Range Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Min GHS:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Min"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
            style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Max GHS:</span>
          <input
            type="number"
            className="input-control"
            placeholder="Max"
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
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
        <TableLoader rows={6} cols={6} />
      ) : paginatedItems.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Disbursement Date</th>
                <th>Company / Utility</th>
                <th>Cheque No.</th>
                <th>Payee Name</th>
                <th>Amount (GHS)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.date}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.company}</span>
                  </td>
                  <td>
                    <span className="badge badge-blue">{item.chequeNo}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{item.payee}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem' }}>
                      GHS {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
          title="No Bill Payments Found"
          description="No cheque or payment records found matching filters."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Record Bill Payment"
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
        title={isViewOnly ? 'Bill Payment Details' : editingItem ? 'Edit Bill Payment' : 'Record Office Bill Payment'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <DatePicker
            label="Payment Date"
            value={formData.date}
            onChange={v => setFormData({ ...formData, date: v })}
            disabled={isViewOnly}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Company / Utility Name
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Electricity Company of Ghana (ECG)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Cheque No.
              </label>
              <input
                type="text"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.chequeNo}
                onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                placeholder="e.g. CHK-2026-0891"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Amount (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                required
                disabled={isViewOnly}
                className="input-control"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Payee Name / Regional Office
            </label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              placeholder="e.g. ECG Regional Office Accra"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary">
                Save Payment Record
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
        title="Delete Bill Payment Record"
        message="Are you sure you want to delete this payment record?"
      />
    </div>
  );
};
