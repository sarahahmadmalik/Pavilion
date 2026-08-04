// Initial Seed Data for MTA Ghana Admin Dashboard Prototype

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Alhaj Mubarak Ahmad',
    email: 'superadmin@mtaghana.org',
    role: 'super_admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastLogin: '2026-08-04 14:32',
    permissions: {
      guest_list: { view: true, add: true, edit: true, delete: true },
      gh_maintenance: { view: true, add: true, edit: true, delete: true },
      gh_inventory: { view: true, add: true, edit: true, delete: true },
      office_bills: { view: true, add: true, edit: true, delete: true },
      office_assets: { view: true, add: true, edit: true, delete: true },
      office_maintenance: { view: true, add: true, edit: true, delete: true }
    }
  },
  {
    id: 'usr-2',
    name: 'Dr. Ibrahim Mensah',
    email: 'admin@mtaghana.org',
    role: 'admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    lastLogin: '2026-08-04 11:15',
    permissions: {
      guest_list: { view: true, add: true, edit: true, delete: true },
      gh_maintenance: { view: true, add: true, edit: true, delete: true },
      gh_inventory: { view: true, add: true, edit: true, delete: true },
      office_bills: { view: true, add: true, edit: true, delete: true },
      office_assets: { view: true, add: true, edit: true, delete: true },
      office_maintenance: { view: true, add: true, edit: true, delete: true }
    }
  },
  {
    id: 'usr-3',
    name: 'Kwame Owusu',
    email: 'staff@mtaghana.org',
    role: 'staff',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    lastLogin: '2026-08-03 09:45',
    permissions: {
      guest_list: { view: true, add: true, edit: true, delete: false },
      gh_maintenance: { view: true, add: true, edit: false, delete: false },
      gh_inventory: { view: true, add: true, edit: true, delete: false },
      office_bills: { view: false, add: false, edit: false, delete: false },
      office_assets: { view: false, add: false, edit: false, delete: false },
      office_maintenance: { view: false, add: false, edit: false, delete: false }
    }
  },
  {
    id: 'usr-4',
    name: 'Ama Serwaa',
    email: 'aserwaa@mtaghana.org',
    role: 'staff',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    lastLogin: '2026-08-02 16:20',
    permissions: {
      guest_list: { view: false, add: false, edit: false, delete: false },
      gh_maintenance: { view: false, add: false, edit: false, delete: false },
      gh_inventory: { view: false, add: false, edit: false, delete: false },
      office_bills: { view: true, add: true, edit: true, delete: false },
      office_assets: { view: true, add: true, edit: true, delete: false },
      office_maintenance: { view: true, add: true, edit: false, delete: false }
    }
  },
  {
    id: 'usr-5',
    name: 'Kofi Annan',
    email: 'kofi@mtaghana.org',
    role: 'staff',
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    lastLogin: '2026-06-12 10:00',
    permissions: {
      guest_list: { view: true, add: false, edit: false, delete: false },
      gh_maintenance: { view: false, add: false, edit: false, delete: false },
      gh_inventory: { view: false, add: false, edit: false, delete: false },
      office_bills: { view: false, add: false, edit: false, delete: false },
      office_assets: { view: false, add: false, edit: false, delete: false },
      office_maintenance: { view: false, add: false, edit: false, delete: false }
    }
  }
];

export const INITIAL_GUESTS = [
  {
    id: 'gst-101',
    name: 'Maulana Abdul Rashid',
    checkIn: '2026-08-01',
    checkOut: '2026-08-10',
    country: 'United Kingdom',
    roomAllocated: 'VIP Suite 101',
    purposeOfStay: 'Annual Conference & Inspection Tour'
  },
  {
    id: 'gst-102',
    name: 'Tariq Mahmood',
    checkIn: '2026-08-03',
    checkOut: '2026-08-07',
    country: 'Pakistan',
    roomAllocated: 'Room 204',
    purposeOfStay: 'IT Systems Infrastructure Training'
  },
  {
    id: 'gst-103',
    name: 'Hajia Fatimah Baidoo',
    checkIn: '2026-08-04',
    checkOut: '2026-08-08',
    country: 'Ghana (Kumasi)',
    roomAllocated: 'Room 105',
    purposeOfStay: 'Regional Women Auxiliary Executive Meeting'
  },
  {
    id: 'gst-104',
    name: 'Brother Usman Siddique',
    checkIn: '2026-07-28',
    checkOut: '2026-08-05',
    country: 'Nigeria',
    roomAllocated: 'Room 202',
    purposeOfStay: 'Broadcast Studio Maintenance Workshop'
  },
  {
    id: 'gst-105',
    name: 'Sister Maryam Mensah',
    checkIn: '2026-08-02',
    checkOut: '2026-08-12',
    country: 'Canada',
    roomAllocated: 'VIP Suite 102',
    purposeOfStay: 'Humanitarian Relief Logistics Coordination'
  }
];

