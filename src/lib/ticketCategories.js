/**
 * ticketCategories.js
 * ===================
 * Maps each "raise a ticket from a module record" category to the module's
 * permission key, its record-fetch function, and a human label builder used
 * to populate the record picker in the New Ticket form.
 */

import {
  fetchGuests,
  fetchGHMaintenance,
  fetchGHInventory,
  fetchBillPayments,
  fetchVehicleMaintenance,
  fetchOfficeMaintenance
} from './supabaseService.js';

export const TICKET_CATEGORIES = [
  {
    value: 'Guest List',
    permissionKey: 'guest_list',
    fetchFn: fetchGuests,
    buildLabel: (r) => `${r.name} — Room ${r.roomAllocated} (${r.checkIn})`
  },
  {
    value: 'Guest House Maintenance',
    permissionKey: 'gh_maintenance',
    fetchFn: fetchGHMaintenance,
    buildLabel: (r) => `${r.issue} — ${r.location} (${r.reportedOn})`
  },
  {
    value: 'Guest House Inventory',
    permissionKey: 'gh_inventory',
    fetchFn: fetchGHInventory,
    buildLabel: (r) => `${r.item} — ${r.location} (Qty ${r.qty})`
  },
  {
    value: 'Office Bill Payments',
    permissionKey: 'office_bills',
    fetchFn: fetchBillPayments,
    buildLabel: (r) => `${r.payee} — ${r.company} #${r.chequeNo} (GHS ${r.amount})`
  },
  {
    value: 'Vehicles Maintenance',
    permissionKey: 'vehicles_maintenance',
    fetchFn: fetchVehicleMaintenance,
    buildLabel: (r) => `${r.vehicleName} — ${r.issue} (${r.reportedOn})`
  },
  {
    value: 'Office Maintenance',
    permissionKey: 'office_maintenance',
    fetchFn: fetchOfficeMaintenance,
    buildLabel: (r) => `${r.issue} — ${r.location} (${r.reportedOn})`
  }
];

export const getTicketCategoryConfig = (categoryValue) =>
  TICKET_CATEGORIES.find(c => c.value === categoryValue) || null;
