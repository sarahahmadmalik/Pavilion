/**
 * supabaseService.js
 * ==================
 * All Supabase database operations for PAVILION.
 * Each function returns { data, error }.
 * Column mapping: camelCase JS ↔ snake_case Postgres.
 */

import { supabase } from './supabase.js';
import { sanitizeInput, sanitizeFormData } from './securityUtils.js';
import { toFriendlyError } from './errorMessages.js';

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
  return { message: toFriendlyError(err, 'Unable to complete this request. Please try again.') };
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
  serialNumber: r.serial_number,
  cost: r.cost,
  notes: r.notes,
  createdAt: r.created_at
});

const toSQL_inventory = (d) => ({
  item: d.item,
  qty: d.qty,
  condition: d.condition,
  location: d.location,
  serial_number: d.serialNumber || null,
  cost: d.cost || 0,
  notes: d.notes || null
});

const toJS_bill = (r) => ({
  id: r.id,
  date: r.date,
  company: r.company,
  chequeNo: r.cheque_no,
  payee: r.payee,
  amount: r.amount,
  notes: r.notes,
  createdAt: r.created_at
});

const toSQL_bill = (d) => ({
  date: d.date,
  company: d.company,
  cheque_no: d.chequeNo,
  payee: d.payee,
  amount: d.amount,
  notes: d.notes || null
});

const toJS_vehicle = (r) => ({
  id: r.id,
  reportedOn: r.reported_on,
  vehicleName: r.vehicle_name,
  issue: r.issue,
  status: r.status,
  updates: r.updates,
  nameOfWorker: r.name_of_worker,
  cost: r.cost,
  createdAt: r.created_at
});

const toSQL_vehicle = (d) => ({
  reported_on: d.reportedOn,
  vehicle_name: d.vehicleName,
  issue: d.issue,
  status: d.status,
  updates: d.updates || null,
  name_of_worker: d.nameOfWorker || null,
  cost: d.cost || 0
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

// Creates a REAL, login-capable account: a Supabase Auth user (via the
// admin-manage-user edge function, since that needs the service-role key)
// plus the matching public.users profile row, sharing the same id — the same
// pattern scripts/fixAuth.js already uses for the seeded accounts.
export async function createUser(formData, currentUser) {
  const { data: authResult, error: authError } = await supabase.functions.invoke('admin-manage-user', {
    body: { action: 'create', email: formData.email, password: formData.password, name: formData.name }
  });

  if (authError) {
    return { data: null, error: { message: 'Could not reach the user management service. Has admin-manage-user been deployed?' } };
  }
  if (!authResult?.success) {
    return { data: null, error: { message: authResult?.error || 'Failed to create the login account.' } };
  }

  const newId = authResult.userId;

  // Clean up any stale profile row left behind by an earlier broken attempt
  // (same email, different/orphaned id) so the email's unique constraint
  // doesn't block this — otherwise a once-broken account can never be fixed
  // by recreating it.
  await supabase.from('users').delete().eq('email', formData.email).neq('id', newId);

  const { data, error } = await supabase.from('users').upsert({
    id: newId,
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
  // Best-effort: also remove the auth account so the email can be reused later.
  // Don't block the profile delete on this — an undeployed function shouldn't
  // make "delete user" unusable, it just leaves an orphaned auth account.
  try {
    await supabase.functions.invoke('admin-manage-user', { body: { action: 'delete', userId: id } });
  } catch (err) {
    console.error('admin-manage-user delete invoke failed:', err);
  }

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'User Management', name);
  return { error: normalizeError(error) };
}

// Actually changes a user's login password (Super Admin only) via the
// admin-reset-password edge function — this needs the service-role key,
// which must stay server-side, never in the browser bundle.
export async function resetUserPassword(userId, newPassword, currentUser) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { userId, newPassword }
    });
    if (error) {
      return { error: { message: 'Could not reach the password reset service. Has admin-reset-password been deployed?' } };
    }
    if (!data?.success) {
      return { error: { message: data?.error || 'Password reset failed.' } };
    }
    await logActivity(currentUser, 'Edited', 'User Management', 'Reset a user account password');
    return { error: null };
  } catch (err) {
    return { error: { message: 'Password reset failed.' } };
  }
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

