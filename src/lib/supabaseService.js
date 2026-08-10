/**
 * supabaseService.js
 * ==================
 * All Supabase database operations for MTA Ghana.
 * Each function returns { data, error }.
 * Column mapping: camelCase JS ↔ snake_case Postgres.
 */

import { supabase } from './supabase.js';
import { sanitizeInput, sanitizeFormData } from './securityUtils.js';

// ─── Helper: log an activity ─────────────────────────────────────────────────
async function logActivity(currentUser, action, moduleName, recordAffected, details = null) {
  if (!currentUser) return;
  // Do not create activity logs for Super Admin actions
  if (currentUser.role === 'super_admin') return;

  await supabase.from('activity_logs').insert({
    user_id: currentUser.id,
    user_name: sanitizeInput(currentUser.name),
    user_avatar: currentUser.avatar || null,
    action: sanitizeInput(action),
    module_name: sanitizeInput(moduleName),
    record_affected: sanitizeInput(recordAffected),
    details: sanitizeFormData(details)
  });
}

// ─── Helper: Normalize Database Errors ────────────────────────────────────────
function normalizeError(err) {
  if (!err) return null;
  let msg = err.message || err.error_description;
  if (typeof msg === 'object') msg = 'Database error occurred.';
  if (msg === '{}' || msg === '[object Object]' || !msg) msg = 'Database error occurred.';
  
  // Custom user-friendly DB constraints
  if (err.code === '23505') msg = 'A record with this information already exists (Duplicate).';
  if (err.code === '23503') msg = 'This record is referenced by other data and cannot be modified/deleted.';
  
  return { ...err, message: msg };
}

// ─── Normalizer helpers ───────────────────────────────────────────────────────
const toJS_guest = (r) => ({
  id: r.id,
  name: r.name,
  checkIn: r.check_in,
  checkOut: r.check_out,
  country: r.country,
  roomAllocated: r.room_allocated,
  purposeOfStay: r.purpose_of_stay,
  createdAt: r.created_at
});

const toSQL_guest = (d) => ({
  name: d.name,
  check_in: d.checkIn,
  check_out: d.checkOut,
  country: d.country,
  room_allocated: d.roomAllocated,
  purpose_of_stay: d.purposeOfStay
});

const toJS_maintenance = (r) => ({
  id: r.id,
  reportedOn: r.reported_on,
  issue: r.issue,
  status: r.status,
  updates: r.updates,
  location: r.location,
  nameOfWorker: r.name_of_worker,
  cost: r.cost,
  createdAt: r.created_at
});

const toSQL_maintenance = (d) => ({
  reported_on: d.reportedOn,
  issue: d.issue,
  status: d.status,
  updates: d.updates || null,
  location: d.location,
  name_of_worker: d.nameOfWorker || null,
  cost: d.cost || 0
});

const toJS_inventory = (r) => ({
  id: r.id,
  item: r.item,
  qty: r.qty,
  condition: r.condition,
  location: r.location,
  notes: r.notes,
  createdAt: r.created_at
});

const toSQL_inventory = (d) => ({
  item: d.item,
  qty: d.qty,
  condition: d.condition,
  location: d.location,
  notes: d.notes || null
});

const toJS_bill = (r) => ({
  id: r.id,
  date: r.date,
  company: r.company,
  chequeNo: r.cheque_no,
  payee: r.payee,
  amount: r.amount,
  createdAt: r.created_at
});

const toSQL_bill = (d) => ({
  date: d.date,
  company: d.company,
  cheque_no: d.chequeNo,
  payee: d.payee,
  amount: d.amount
});

const toJS_asset = (r) => ({
  id: r.id,
  barcode: r.barcode,
  description: r.description,
  status: r.status,
  location: r.location,
  createdAt: r.created_at
});

const toSQL_asset = (d) => ({
  barcode: d.barcode,
  description: d.description,
  status: d.status,
  location: d.location
});

const toJS_log = (r) => ({
  id: r.id,
  timestamp: r.timestamp,
  userId: r.user_id,
  userName: r.user_name,
  userAvatar: r.user_avatar,
  action: r.action,
  moduleName: r.module_name,
  recordAffected: r.record_affected,
  details: r.details,
  createdAt: r.created_at
});

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
export async function fetchUserProfile(authUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_permissions(*)')
    .eq('id', authUserId)
    .single();
  if (error) return { data: null, error: normalizeError(error) };

  // Map permissions array to object keyed by module_key
  const permissions = {};
  (data.user_permissions || []).forEach(p => {
    permissions[p.module_key] = {
      view: p.can_view, add: p.can_add, edit: p.can_edit, delete: p.can_delete
    };
  });
  return { data: { ...data, permissions }, error: null };
}

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_permissions(*)')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: normalizeError(error) };
  return {
    data: data.map(u => {
      const permissions = {};
      (u.user_permissions || []).forEach(p => {
        permissions[p.module_key] = {
          view: p.can_view, add: p.can_add, edit: p.can_edit, delete: p.can_delete
        };
      });
      return { ...u, permissions };
    }),
    error: null
  };
}