export const INITIAL_GH_MAINTENANCE = [
  {
    id: 'ghm-201',
    reportedOn: '2026-08-02',
    issue: 'Air Conditioner leaking water in Room 204',
    status: 'In Progress',
    updates: 'Technician inspected. Replacing compressor drain pipe.',
    location: 'Guest House Block B - Room 204',
    nameOfWorker: 'Kwabena HVAC Services',
    cost: 450.00
  },
  {
    id: 'ghm-202',
    reportedOn: '2026-08-03',
    issue: 'Water heater malfunction in VIP Suite 101',
    status: 'Open',
    updates: 'Reported by guest housekeeper. Electrician requested.',
    location: 'Guest House Main Wing - Suite 101',
    nameOfWorker: 'Pending Assignment',
    cost: 0.00
  },
  {
    id: 'ghm-203',
    reportedOn: '2026-07-29',
    issue: 'Balcony door latch replacement',
    status: 'Resolved',
    updates: 'New brass lock set installed and tested successfully.',
    location: 'Guest House Block A - Room 102',
    nameOfWorker: 'Osei Carpentry Works',
    cost: 180.00
  },
  {
    id: 'ghm-204',
    reportedOn: '2026-07-25',
    issue: 'Corridor LED ceiling lights flickering',
    status: 'Resolved',
    updates: 'Replaced 4 LED drivers and wiring junction box.',
    location: 'Guest House 2nd Floor Corridor',
    nameOfWorker: 'MTA Electrical Team',
    cost: 320.00
  }
];

export const INITIAL_GH_INVENTORY = [
  {
    id: 'ghi-301',
    item: 'Orthopedic Queen Mattresses',
    qty: 12,
    condition: 'Good',
    location: 'Guest Rooms (Block A & B)',
    notes: 'Purchased Q1 2026. High density foam.'
  },
  {
    id: 'ghi-302',
    item: 'Egyptian Cotton Bedding Sets',
    qty: 24,
    condition: 'Good',
    location: 'Laundry Linen Closet',
    notes: 'White 400-thread count sheets & pillowcases.'
  },
  {
    id: 'ghi-303',
    item: 'Standing Oscillating Fans',
    qty: 6,
    condition: 'Fair',
    location: 'Store Room 2',
    notes: '2 units exhibit slight motor noise when operating at level 3.'
  },
  {
    id: 'ghi-304',
    item: 'Smart LED TV 43-inch',
    qty: 4,
    condition: 'Good',
    location: 'VIP Suites & Lounge',
    notes: 'Wall mounted with HDMI inputs for MTA Studios link.'
  },
  {
    id: 'ghi-305',
    item: 'Electric Water Kettles 1.8L',
    qty: 8,
    condition: 'Damaged',
    location: 'Store Room 1',
    notes: '2 units have blown heating coils; scheduled for retirement.'
  }
];

export const INITIAL_OFFICE_BILLS = [
  {
    id: 'bil-401',
    date: '2026-08-01',
    company: 'Electricity Company of Ghana (ECG)',
    chequeNo: 'CHK-2026-0891',
    payee: 'ECG Regional Office Accra',
    amount: 3450.00
  },
  {
    id: 'bil-402',
    date: '2026-08-02',
    company: 'Ghana Water Company Limited',
    chequeNo: 'CHK-2026-0892',
    payee: 'GWCL Metered Services',
    amount: 1280.50
  },
  {
    id: 'bil-403',
    date: '2026-07-28',
    company: 'MTN Ghana Fibre Broadband',
    chequeNo: 'CHK-2026-0885',
    payee: 'MTN Enterprise Business',
    amount: 2100.00
  },
  {
    id: 'bil-404',
    date: '2026-07-20',
    company: 'State Insurance Corporation (SIC)',
    chequeNo: 'CHK-2026-0870',
    payee: 'SIC Fire & Property Insurance',
    amount: 6500.00
  }
];