// ─── VEHICLES MAINTENANCE ────────────────────────────────────────────────────────
export async function fetchVehicleMaintenance(searchQuery = '') {
  let query = supabase.from('vehicles_maintenance').select('*').order('reported_on', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const t = searchQuery.trim();
    query = query.or(`vehicle_name.ilike.%${t}%,issue.ilike.%${t}%,name_of_worker.ilike.%${t}%,updates.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_vehicle), error: normalizeError(error) };
}

export async function createVehicleMaintenance(formData, currentUser) {
  const { data, error } = await supabase
    .from('vehicles_maintenance').insert(toSQL_vehicle(formData)).select().single();
  if (!error && data) await logActivity(currentUser, 'Created', 'Vehicles Maintenance', formData.vehicleName);
  return { data: data ? toJS_vehicle(data) : null, error: normalizeError(error) };
}

export async function updateVehicleMaintenance(id, formData, currentUser) {
  const { data, error } = await supabase
    .from('vehicles_maintenance').update(toSQL_vehicle(formData)).eq('id', id).select().single();
  if (!error) await logActivity(currentUser, 'Edited', 'Vehicles Maintenance', formData.vehicleName);
  return { data: data ? toJS_vehicle(data) : null, error: normalizeError(error) };
}

export async function deleteVehicleMaintenance(id, vehicleName, currentUser) {
  const { error } = await supabase.from('vehicles_maintenance').delete().eq('id', id);
  if (!error) await logActivity(currentUser, 'Deleted', 'Vehicles Maintenance', vehicleName);
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
    { count: vehicleMaint },
    { count: officeMaint }
  ] = await Promise.all([
    supabase.from('guest_list').select('*', { count: 'exact', head: true }),
    supabase.from('guest_house_maintenance').select('*', { count: 'exact', head: true }).neq('status', 'Resolved'),
    supabase.from('guest_house_inventory').select('*', { count: 'exact', head: true }),
    supabase.from('office_bill_payments').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles_maintenance').select('*', { count: 'exact', head: true }).neq('status', 'Resolved'),
    supabase.from('office_maintenance').select('*', { count: 'exact', head: true }).neq('status', 'Resolved')
  ]);

  // Total bills amount
  const { data: billAmounts } = await supabase
    .from('office_bill_payments').select('amount');
  const totalBills = (billAmounts || []).reduce((s, r) => s + Number(r.amount), 0);

  return {
    guests: guests || 0,
    openMaintenance: (ghMaint || 0) + (officeMaint || 0) + (vehicleMaint || 0),
    inventory: ghInv || 0,
    vehicleMaint: vehicleMaint || 0,
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

// Permanently clears all of the current user's notifications (RLS scopes this to their own rows)
export async function clearAllNotifications(userId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);
  return { error: normalizeError(error) };
}

// ─── TICKET SYSTEM ────────────────────────────────────────────────────────────

const toJS_ticket = (r) => ({
  id: r.id,
  ticketNo: r.ticket_no,
  createdBy: r.created_by,
  createdByName: r.created_by_name,
  createdByEmail: r.created_by_email,
  category: r.category,
  linkedRecordId: r.linked_record_id,
  linkedRecordLabel: r.linked_record_label,
  subject: r.subject,
  description: r.description,
  status: r.status,
  priority: r.priority,
  closedBy: r.closed_by,
  closedAt: r.closed_at,
  lastActivityAt: r.last_activity_at,
  createdAt: r.created_at,
  replies: (r.ticket_replies || []).map(toJS_reply)
});

const toJS_reply = (r) => ({
  id: r.id,
  ticketId: r.ticket_id,
  authorId: r.author_id,
  authorName: r.author_name,
  authorRole: r.author_role,
  message: r.message,
  createdAt: r.created_at
});

// Push a row into the shared notifications table. `ticketId` is optional —
// used to deep-link ticket-related notifications; omit it for non-ticket ones
// (e.g. a permission change) so staff only ever see ticket or account-access
// notifications, never generic activity noise.
async function pushNotification(userIds, ticketId, title, message) {
  if (!userIds || userIds.length === 0) return;
  const rows = userIds.map(uid => ({
    user_id: uid,
    ticket_id: ticketId,
    title,
    message
  }));
  await supabase.from('notifications').insert(rows);
}

// Helper — get all admin/super_admin user IDs
async function getAdminIds() {
  const { data } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin']);
  return (data || []).map(u => u.id);
}

// Helper — fire the ticket email edge function; never throws (email is best-effort)
async function sendTicketEmail(payload) {
  try {
    await supabase.functions.invoke('send-ticket-email', { body: payload });
  } catch (err) {
    console.error('send-ticket-email invoke failed:', err);
  }
}

// Fetch all tickets (admin sees all, staff sees own)
export async function fetchTickets(currentUser, searchQuery = '') {
  let query = supabase
    .from('tickets')
    .select('*, ticket_replies(id)')
    .order('created_at', { ascending: false });

  if (currentUser?.role === 'staff') {
    query = query.eq('created_by', currentUser.id);
  }
  if (searchQuery?.trim()) {
    const t = searchQuery.trim();
    query = query.or(`subject.ilike.%${t}%,created_by_name.ilike.%${t}%,category.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(toJS_ticket), error: normalizeError(error) };
}

// Fetch a single ticket with full reply thread
export async function fetchTicketById(id) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, ticket_replies(*)')
    .eq('id', id)
    .order('created_at', { ascending: true, referencedTable: 'ticket_replies' })
    .single();
  return { data: data ? toJS_ticket(data) : null, error: normalizeError(error) };
}