export async function createUser(formData, currentUser) {
  const { data, error } = await supabase.from('users').insert({
    name: formData.name,
    email: formData.email,
    role: formData.role,
    status: formData.status || 'Active',
    avatar: formData.avatar || null
  }).select().single();
  if (!error && data) {
    await logActivity(currentUser, 'Created', 'User Management', formData.name);
  }
  return { data, error: normalizeError(error) };
}

export async function updateUser(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('users')
    .update({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status
    })
    .eq('id', id)
    .select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'User Management', formData.name);
  return { data, error: normalizeError(error) };
}

export async function deleteUser(id, name, currentUser) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'User Management', name);
  return { error: normalizeError(error) };
}

export async function upsertUserPermissions(userId, moduleKey, perms) {
  const { error } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: userId,
      module_key: moduleKey,
      can_view: perms.view,
      can_add: perms.add,
      can_edit: perms.edit,
      can_delete: perms.delete
    }, { onConflict: 'user_id,module_key' });
  return { error: normalizeError(error) };
}

// ─── GUEST LIST ───────────────────────────────────────────────────────────────
export async function fetchGuests(searchQuery = '') {
  let query = supabase.from('guest_list').select('*').order('created_at', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`name.ilike.%${t}%,country.ilike.%${t}%,room_allocated.ilike.%${t}%,purpose_of_stay.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_guest), error: normalizeError(error) };
}

export async function createGuest(formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_list').insert(toSQL_guest(formData)).select().single();
  if (!error && data) {
    await logActivity(currentUser, 'Created', 'Guest List', formData.name);
  }
  return { data: data ? toJS_guest(data) : null, error: normalizeError(error) };
}

export async function updateGuest(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_list').update(toSQL_guest(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Guest List', formData.name);
  return { data: data ? toJS_guest(data) : null, error: normalizeError(error) };
}

export async function deleteGuest(id, name, currentUser) {
  const { error } = await supabase.from('guest_list').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Guest List', name);
  return { error: normalizeError(error) };
}

// ─── GUEST HOUSE MAINTENANCE ──────────────────────────────────────────────────
export async function fetchGHMaintenance(searchQuery = '') {
  let query = supabase.from('guest_house_maintenance').select('*').order('reported_on', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`issue.ilike.%${t}%,location.ilike.%${t}%,name_of_worker.ilike.%${t}%,updates.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_maintenance), error };
}

export async function createGHMaintenance(formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_house_maintenance').insert(toSQL_maintenance(formData)).select().single();
  if (!error && data) {
    await logActivity(currentUser, 'Created', 'Guest House Maintenance', formData.issue?.slice(0, 50));
  }
  return { data: data ? toJS_maintenance(data) : null, error: normalizeError(error) };
}

export async function updateGHMaintenance(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_house_maintenance').update(toSQL_maintenance(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Guest House Maintenance', formData.issue?.slice(0, 50));
  return { data: data ? toJS_maintenance(data) : null, error: normalizeError(error) };
}

export async function deleteGHMaintenance(id, issue, currentUser) {
  const { error } = await supabase.from('guest_house_maintenance').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Guest House Maintenance', issue?.slice(0, 50));
  return { error: normalizeError(error) };
}

// ─── GUEST HOUSE INVENTORY ────────────────────────────────────────────────────
export async function fetchGHInventory(searchQuery = '') {
  let query = supabase.from('guest_house_inventory').select('*').order('created_at', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`item.ilike.%${t}%,location.ilike.%${t}%,notes.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_inventory), error: normalizeError(error) };
}

export async function createGHInventory(formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_house_inventory').insert(toSQL_inventory(formData)).select().single();
  if (!error && data) await logActivity(currentUser, 'Created', 'Guest House Inventory', formData.item);
  return { data: data ? toJS_inventory(data) : null, error: normalizeError(error) };
}

export async function updateGHInventory(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('guest_house_inventory').update(toSQL_inventory(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Guest House Inventory', formData.item);
  return { data: data ? toJS_inventory(data) : null, error: normalizeError(error) };
}

export async function deleteGHInventory(id, item, currentUser) {
  const { error } = await supabase.from('guest_house_inventory').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Guest House Inventory', item);
  return { error: normalizeError(error) };
}

// ─── OFFICE BILL PAYMENTS ─────────────────────────────────────────────────────
export async function fetchBillPayments(searchQuery = '') {
  let query = supabase.from('office_bill_payments').select('*').order('date', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`company.ilike.%${t}%,cheque_no.ilike.%${t}%,payee.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_bill), error: normalizeError(error) };
}

