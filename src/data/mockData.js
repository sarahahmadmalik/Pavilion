// Initial Seed Data for MTA Ghana Admin Dashboard Prototype

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Tariq Malik',
    email: 'superadmin@mtaghana.org',
    role: 'super_admin',
    status: 'Active',
    avatar: null,
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
    name: 'Usman Khan',
    email: 'admin@mtaghana.org',
    role: 'admin',
    status: 'Active',
    avatar: null,
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
    name: 'Hamza Ahmed',
    email: 'staff@mtaghana.org',
    role: 'staff',
    status: 'Active',
    avatar: null,
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
    name: 'Saad Malik',
    email: 'saad@mtaghana.org',
    role: 'staff',
    status: 'Active',
    avatar: null,
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
    name: 'Rehan Shah',
    email: 'rehan@mtaghana.org',
    role: 'staff',
    status: 'Inactive',
    avatar: null,
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
    name: 'Bilal Chaudhry',
    checkIn: '2026-08-01',
    checkOut: '2026-08-10',
    country: 'Pakistan',
    roomAllocated: 'VIP Suite 101',
    purposeOfStay: 'Annual Conference & Inspection Tour'
  },
  {
    id: 'gst-102',
    name: 'Zeeshan Ali',
    checkIn: '2026-08-03',
    checkOut: '2026-08-07',
    country: 'Pakistan',
    roomAllocated: 'Room 204',
    purposeOfStay: 'IT Systems Infrastructure Training'
  },
  {
    id: 'gst-103',
    name: 'Farhan Akhtar',
    checkIn: '2026-08-04',
    checkOut: '2026-08-08',
    country: 'Pakistan',
    roomAllocated: 'Room 105',
    purposeOfStay: 'Regional Auxiliary Executive Meeting'
  },
  {
    id: 'gst-104',
    name: 'Zubair Hassan',
    checkIn: '2026-07-28',
    checkOut: '2026-08-05',
    country: 'Pakistan',
    roomAllocated: 'Room 202',
    purposeOfStay: 'Broadcast Studio Maintenance Workshop'
  },
  {
    id: 'gst-105',
    name: 'Faisal Saeed',
    checkIn: '2026-08-02',
    checkOut: '2026-08-12',
    country: 'Pakistan',
    roomAllocated: 'VIP Suite 102',
    purposeOfStay: 'Relief Logistics Coordination'
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
    nameOfWorker: 'Kamran HVAC Services',
    cost: 450.00
  },
  {
    id: 'ghm-202',
    reportedOn: '2026-08-03',
    issue: 'Water heater malfunction in VIP Suite 101',
    status: 'Open',
    updates: 'Reported by housekeeper. Electrician requested.',
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
    nameOfWorker: 'Adnan Carpentry Works',
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
    item: 'Daikin 2.0 HP Inverter AC Units',
    qty: 18,
    condition: 'Fair',
    location: 'Guest Rooms Block A & B',
    notes: 'Serviced quarterly.'
  },
  {
    id: 'ghi-304',
    item: 'Phillips HD LED Televisions (55 inch)',
    qty: 8,
    condition: 'Good',
    location: 'VIP Suites & Main Lounge',
    notes: 'Connected to MTA Satellite Dish.'
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
    payee: 'GWCL Metered Service Division',
    amount: 1280.00
  },
  {
    id: 'bil-403',
    date: '2026-07-31',
    company: 'MTN Ghana Fibre Broadband',
    chequeNo: 'CHK-2026-0893',
    payee: 'MTN Enterprise Business Unit',
    amount: 2150.00
  }
];

export const INITIAL_OFFICE_ASSETS = [
  {
    id: 'ast-501',
    barcode: 'MTA-AST-90214',
    description: 'Dell Latitude 5540 i7 16GB RAM Studio Laptop',
    status: 'In Use',
    location: 'Master Control Room'
  },
  {
    id: 'ast-502',
    barcode: 'MTA-AST-90215',
    description: 'Sony HXR-NX80 4K Ultra HD Broadcast Camera',
    status: 'In Use',
    location: 'Studio A - Main Set'
  },
  {
    id: 'ast-503',
    barcode: 'MTA-AST-90216',
    description: 'HP Color LaserJet Enterprise Printer X57745',
    status: 'In Use',
    location: 'Administration Office'
  }
];

export const INITIAL_OFFICE_MAINTENANCE = [
  {
    id: 'ofm-601',
    reportedOn: '2026-08-01',
    issue: 'Perkins 150kVA Standby Generator monthly servicing',
    status: 'In Progress',
    updates: 'Engine oil drained, new filters installed.',
    location: 'Generator House',
    nameOfWorker: 'Mantrac Ghana Engineers',
    cost: 1850.00
  },
  {
    id: 'ofm-602',
    reportedOn: '2026-07-30',
    issue: 'Studio B Acoustic Panel wall mounting & repair',
    status: 'Resolved',
    updates: 'Re-anchored 6 soundproof panels.',
    location: 'Studio B',
    nameOfWorker: 'Samuel Addo (Acoustic Spec)',
    cost: 650.00
  }
];

export const INITIAL_LOGS = [
  {
    id: 'log-701',
    timestamp: '2026-08-04 14:15',
    userId: 'usr-1',
    userName: 'Tariq Malik',
    userAvatar: null,
    action: 'Created',
    moduleName: 'Guest List',
    recordAffected: 'Bilal Chaudhry',
    details: { checkIn: '2026-08-01', country: 'Pakistan' }
  },
  {
    id: 'log-702',
    timestamp: '2026-08-04 13:40',
    userId: 'usr-2',
    userName: 'Usman Khan',
    userAvatar: null,
    action: 'Edited',
    moduleName: 'Guest House Maintenance',
    recordAffected: 'Air Conditioner leaking water in Room 204',
    details: { status: 'In Progress' }
  },
  {
    id: 'log-703',
    timestamp: '2026-08-04 11:20',
    userId: 'usr-3',
    userName: 'Hamza Ahmed',
    userAvatar: null,
    action: 'Created',
    moduleName: 'Office Bill Payments',
    recordAffected: 'Electricity Company of Ghana (ECG)',
    details: { amount: 3450.00 }
  }
];

export const INITIAL_ACTIVITY_LOGS = INITIAL_LOGS;