// Create a new ticket + notify all admins in-app
export async function createTicket(formData, currentUser) {
  if (['admin', 'super_admin'].includes(currentUser?.role)) {
    return { data: null, error: { message: 'Admins manage tickets and cannot raise new ones.' } };
  }

  const payload = {
    created_by: currentUser.id,
    created_by_name: currentUser.name,
    created_by_email: currentUser.email,
    category: formData.category || 'Custom',
    linked_record_id: formData.linkedRecordId || null,
    linked_record_label: formData.linkedRecordLabel || null,
    subject: sanitizeInput(formData.subject),
    description: sanitizeInput(formData.description),
    status: 'Open',
    priority: formData.priority || 'Normal',
    last_activity_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(payload)
    .select()
    .single();

  if (!error && data) {
    const adminIds = await getAdminIds();
    const notifyIds = adminIds.filter(id => id !== currentUser.id);
    await pushNotification(
      notifyIds,
      data.id,
      `New Ticket #${data.ticket_no}: ${formData.subject}`,
      `${currentUser.name} opened a ${formData.category} ticket — "${formData.subject}"`
    );
    await sendTicketEmail({ type: 'new_ticket', ticketId: data.id });
  }

  return { data: data ? toJS_ticket(data) : null, error: normalizeError(error) };
}

// Reply to a ticket — updates last_activity_at + notifies relevant parties
export async function replyToTicket(ticketId, message, currentUser, ticket) {
  const replyPayload = {
    ticket_id: ticketId,
    author_id: currentUser.id,
    author_name: currentUser.name,
    author_role: currentUser.role,
    message: sanitizeInput(message)
  };

  const { data: replyData, error } = await supabase
    .from('ticket_replies')
    .insert(replyPayload)
    .select()
    .single();

  if (!error) {
    // Update ticket status to "In Progress" and bump last_activity_at
    await supabase
      .from('tickets')
      .update({
        status: ticket?.status === 'Open' && currentUser.role !== 'staff' ? 'In Progress' : ticket?.status,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    // Determine who to notify
    const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);
    if (isAdmin && ticket?.createdBy && ticket.createdBy !== currentUser.id) {
      // Admin replied → notify ticket creator
      await pushNotification(
        [ticket.createdBy],
        ticketId,
        `Reply on your Ticket #${ticket.ticketNo}`,
        `${currentUser.name} replied to your ticket — "${ticket.subject}"`
      );
    } else if (!isAdmin) {
      // Staff replied → notify all admins
      const adminIds = await getAdminIds();
      await pushNotification(
        adminIds,
        ticketId,
        `Reply on Ticket #${ticket?.ticketNo}: ${ticket?.subject}`,
        `${currentUser.name} added a reply — "${message.slice(0, 120)}"`
      );
    }

    if (replyData) {
      await sendTicketEmail({ type: 'reply', ticketId, replyId: replyData.id });
    }
  }

  return { data: replyData ? toJS_reply(replyData) : null, error: normalizeError(error) };
}

// Close a ticket (admin/super_admin only)
export async function closeTicket(ticketId, currentUser, ticket) {
  if (!['admin', 'super_admin'].includes(currentUser?.role)) {
    return { data: null, error: { message: 'Only admins can close tickets.' } };
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'Closed',
      closed_by: currentUser.id,
      closed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (!error) {
    if (ticket?.createdBy && ticket.createdBy !== currentUser.id) {
      await pushNotification(
        [ticket.createdBy],
        ticketId,
        `Ticket #${ticket.ticketNo} Closed`,
        `Your ticket "${ticket.subject}" was closed by ${currentUser.name}.`
      );
    }
    await sendTicketEmail({ type: 'closed', ticketId });
  }

  return { data: data ? toJS_ticket(data) : null, error: normalizeError(error) };
}

// Lazy fallback sweep — closes any ticket stale for 45+ days (also runs via pg_cron)
export async function closeStaleTickets() {
  const { error } = await supabase.rpc('close_stale_tickets');
  return { error: normalizeError(error) };
}

// Notify a user that an admin changed their role/module permissions.
// This — plus ticket activity — is the ONLY notification a non-admin ever gets.
export async function notifyPermissionChange(userId, currentUser, newRole) {
  if (!userId || userId === currentUser?.id) return { error: null };
  const roleLabel = newRole === 'super_admin' ? 'Super Admin' : newRole === 'admin' ? 'Admin' : 'Staff';
  await pushNotification(
    [userId],
    null,
    'Your Account Access Was Updated',
    `${currentUser?.name || 'An administrator'} updated your account. Your role is now ${roleLabel}, with revised module permissions.`
  );
  return { error: null };
}

// ─── TICKET ATTACHMENTS ───────────────────────────────────────────────────────
// Bucket is private (see ticket_attachments_schema.sql) — anyone without an
// app session must not be able to pull a file from a bare URL, so links are
// short-lived signed URLs rather than permanent public ones.
const ATTACHMENTS_BUCKET = 'ticket-attachments';
const ATTACHMENT_URL_TTL_SECONDS = 60 * 60; // 1 hour

async function getAttachmentSignedUrl(path) {
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, ATTACHMENT_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl || null;
}

const toJS_attachment = (r) => ({
  id: r.id,
  ticketId: r.ticket_id,
  replyId: r.reply_id,
  uploadedBy: r.uploaded_by,
  uploadedByName: r.uploaded_by_name,
  fileName: r.file_name,
  filePath: r.file_path,
  fileType: r.file_type,
  fileSize: r.file_size,
  createdAt: r.created_at
});

export async function uploadTicketAttachment(file, ticketId, replyId, currentUser) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${ticketId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

  if (uploadError) return { data: null, error: normalizeError(uploadError) };

  const { data, error } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      reply_id: replyId || null,
      uploaded_by: currentUser.id,
      uploaded_by_name: currentUser.name,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size
    })
    .select()
    .single();

  if (error || !data) return { data: null, error: normalizeError(error) };

  const url = await getAttachmentSignedUrl(data.file_path);
  return { data: { ...toJS_attachment(data), url }, error: null };
}

export async function fetchTicketAttachments(ticketId) {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: normalizeError(error) };

  const withUrls = await Promise.all(
    (data || []).map(async (r) => ({ ...toJS_attachment(r), url: await getAttachmentSignedUrl(r.file_path) }))
  );
  return { data: withUrls, error: null };
}