export const INITIAL_OFFICE_ASSETS = [
  {
    id: 'ast-501',
    barcode: 'MTA-GH-AST-0012',
    description: 'Dell Latitude 5540 i7 16GB Laptop',
    status: 'In Use',
    location: 'Executive Director Office'
  },
  {
    id: 'ast-502',
    barcode: 'MTA-GH-AST-0045',
    description: 'HP LaserJet Enterprise Color Printer M553',
    status: 'In Use',
    location: 'Administration Central Printing Hub'
  },
  {
    id: 'ast-503',
    barcode: 'MTA-GH-AST-0089',
    description: 'Epson Pro Cinema 4K Projector',
    status: 'In Storage',
    location: 'Conference Room Store'
  },
  {
    id: 'ast-504',
    barcode: 'MTA-GH-AST-0104',
    description: 'APC Smart-UPS 3000VA Battery Backup',
    status: 'In Use',
    location: 'Server Room'
  },
  {
    id: 'ast-505',
    barcode: 'MTA-GH-AST-0003',
    description: 'Canon ImageRUNNER Copier 2520',
    status: 'Retired',
    location: 'Basement Storage'
  }
];

export const INITIAL_OFFICE_MAINTENANCE = [
  {
    id: 'ofm-601',
    reportedOn: '2026-08-03',
    issue: 'Perkins 150kVA Standby Generator monthly service',
    status: 'In Progress',
    updates: 'Replacing fuel filters and engine oil change.',
    location: 'Main Compound Generator Station',
    nameOfWorker: 'Mantrac Ghana Engineers',
    cost: 1850.00
  },
  {
    id: 'ofm-602',
    reportedOn: '2026-08-01',
    issue: 'Conference Room ceiling speaker audio static',
    status: 'Open',
    updates: 'Awaiting audio engineer diagnosis.',
    location: 'Main Administration Conference Hall',
    nameOfWorker: 'MTA Broadcast Team',
    cost: 0.00
  },
  {
    id: 'ofm-603',
    reportedOn: '2026-07-26',
    issue: 'Server Room dedicated AC unit thermostat recalibration',
    status: 'Resolved',
    updates: 'Calibrated digital sensor. Temperature holding steady at 18°C.',
    location: 'IT Server Room 104',
    nameOfWorker: 'CoolAir Ghana Ltd',
    cost: 550.00
  }
];

export const INITIAL_ACTIVITY_LOGS = [
  {
    id: 'log-901',
    timestamp: '2026-08-04 14:30',
    userId: 'usr-1',
    userName: 'Alhaj Mubarak Ahmad',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    action: 'Created',
    moduleName: 'Guest List',
    recordAffected: 'Guest: Maulana Abdul Rashid',
    details: {
      name: { old: null, new: 'Maulana Abdul Rashid' },
      country: { old: null, new: 'United Kingdom' },
      roomAllocated: { old: null, new: 'VIP Suite 101' }
    }
  },
  {
    id: 'log-902',
    timestamp: '2026-08-04 11:12',
    userId: 'usr-2',
    userName: 'Dr. Ibrahim Mensah',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    action: 'Edited',
    moduleName: 'Guest House Maintenance',
    recordAffected: 'Issue: AC leaking in Room 204',
    details: {
      status: { old: 'Open', new: 'In Progress' },
      updates: { old: 'Reported by housekeeping', new: 'Technician inspected. Replacing compressor drain pipe.' }
    }
  },
  {
    id: 'log-903',
    timestamp: '2026-08-03 16:45',
    userId: 'usr-3',
    userName: 'Kwame Owusu',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    action: 'Created',
    moduleName: 'Guest House Inventory',
    recordAffected: 'Item: Egyptian Cotton Bedding Sets',
    details: {
      qty: { old: null, new: 24 },
      condition: { old: null, new: 'Good' }
    }
  },
  {
    id: 'log-904',
    timestamp: '2026-08-02 10:20',
    userId: 'usr-1',
    userName: 'Alhaj Mubarak Ahmad',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    action: 'Edited',
    moduleName: 'User Management',
    recordAffected: 'User: Kwame Owusu',
    details: {
      permissions: { old: 'Read Only', new: 'Custom Staff Access (Guest List + Inventory)' }
    }
  }
];
