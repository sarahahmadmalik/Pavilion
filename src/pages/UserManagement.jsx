import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore, addItem, updateItem, deleteItem, MODULE_STORAGE_MAP, logActivity } from '../lib/store.js';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Plus, Search, Edit, Trash2, Key, Ban, Shield, Lock, Settings } from 'lucide-react';

export const UserManagement = ({ searchQuery, setToast }) => {
  const { currentUser } = useAuth();
  if (currentUser?.role !== 'super_admin') return <AccessDenied moduleName="User & Permission Management" />;

  const [users, setUsers] = useState(store.getUsers());
  const [localSearch, setLocalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

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
    permissions: {
      guest_list: { view: true, add: true, edit: false, delete: false },
      gh_maintenance: { view: false, add: false, edit: false, delete: false },
      gh_inventory: { view: true, add: true, edit: true, delete: false },
      office_bills: { view: false, add: false, edit: false, delete: false },
      office_assets: { view: false, add: false, edit: false, delete: false },
      office_maintenance: { view: false, add: false, edit: false, delete: false }
    }
  });

  // Reset Password Modal State
  const [resetModalState, setResetModalState] = useState({ isOpen: false, user: null, newPassword: '' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setUsers(store.getUsers());
    });
    return unsubscribe;
  }, []);

  const MODULE_KEYS = [
    { key: 'guest_list', label: 'Guest List' },
    { key: 'gh_maintenance', label: 'Guest House Maintenance' },
    { key: 'gh_inventory', label: 'Guest House Inventory' },
    { key: 'office_bills', label: 'Office Bill Payments' },
    { key: 'office_assets', label: 'Office Asset List' },
    { key: 'office_maintenance', label: 'Office Maintenance' }
  ];

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'staff',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      permissions: {
        guest_list: { view: true, add: true, edit: false, delete: false },
        gh_maintenance: { view: false, add: false, edit: false, delete: false },
        gh_inventory: { view: true, add: true, edit: true, delete: false },
        office_bills: { view: false, add: false, edit: false, delete: false },
        office_assets: { view: false, add: false, edit: false, delete: false },
        office_maintenance: { view: false, add: false, edit: false, delete: false }
      }
    });
    setIsSlideOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ ...user });
    setIsSlideOpen(true);
  };

  const handleRoleChange = (newRole) => {
    let updatedPermissions = { ...formData.permissions };

    // If role is super_admin or admin, auto-fill matrix to true & lock
    if (newRole === 'super_admin' || newRole === 'admin') {
      MODULE_KEYS.forEach(m => {
        updatedPermissions[m.key] = { view: true, add: true, edit: true, delete: true };
      });
    }

    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: updatedPermissions
    }));
  };

  const handlePermissionToggle = (moduleKey, action) => {
    if (formData.role === 'super_admin' || formData.role === 'admin') return;

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [action]: !prev.permissions[moduleKey]?.[action]
        }
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateItem(MODULE_STORAGE_MAP.users, 'User Management', editingUser.id, formData, currentUser, u => u.name);
      setToast({ type: 'success', message: `User "${formData.name}" permissions updated.` });
    } else {
      addItem(MODULE_STORAGE_MAP.users, 'User Management', formData, currentUser, u => u.name);
      setToast({ type: 'success', message: `Created new user "${formData.name}".` });
    }
    setIsSlideOpen(false);
  };

  const handleToggleDeactivate = (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    updateItem(MODULE_STORAGE_MAP.users, 'User Management', user.id, { status: newStatus }, currentUser, u => u.name);
    setToast({ type: 'success', message: `User "${user.name}" status changed to ${newStatus}.` });
  };

  const handleOpenResetPassword = (user) => {
    const generated = `MTA@${Math.floor(100000 + Math.random() * 900000)}`;
    setResetModalState({ isOpen: true, user, newPassword: generated });
  };

  const handleConfirmPasswordReset = () => {
    if (resetModalState.user) {
      updateItem(MODULE_STORAGE_MAP.users, 'User Management', resetModalState.user.id, { lastPasswordReset: new Date().toISOString() }, currentUser, u => u.name);
      logActivity(currentUser, 'Edited', 'User Management', `Reset password for ${resetModalState.user.name}`);
      setToast({ type: 'success', message: `New password assigned to ${resetModalState.user.name}.` });
      setResetModalState({ isOpen: false, user: null, newPassword: '' });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteItem(MODULE_STORAGE_MAP.users, 'User Management', deletingId, currentUser, u => u.name);
      setToast({ type: 'success', message: 'User account deleted.' });
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            User & Role Permission Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Exclusive Super Admin panel to provision users, assign roles, configure per-module access matrix, and reset passwords.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> + Provision New User
        </button>
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
            placeholder="Search by name or email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Role Filter:</span>
          <select
            className="input-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '160px', padding: '0.375rem 0.75rem' }}
          >
            <option value="All">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name & Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Assigned Modules Matrix</th>
              <th>Last Login</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={u.avatar} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{u.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.role === 'super_admin' ? 'badge-green' : u.role === 'admin' ? 'badge-blue' : 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td><StatusBadge status={u.status} /></td>
                <td>
                  {u.role === 'super_admin' || u.role === 'admin' ? (
                    <span className="badge badge-green">Full 6 Modules Access</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '260px' }}>
                      {MODULE_KEYS.map(m => {
                        const hasAcc = u.permissions?.[m.key]?.view;
                        if (!hasAcc) return null;
                        return (
                          <span key={m.key} className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>
                            {m.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{u.lastLogin || 'Never'}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                    <button className="btn btn-ghost btn-sm" title="Edit Permissions & Matrix" onClick={() => handleOpenEdit(u)}>
                      <Edit size={16} color="var(--color-primary)" />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Reset User Password" onClick={() => handleOpenResetPassword(u)}>
                      <Key size={16} color="#B45309" />
                    </button>
                    <button className="btn btn-ghost btn-sm" title={u.status === 'Active' ? 'Deactivate Account' : 'Activate Account'} onClick={() => handleToggleDeactivate(u)}>
                      <Ban size={16} color={u.status === 'Active' ? '#DC2626' : '#10B981'} />
                    </button>
                    {u.role !== 'super_admin' && (
                      <button className="btn btn-ghost btn-sm" title="Delete User" onClick={() => setDeletingId(u.id)}>
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

      {/* Add / Edit User SlideOver Panel */}
      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Provision New User & Permission Matrix'}
        width="600px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              placeholder="e.g. Dr. Ibrahim Mensah"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                className="input-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@mtaghana.org"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                User Role
              </label>
              <select
                className="input-control"
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin (All Modules)</option>
                <option value="staff">Staff (Custom Matrix)</option>
              </select>
            </div>
          </div>

          {/* Module Access Permission Matrix */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Shield size={16} color="var(--color-primary)" /> Module Access Permission Matrix
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.role === 'super_admin' || formData.role === 'admin' 
                    ? 'Role implies full View/Add/Edit/Delete access across all modules (Locked).'
                    : 'Configure granular View, Add, Edit, Delete rights per module for this Staff user.'}
                </p>
              </div>
            </div>

            <div className="table-container" style={{ backgroundColor: 'var(--bg-card)' }}>
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Module Name</th>
                    <th style={{ textAlign: 'center' }}>View</th>
                    <th style={{ textAlign: 'center' }}>Add</th>
                    <th style={{ textAlign: 'center' }}>Edit</th>
                    <th style={{ textAlign: 'center' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULE_KEYS.map((m) => {
                    const isLocked = formData.role === 'super_admin' || formData.role === 'admin';
                    const modPerms = formData.permissions?.[m.key] || { view: false, add: false, edit: false, delete: false };

                    return (
                      <tr key={m.key}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.label}</td>
                        {['view', 'add', 'edit', 'delete'].map((action) => (
                          <td key={action} style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={!!modPerms[action]}
                              onChange={() => handlePermissionToggle(m.key, action)}
                              style={{ width: '16px', height: '16px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save User & Permissions
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalState.isOpen}
        onClose={() => setResetModalState({ isOpen: false, user: null, newPassword: '' })}
        title="Admin Reset Password Generator"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Generating a new secure password on behalf of <strong>{resetModalState.user?.name}</strong>.
          </p>

          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            border: '2px dashed var(--border-focus)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Generated Password
            </span>
            <h3 style={{ fontFamily: 'Consolas, monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
              {resetModalState.newPassword}
            </h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setResetModalState({ isOpen: false, user: null, newPassword: '' })}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmPasswordReset}>
              Confirm Password Reset
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message="Are you sure you want to permanently remove this user account from the system?"
      />
    </div>
  );
};
