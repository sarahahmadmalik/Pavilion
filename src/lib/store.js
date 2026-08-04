import {
  INITIAL_USERS,
  INITIAL_GUESTS,
  INITIAL_GH_MAINTENANCE,
  INITIAL_GH_INVENTORY,
  INITIAL_OFFICE_BILLS,
  INITIAL_OFFICE_ASSETS,
  INITIAL_OFFICE_MAINTENANCE,
  INITIAL_ACTIVITY_LOGS
} from '../data/mockData.js';

const STORAGE_KEYS = {
  USERS: 'mta_ghana_users',
  GUESTS: 'mta_ghana_guests',
  GH_MAINTENANCE: 'mta_ghana_gh_maintenance',
  GH_INVENTORY: 'mta_ghana_gh_inventory',
  OFFICE_BILLS: 'mta_ghana_office_bills',
  OFFICE_ASSETS: 'mta_ghana_office_assets',
  OFFICE_MAINTENANCE: 'mta_ghana_office_maintenance',
  ACTIVITY_LOGS: 'mta_ghana_activity_logs'
};

// Helper to initialize or retrieve from localStorage
const getStorageItem = (key, initialValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return initialValue;
  }
};

const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Error setting ${key} in localStorage`, e);
  }
};

// Simple event subscriber pattern
const listeners = new Set();
export const subscribeStore = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
const notifyListeners = () => {
  listeners.forEach(cb => cb());
};

// Initialize State
export const store = {
  getUsers: () => getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS),
  getGuests: () => getStorageItem(STORAGE_KEYS.GUESTS, INITIAL_GUESTS),
  getGHMaintenance: () => getStorageItem(STORAGE_KEYS.GH_MAINTENANCE, INITIAL_GH_MAINTENANCE),
  getGHInventory: () => getStorageItem(STORAGE_KEYS.GH_INVENTORY, INITIAL_GH_INVENTORY),
  getOfficeBills: () => getStorageItem(STORAGE_KEYS.OFFICE_BILLS, INITIAL_OFFICE_BILLS),
  getOfficeAssets: () => getStorageItem(STORAGE_KEYS.OFFICE_ASSETS, INITIAL_OFFICE_ASSETS),
  getOfficeMaintenance: () => getStorageItem(STORAGE_KEYS.OFFICE_MAINTENANCE, INITIAL_OFFICE_MAINTENANCE),
  getActivityLogs: () => getStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS),

  // Reset store to initial seed
  resetStore: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(INITIAL_GUESTS));
    localStorage.setItem(STORAGE_KEYS.GH_MAINTENANCE, JSON.stringify(INITIAL_GH_MAINTENANCE));
    localStorage.setItem(STORAGE_KEYS.GH_INVENTORY, JSON.stringify(INITIAL_GH_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.OFFICE_BILLS, JSON.stringify(INITIAL_OFFICE_BILLS));
    localStorage.setItem(STORAGE_KEYS.OFFICE_ASSETS, JSON.stringify(INITIAL_OFFICE_ASSETS));
    localStorage.setItem(STORAGE_KEYS.OFFICE_MAINTENANCE, JSON.stringify(INITIAL_OFFICE_MAINTENANCE));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    notifyListeners();
  }
};

// Logger helper for Audit Trail
export const logActivity = (currentUser, action, moduleName, recordAffected, details = null) => {
  const currentLogs = store.getActivityLogs();
  const now = new Date();
  const formattedTime = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
  
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: formattedTime,
    userId: currentUser?.id || 'usr-1',
    userName: currentUser?.name || 'Super Admin',
    userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    action, // 'Created' | 'Edited' | 'Deleted'
    moduleName,
    recordAffected,
    details
  };

  setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, [newLog, ...currentLogs]);
};

// Generic CRUD Operations with Auto-Audit Logging
export const addItem = (storageKey, moduleName, item, currentUser, getRecordTitle) => {
  const list = getStorageItem(storageKey, []);
  const newItem = {
    id: `${storageKey.slice(0, 3)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...item
  };
  const updatedList = [newItem, ...list];
  setStorageItem(storageKey, updatedList);

  const title = getRecordTitle ? getRecordTitle(newItem) : newItem.name || newItem.item || newItem.description || newItem.issue || newItem.company || 'Record';
  logActivity(currentUser, 'Created', moduleName, `${moduleName}: ${title}`, item);
  return newItem;
};

export const updateItem = (storageKey, moduleName, id, updatedFields, currentUser, getRecordTitle) => {
  const list = getStorageItem(storageKey, []);
  let oldItem = null;
  const updatedList = list.map(item => {
    if (item.id === id) {
      oldItem = { ...item };
      return { ...item, ...updatedFields };
    }
    return item;
  });

  setStorageItem(storageKey, updatedList);

  // Compute field-by-field diff for audit log
  const diff = {};
  if (oldItem) {
    Object.keys(updatedFields).forEach(key => {
      if (oldItem[key] !== updatedFields[key]) {
        diff[key] = { old: oldItem[key] ?? null, new: updatedFields[key] };
      }
    });
  }

  const title = getRecordTitle ? getRecordTitle(oldItem) : oldItem?.name || oldItem?.item || oldItem?.description || oldItem?.issue || oldItem?.company || 'Record';
  logActivity(currentUser, 'Edited', moduleName, `${moduleName}: ${title}`, diff);
};

export const deleteItem = (storageKey, moduleName, id, currentUser, getRecordTitle) => {
  const list = getStorageItem(storageKey, []);
  const itemToDelete = list.find(i => i.id === id);
  const updatedList = list.filter(i => i.id !== id);

  setStorageItem(storageKey, updatedList);

  const title = getRecordTitle ? getRecordTitle(itemToDelete) : itemToDelete?.name || itemToDelete?.item || itemToDelete?.description || itemToDelete?.issue || itemToDelete?.company || 'Record';
  logActivity(currentUser, 'Deleted', moduleName, `${moduleName}: ${title}`, itemToDelete);
};

// Module specific storage key map
export const MODULE_STORAGE_MAP = {
  guest_list: STORAGE_KEYS.GUESTS,
  gh_maintenance: STORAGE_KEYS.GH_MAINTENANCE,
  gh_inventory: STORAGE_KEYS.GH_INVENTORY,
  office_bills: STORAGE_KEYS.OFFICE_BILLS,
  office_assets: STORAGE_KEYS.OFFICE_ASSETS,
  office_maintenance: STORAGE_KEYS.OFFICE_MAINTENANCE,
  users: STORAGE_KEYS.USERS
};