// ─── BULK ROW ACTIONS ─────────────────────────────────────────────────────────
// Generic helpers reused by every list page's checkbox multi-select toolbar.
export async function bulkDeleteRecords(table, ids, currentUser, moduleLabel) {
  if (!ids || ids.length === 0) return { error: null };
  const { error } = await supabase.from(table).delete().in('id', ids);
  if (!error) await logActivity(currentUser, 'Deleted', moduleLabel, `${ids.length} record(s) (bulk)`);
  return { error: normalizeError(error) };
}

export async function bulkUpdateFields(table, ids, fields, currentUser, moduleLabel) {
  if (!ids || ids.length === 0) return { error: null };
  const { error } = await supabase.from(table).update(fields).in('id', ids);
  if (!error) await logActivity(currentUser, 'Edited', moduleLabel, `${ids.length} record(s) (bulk)`);
  return { error: normalizeError(error) };
}

// ─── COMMUNITY PROJECTS & TASKS ───────────────────────────────────────────────
export async function fetchProjects(searchQuery = '') {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (searchQuery?.trim()) {
    const t = searchQuery.trim();
    query = query.or(`title.ilike.%${t}%,department.ilike.%${t}%,owner.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(r => ({ ...r, dueDate: r.due_date })), error: normalizeError(error) };
}

export async function createProject(formData) {
  const clean = sanitizeFormData(formData);
  const payload = {
    title: clean.title,
    department: clean.department,
    owner: clean.owner,
    priority: clean.priority,
    status: clean.status,
    progress: Number(clean.progress) || 0,
    due_date: clean.dueDate || null,
    budget: Number(clean.budget) || 0
  };
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  return { data: data ? { ...data, dueDate: data.due_date } : null, error: normalizeError(error) };
}

export async function updateProject(id, formData) {
  const { data, error } = await supabase.from('projects').update(sanitizeFormData(formData)).eq('id', id).select().single();
  return { data, error: normalizeError(error) };
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return { error: normalizeError(error) };
}

// ─── VENDORS & CONTRACTS ──────────────────────────────────────────────────────
export async function fetchVendors(searchQuery = '') {
  let query = supabase.from('vendors').select('*').order('created_at', { ascending: false });
  if (searchQuery?.trim()) {
    const t = searchQuery.trim();
    query = query.or(`name.ilike.%${t}%,category.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return {
    data: (data || []).map(r => ({
      ...r,
      slaScore: r.sla_score,
      annualSpend: r.annual_spend,
      renewalDate: r.renewal_date
    })),
    error: normalizeError(error)
  };
}

export async function createVendor(formData) {
  const clean = sanitizeFormData(formData);
  const payload = {
    name: clean.name,
    category: clean.category,
    contact: clean.contact,
    phone: clean.phone,
    status: clean.status,
    sla_score: Number(clean.slaScore) || 95,
    annual_spend: Number(clean.annualSpend) || 0,
    renewal_date: clean.renewalDate || null
  };
  const { data, error } = await supabase.from('vendors').insert(payload).select().single();
  return { data, error: normalizeError(error) };
}

export async function deleteVendor(id) {
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  return { error: normalizeError(error) };
}

// ─── COMMUNITY STAFF DIRECTORY ────────────────────────────────────────────────
export async function fetchStaffDirectory(searchQuery = '') {
  let query = supabase.from('staff_directory').select('*').order('created_at', { ascending: false });
  if (searchQuery?.trim()) {
    const t = searchQuery.trim();
    query = query.or(`name.ilike.%${t}%,role.ilike.%${t}%,department.ilike.%${t}%,location.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: data || [], error: normalizeError(error) };
}

export async function createStaffMember(formData) {
  const { data, error } = await supabase.from('staff_directory').insert(sanitizeFormData(formData)).select().single();
  return { data, error: normalizeError(error) };
}

// ─── DOCUMENT & POLICY VAULT ──────────────────────────────────────────────────
export async function fetchDocuments(searchQuery = '') {
  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (searchQuery?.trim()) {
    const t = searchQuery.trim();
    query = query.or(`title.ilike.%${t}%,category.ilike.%${t}%,owner.ilike.%${t}%`);
  }
  const { data, error } = await query;
  return { data: (data || []).map(r => ({ ...r, updatedAt: r.updated_at })), error: normalizeError(error) };
}

export async function createDocument(formData) {
  const clean = sanitizeFormData(formData);
  const payload = {
    title: clean.title,
    category: clean.category,
    owner: clean.owner,
    size: clean.size || '1.0 MB',
    status: clean.status || 'Approved',
    summary: clean.summary,
    updated_at: clean.updatedAt || new Date().toISOString().split('T')[0]
  };
  const { data, error } = await supabase.from('documents').insert(payload).select().single();
  return { data, error: normalizeError(error) };
}

export async function deleteDocument(id) {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  return { error: normalizeError(error) };
}

// ─── SUITES & ROOM OCCUPANCY ──────────────────────────────────────────────────
export async function fetchRoomOccupancy() {
  const { data, error } = await supabase.from('room_occupancy').select('*').order('name', { ascending: true });
  return {
    data: (data || []).map(r => ({ ...r, checkOut: r.check_out })),
    error: normalizeError(error)
  };
}

export async function createRoomSuite(formData) {
  const clean = sanitizeFormData(formData);
  const payload = {
    name: clean.name,
    wing: clean.wing,
    capacity: Number(clean.capacity) || 2,
    status: clean.status || 'Available',
    guest: clean.guest || null,
    check_out: clean.checkOut || 'Ready Now',
    housekeeping: clean.housekeeping || 'Inspected',
    amenities: clean.amenities || ''
  };
  const { data, error } = await supabase.from('room_occupancy').insert(payload).select().single();
  return { data, error: normalizeError(error) };
}

export async function updateRoomSuite(id, patch) {
  const payload = sanitizeFormData({ ...patch });
  if ('checkOut' in payload) {
    payload.check_out = payload.checkOut;
    delete payload.checkOut;
  }
  const { data, error } = await supabase.from('room_occupancy').update(payload).eq('id', id).select().single();
  return { data, error: normalizeError(error) };
}

// ─── COMMUNITY NOTICES & EVENTS ───────────────────────────────────────────────
export async function fetchCommunityEvents() {
  const { data, error } = await supabase.from('community_events').select('*').order('date', { ascending: true });
  return { data: data || [], error: normalizeError(error) };
}

export async function createCommunityEvent(formData) {
  const { data, error } = await supabase.from('community_events').insert(sanitizeFormData(formData)).select().single();
  return { data, error: normalizeError(error) };
}

export async function updateCommunityEvent(id, patch) {
  const { data, error } = await supabase.from('community_events').update(sanitizeFormData(patch)).eq('id', id).select().single();
  return { data, error: normalizeError(error) };
}

// ─── SECURE TEAM CHAT (Admin & Staff only; Super Admin excluded) ──────────────
const CHAT_ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
const CHAT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function getChatAttachmentSignedUrl(filePath) {
  if (!filePath) return null;
  const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(filePath, 3600);
  return data?.signedUrl || null;
}

export async function fetchChatPeers(currentUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, avatar, status')
    .in('role', ['admin', 'staff'])
    .neq('id', currentUserId)
    .order('name', { ascending: true });
  return { data: data || [], error: normalizeError(error) };
}

export async function fetchChatOverview(currentUserId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
    .order('created_at', { ascending: false })
    .limit(300);
  return { data: data || [], error: normalizeError(error) };
}

export async function fetchChatMessages(currentUserId, peerId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${currentUserId})`
    )
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: normalizeError(error) };

  const hydrated = await Promise.all(
    (data || []).map(async (m) => ({
      ...m,
      attachmentUrl: m.attachment_path ? await getChatAttachmentSignedUrl(m.attachment_path) : null
    }))
  );
  return { data: hydrated, error: null };
}

export async function markChatMessagesDelivered(currentUserId, senderId = null) {
  let query = supabase
    .from('chat_messages')
    .update({ delivered_at: new Date().toISOString() })
    .eq('recipient_id', currentUserId)
    .is('delivered_at', null);

  if (senderId) query = query.eq('sender_id', senderId);
  const { error } = await query;
  return { error: normalizeError(error) };
}

export async function markChatMessagesRead(currentUserId, senderId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('chat_messages')
    .update({ read_at: now, delivered_at: now })
    .eq('recipient_id', currentUserId)
    .eq('sender_id', senderId)
    .is('read_at', null);
  return { error: normalizeError(error) };
}

export async function sendChatMessage({ sender, recipient, body, file }) {
  if (!sender || sender.role === 'super_admin') {
    return { data: null, error: { message: 'Team chat is available only for Admin and Staff accounts.' } };
  }
  if (!recipient || recipient.role === 'super_admin') {
    return { data: null, error: { message: 'Selected user is not eligible for team chat.' } };
  }

  const cleanBody = sanitizeInput(body || '');
  if (!cleanBody && !file) {
    return { data: null, error: { message: 'Please enter a message or attach a file.' } };
  }

  let attachmentMeta = {};
  if (file) {
    if (!CHAT_ALLOWED_TYPES.has(file.type)) {
      return { data: null, error: { message: 'Unsupported file type. Please attach an image, PDF, or Office document.' } };
    }
    if (file.size > CHAT_MAX_BYTES) {
      return { data: null, error: { message: 'Attachment exceeds the 10 MB size limit.' } };
    }

    const safeName = sanitizeInput(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${sender.id}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from('chat-attachments')
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadErr) {
      return { data: null, error: normalizeError(uploadErr) };
    }

    attachmentMeta = {
      attachment_name: safeName,
      attachment_path: storagePath,
      attachment_type: file.type,
      attachment_size: file.size
    };
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: sender.id,
      recipient_id: recipient.id,
      body: cleanBody || null,
      ...attachmentMeta
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: normalizeError(error) };
  }

  // In-app notification for recipient (triggers realtime bell + chime)
  const previewText = cleanBody
    ? cleanBody.slice(0, 110)
    : `Sent an attachment: ${attachmentMeta.attachment_name}`;

  await supabase.from('notifications').insert({
    user_id: recipient.id,
    title: `Message from ${sender.name}`,
    message: previewText
  });

  // Best-effort email notification via Edge Function
  try {
    await supabase.functions.invoke('send-chat-email', {
      body: {
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderName: sender.name,
        preview: previewText
      }
    });
  } catch {
    // Email notification is best-effort
  }

  return {
    data: {
      ...data,
      attachmentUrl: data.attachment_path ? await getChatAttachmentSignedUrl(data.attachment_path) : null
    },
    error: null
  };
}
