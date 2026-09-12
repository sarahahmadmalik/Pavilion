import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  upsertUserPermissions,
  notifyPermissionChange,
  resetUserPassword,
  bulkDeleteRecords,
  bulkUpdateFields
} from '../lib/supabaseService.js';
import { useSelection } from '../lib/useSelection.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { BulkActionBar } from '../components/common/BulkActionBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, Edit, Trash2, Key, Eye, EyeOff, X } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';

export const UserManagement = (props) => {
  const layoutContext = useLayout();
  const searchQuery = props.searchQuery || layoutContext.searchQuery;
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, refreshUsers } = useAuth();
  if (currentUser?.role !== 'super_admin') return <AccessDenied moduleName="User & Permission Management" />;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SlideOver Drawer State
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    permissions: {}
  });

  // Reset Password Modal State
  const [resetModalState, setResetModalState] = useState({ isOpen: false, user: null, newPassword: '' });
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const MODULE_KEYS = [
    { key: 'guest_list', label: 'Guest List' },
    { key: 'gh_maintenance', label: 'Guest House Maintenance' },
    { key: 'gh_inventory', label: 'Guest House Inventory' },
    { key: 'office_bills', label: 'Office Bill Payments' },
    { key: 'vehicles_maintenance', label: 'Vehicles Maintenance' },
    { key: 'office_maintenance', label: 'Office Maintenance' }
  ];

  // Staff default to FULL access on every module above — admins customize by
  // unchecking specific actions/modules per person, not by opting modules in.
  const FULL_ACCESS = { view: true, add: true, edit: true, delete: true };
  const defaultStaffPermissions = () =>
    MODULE_KEYS.reduce((acc, m) => ({ ...acc, [m.key]: { ...FULL_ACCESS } }), {});

  const loadData = async (q) => {
    setLoading(true);
    const searchTerm = q !== undefined ? q : (searchQuery || localSearch);
    const { data, error } = await fetchAllUsers(searchTerm);
    if (!error && Array.isArray(data)) {
      setUsers(data);
    } else {
      setUsers([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load user accounts.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(searchQuery || localSearch);
  }, [searchQuery, localSearch]);

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => { setCurrentPage(1); }, [query, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Exclude your own account from bulk selection — same rule as the single-row delete button
  const selectablePageIds = paginatedUsers.filter(u => u.id !== currentUser.id).map(u => u.id);
  const { selected, toggle, toggleAll, isAllSelected, clear: clearSelection, count: selectedCount } = useSelection(selectablePageIds);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const handleBulkDelete = async () => {
    const { error } = await bulkDeleteRecords('users', Array.from(selected), currentUser, 'User Management');
    if (!error) {
      setToast?.({ type: 'success', message: `${selectedCount} user account(s) deleted.` });
      clearSelection();
      loadData();
      refreshUsers?.();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleBulkStatus = async (status) => {
    const { error } = await bulkUpdateFields('users', Array.from(selected), { status }, currentUser, 'User Management');
    if (!error) {
      setToast?.({ type: 'success', message: `${selectedCount} account(s) updated to "${status}".` });
      clearSelection();
      loadData();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      status: 'Active',
      avatar: '',
      permissions: defaultStaffPermissions()
    });
    setIsSlideOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    // Merge over the full-access defaults so any module without a stored
    // override still shows (and behaves) as fully allowed.
    const merged = { ...defaultStaffPermissions(), ...(user.permissions || {}) };
    setFormData({ ...user, permissions: merged });
    setIsSlideOpen(true);
  };

  const handleRoleChange = (newRole) => {
    let updatedPermissions = { ...formData.permissions };
    if (newRole === 'super_admin' || newRole === 'admin') {
      updatedPermissions = defaultStaffPermissions();
    }
    setFormData({ ...formData, role: newRole, permissions: updatedPermissions });
  };

  const handlePermissionToggle = (moduleKey, actionKey) => {
    if (formData.role === 'super_admin' || formData.role === 'admin') return;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [actionKey]: !prev.permissions[moduleKey]?.[actionKey]
        }
      }
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (editingUser) {
      const accessChanged = editingUser.role !== formData.role ||
        JSON.stringify(editingUser.permissions || {}) !== JSON.stringify(formData.permissions || {});

      const { data: updated, error } = await updateUser(editingUser.id, formData, currentUser);
      if (!error) {
        // Persist per-module overrides for staff (admin/super_admin ignore these)
        if (formData.role === 'staff' && formData.permissions) {
          for (const mKey of Object.keys(formData.permissions)) {
            await upsertUserPermissions(editingUser.id, mKey, formData.permissions[mKey]);
          }
        }
        if (accessChanged) {
          await notifyPermissionChange(editingUser.id, currentUser, formData.role);
        }
        setToast?.({ type: 'success', message: `User "${formData.name}" updated successfully.` });
        loadData();
        refreshUsers?.();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    } else {
      const { data: created, error } = await createUser(formData, currentUser);
      if (!error && created) {
        if (formData.role === 'staff' && formData.permissions) {
          for (const mKey of Object.keys(formData.permissions)) {
            await upsertUserPermissions(created.id, mKey, formData.permissions[mKey]);
          }
        }
        setToast?.({ type: 'success', message: `New user "${formData.name}" created successfully.` });
        loadData();
        refreshUsers?.();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
    }
    setIsSlideOpen(false);
  };

  const handleDeleteUser = async () => {
    if (deletingId) {
      const target = users.find(u => u.id === deletingId);
      const { error } = await deleteUser(deletingId, target?.name, currentUser);
      if (!error) {
        setToast?.({ type: 'success', message: 'User account removed.' });
        loadData();
        refreshUsers?.();
      } else {
        setToast?.({ type: 'error', message: error.message });
      }
      setDeletingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalState.user || resetModalState.newPassword.length < 6) return;
    setResettingPassword(true);
    const { error } = await resetUserPassword(resetModalState.user.id, resetModalState.newPassword, currentUser);
    setResettingPassword(false);

    if (!error) {
      setToast?.({ type: 'success', message: `Password reset successfully for ${resetModalState.user.name}.` });
      setResetModalState({ isOpen: false, user: null, newPassword: '' });
      setShowResetPwd(false);
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await updateUser(user.id, { ...user, status: newStatus }, currentUser);
    if (!error) {
      setToast?.({ type: 'success', message: `User status changed to ${newStatus}.` });
      loadData();
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            User Accounts &amp; Permission Matrix
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Provision administrative accounts, assign roles, configure module access levels.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Create User Account
          </button>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search by name or email address..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Role Filter:</span>
          <CustomSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: 'All Roles', value: 'All' },
              { label: 'Super Admin', value: 'super_admin' },
              { label: 'Admin', value: 'admin' },
              { label: 'Staff', value: 'staff' }
            ]}
            style={{ width: '160px' }}
          />
        </div>

        {(roleFilter !== 'All' || localSearch) && (
          <button
            onClick={() => { setRoleFilter('All'); setLocalSearch(''); }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--status-red-text)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <BulkActionBar
        count={selectedCount}
        onClear={clearSelection}
        onDelete={() => setConfirmBulkDeleteOpen(true)}
        deleteLabel="Delete Selected"
        statusOptions={[
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' }
        ]}
        onApplyStatus={handleBulkStatus}
      />

      {/* Table Content */}
      {loading ? (
        <TableLoader rows={6} cols={6} />
      ) : paginatedUsers.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input type="checkbox" checked={isAllSelected} onChange={toggleAll} disabled={selectablePageIds.length === 0} />
                </th>
                <th>User Identity</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.id !== currentUser.id && (
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggle(user.id)} />
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <UserAvatar name={user.name} src={user.avatar} size={36} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', display: 'block' }}>
                          {user.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={user.role} /></td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Click to toggle status"
                    >
                      <StatusBadge status={user.status} />
                    </button>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Active session'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Edit Role & Permissions"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <Edit size={16} color="var(--color-primary)" />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Reset User Password"
                        onClick={() => setResetModalState({ isOpen: true, user, newPassword: '' })}
                      >
                        <Key size={16} color="var(--text-muted)" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete Account"
                          onClick={() => setDeletingId(user.id)}
                        >
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
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No user accounts found matching query.</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={itemsPerPage}
      />

      {/* SlideOver Form Drawer */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
        width="560px"
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              className="input-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tariq Malik"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Email Address (Login Username)
            </label>
            <input
              type="email"
              required
              className="input-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. admin@mtaghana.org"
            />
          </div>

          {!editingUser && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Initial Password
              </label>
              <input
                type="password"
                required
                className="input-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CustomSelect
              label="Assigned Role"
              value={formData.role}
              onChange={handleRoleChange}
              options={[
                { label: 'Staff (Custom Granular Perms)', value: 'staff' },
                { label: 'Admin (All Modules Access)', value: 'admin' },
                { label: 'Super Admin (Full Portal Control)', value: 'super_admin' }
              ]}
            />
            <CustomSelect
              label="Account Status"
              value={formData.status}
              onChange={v => setFormData({ ...formData, status: v })}
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]}
            />
          </div>

          {/* Module Access — staff get full access by default; override per-module below */}
          <div style={{
            marginTop: '0.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                  Module Access
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.role === 'staff'
                    ? 'Staff have full access to every module below by default. Uncheck specific actions to restrict this person.'
                    : `Full access to every module${formData.role === 'admin' ? ' except User Management' : ', including User Management'} — not customizable per person.`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MODULE_KEYS.map(m => {
                const perms = formData.permissions?.[m.key] || FULL_ACCESS;
                const isLocked = formData.role === 'super_admin' || formData.role === 'admin';

                return (
                  <div key={m.key} style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.375rem' }}>
                      {m.label}
                    </span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['view', 'add', 'edit', 'delete'].map(action => (
                        <label key={action} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', cursor: isLocked ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}>
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={!!perms[action]}
                            onChange={() => handlePermissionToggle(m.key, action)}
                          />
                          {action.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save User Account
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalState.isOpen}
        onClose={() => { setResetModalState({ isOpen: false, user: null, newPassword: '' }); setShowResetPwd(false); }}
        title="Reset User Password"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Enter a new password for account <strong>{resetModalState.user?.email}</strong>:
          </p>
          <div style={{ position: 'relative' }}>
            <input
              type={showResetPwd ? 'text' : 'password'}
              className="input-control"
              placeholder="New secure password (min. 6 characters)"
              style={{ paddingRight: '2.5rem' }}
              value={resetModalState.newPassword}
              onChange={(e) => setResetModalState({ ...resetModalState, newPassword: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowResetPwd(!showResetPwd)}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', padding: 0
              }}
              title={showResetPwd ? 'Hide password' : 'Show password'}
            >
              {showResetPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {resetModalState.newPassword && resetModalState.newPassword.length < 6 && (
            <span className="input-error-msg">Password must be at least 6 characters.</span>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={resettingPassword}
              onClick={() => { setResetModalState({ isOpen: false, user: null, newPassword: '' }); setShowResetPwd(false); }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={resettingPassword || resetModalState.newPassword.length < 6}
              onClick={handleResetPassword}
            >
              {resettingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to delete this user account permanently?"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete User Accounts"
        message={`Are you sure you want to permanently delete ${selectedCount} selected user account(s)?`}
      />
    </div>
  );
};