export async function createBillPayment(formData, currentUser) {
  const { data, error } = await supabase
    .from('office_bill_payments').insert(toSQL_bill(formData)).select().single();
  if (!error && data) await logActivity(currentUser, 'Created', 'Office Bill Payments', formData.company);
  return { data: data ? toJS_bill(data) : null, error: normalizeError(error) };
}

export async function updateBillPayment(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('office_bill_payments').update(toSQL_bill(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Office Bill Payments', formData.company);
  return { data: data ? toJS_bill(data) : null, error: normalizeError(error) };
}

export async function deleteBillPayment(id, company, currentUser) {
  const { error } = await supabase.from('office_bill_payments').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Office Bill Payments', company);
  return { error: normalizeError(error) };
}

// ─── OFFICE ASSETS ────────────────────────────────────────────────────────────
export async function fetchOfficeAssets(searchQuery = '') {
  let query = supabase.from('office_assets').select('*').order('created_at', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`description.ilike.%${t}%,barcode.ilike.%${t}%,location.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_asset), error: normalizeError(error) };
}

export async function createOfficeAsset(formData, currentUser) {
  const { data, error } = await supabase
    .from('office_assets').insert(toSQL_asset(formData)).select().single();
  if (!error && data) await logActivity(currentUser, 'Created', 'Office Asset List', formData.description);
  return { data: data ? toJS_asset(data) : null, error: normalizeError(error) };
}

export async function updateOfficeAsset(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('office_assets').update(toSQL_asset(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Office Asset List', formData.description);
  return { data: data ? toJS_asset(data) : null, error: normalizeError(error) };
}

export async function deleteOfficeAsset(id, description, currentUser) {
  const { error } = await supabase.from('office_assets').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Office Asset List', description);
  return { error: normalizeError(error) };
}

// ─── OFFICE MAINTENANCE ───────────────────────────────────────────────────────
export async function fetchOfficeMaintenance(searchQuery = '') {
  let query = supabase.from('office_maintenance').select('*').order('reported_on', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`issue.ilike.%${t}%,location.ilike.%${t}%,name_of_worker.ilike.%${t}%,updates.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_maintenance), error };
}

export async function createOfficeMaintenance(formData, currentUser) {
  const { data, error } = await supabase
    .from('office_maintenance').insert(toSQL_maintenance(formData)).select().single();
  if (!error && data) await logActivity(currentUser, 'Created', 'Office Maintenance', formData.issue?.slice(0, 50));
  return { data: data ? toJS_maintenance(data) : null, error: normalizeError(error) };
}

export async function updateOfficeMaintenance(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('office_maintenance').update(toSQL_maintenance(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Office Maintenance', formData.issue?.slice(0, 50));
  return { data: data ? toJS_maintenance(data) : null, error: normalizeError(error) };
}

export async function deleteOfficeMaintenance(id, issue, currentUser) {
  const { error } = await supabase.from('office_maintenance').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Office Maintenance', issue?.slice(0, 50));
  return { error: normalizeError(error) };
}

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
export async function fetchActivityLogs(limit = 100, searchQuery = '') {
  let query = supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(limit);
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`user_name.ilike.%${t}%,module_name.ilike.%${t}%,record_affected.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_log), error: normalizeError(error) };
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export async function fetchDashboardStats() {
  const [
    { count: guests },
    { count: ghMaint },
    { count: ghInv },
    { count: bills },
    { count: assets },
    { count: officeMaint }
  ] = await Promise.all([
    supabase.from('guest_list').select('*', { count: 'exact', head: true }),
    supabase.from('guest_house_maintenance').select('*', { count: 'exact', head: true }).neq('status', 'Resolved'),
    supabase.from('guest_house_inventory').select('*', { count: 'exact', head: true }),
    supabase.from('office_bill_payments').select('*', { count: 'exact', head: true }),
    supabase.from('office_assets').select('*', { count: 'exact', head: true }),
    supabase.from('office_maintenance').select('*', { count: 'exact', head: true }).neq('status', 'Resolved')
  ]);

  // Total bills amount
  const { data: billAmounts } = await supabase
    .from('office_bill_payments').select('amount');
  const totalBills = (billAmounts || []).reduce((s, r) => s + Number(r.amount), 0);

  return {
    guests: guests || 0,
    openMaintenance: (ghMaint || 0) + (officeMaint || 0),
    inventory: ghInv || 0,
    assets: assets || 0,
    bills: bills || 0,
    totalBillsAmount: totalBills
  };
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error: normalizeError(error) };
}

export async function markNotificationAsRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  return { error: normalizeError(error) };
}

export async function markAllNotificationsAsRead() {
  // Requires RPC or just update where is_read=false and user_id=auth.uid()
  // With RLS, this update will naturally only apply to the user's notifications.
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  return { error: normalizeError(error) };
}
