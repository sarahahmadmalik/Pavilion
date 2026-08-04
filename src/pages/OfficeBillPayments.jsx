import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore, addItem, updateItem, deleteItem, MODULE_STORAGE_MAP } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, FileSpreadsheet, Edit, Trash2, Eye, CreditCard } from 'lucide-react';

export const OfficeBillPayments = ({ searchQuery, triggerExportModal, setToast }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const canView = hasModulePermission('office_bills', 'view');
  const canAdd = hasModulePermission('office_bills', 'add');
  const canEdit = hasModulePermission('office_bills', 'edit');
  const canDelete = hasModulePermission('office_bills', 'delete');

  const [items, setItems] = useState(store.getOfficeBills());
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setItems(store.getOfficeBills());
    });
    return unsubscribe;
  }, []);

  if (!canView) return <AccessDenied moduleName="Office Bill Payments" />;

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredItems = items.filter(item => 
    item.company.toLowerCase().includes(query) ||
    item.chequeNo.toLowerCase().includes(query) ||
    item.payee.toLowerCase().includes(query)
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      company: '',
      chequeNo: `CHK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItem(MODULE_STORAGE_MAP.office_bills, 'Office Bill Payments', editingItem.id, formData, currentUser, item => item.company);
      setToast({ type: 'success', message: `Updated bill payment for ${formData.company}.` });
    } else {
      addItem(MODULE_STORAGE_MAP.office_bills, 'Office Bill Payments', formData, currentUser, item => item.company);
      setToast({ type: 'success', message: `Recorded new cheque disbursement to ${formData.company}.` });
    }
    setIsSlideOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteItem(MODULE_STORAGE_MAP.office_bills, 'Office Bill Payments', deletingId, currentUser, item => item.company);
      setToast({ type: 'success', message: 'Bill payment record deleted.' });
      setDeletingId(null);
    }
  };

  const exportColumns = [
    { label: 'Date', key: 'date' },
    { label: 'Company / Utility', key: 'company' },
    { label: 'Cheque No.', key: 'chequeNo' },
    { label: 'Payee', key: 'payee' },
    { label: 'Amount (GHS)', key: 'amount' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Office Bill Payments
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Record and audit utility bills, cheque disbursements, internet subscriptions, and vendor invoices.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => triggerExportModal('Office Bill Payments', filteredItems, exportColumns)} style={{ color: '#10B981', borderColor: '#10B981' }}>
            <FileSpreadsheet size={16} /> Export to Google Sheets
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> + Record Bill Payment
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
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search by company, cheque no. or payee..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {paginatedItems.length > 0 ? (
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
          description="No cheque or payment records found."
          canAdd={canAdd}
          onAdd={handleOpenAdd}
          addText="Record Bill Payment"
        />
      )}

      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={isViewOnly ? 'Bill Payment Details' : editingItem ? 'Edit Bill Payment' : 'Record Office Bill Payment'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Payment Date
            </label>
            <input
              type="date"
              required
              disabled={isViewOnly}
              className="input-control"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

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
              Payee Name
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
                Save Disbursement
              </button>
            )}
          </div>
        </form>
      </SlideOver>

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
