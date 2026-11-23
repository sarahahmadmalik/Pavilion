import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env file.');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const dateOffset = (days) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

const USERS = [
  { email: 'superadmin@pavilion-ops.com', password: 'PavilionAdmin123!', name: 'Victoria Sterling', role: 'super_admin' },
  { email: 'admin@pavilion-ops.com', password: 'Admin123!', name: 'Marcus Vance', role: 'admin' },
  { email: 'manager@pavilion-ops.com', password: 'Manager123!', name: 'Amara Mensah', role: 'admin' },
  { email: 'concierge@pavilion-ops.com', password: 'Staff123!', name: 'Elena Rostova', role: 'staff' },
  { email: 'facilities@pavilion-ops.com', password: 'Staff123!', name: 'Kwame Boateng', role: 'staff' }
];

async function seedUsers() {
  console.log('Creating/updating user accounts...');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw new Error(`Auth listUsers failed: ${listErr.message}`);
  const existingUsers = listData?.users || [];
  const createdMap = {};

  for (const u of USERS) {
    let authUser = existingUsers.find(e => e.email?.toLowerCase() === u.email.toLowerCase());
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name }
      });
      if (error) {
        console.error(`Failed creating auth user ${u.email}:`, error.message);
        continue;
      }
      authUser = data.user;
    } else {
      await supabase.auth.admin.updateUserById(authUser.id, { password: u.password });
    }

    const { error: upsertErr } = await supabase.from('users').upsert({
      id: authUser.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: 'Active'
    });
    if (upsertErr) {
      console.error(`Failed upserting public.users for ${u.email}:`, upsertErr.message);
    } else {
      createdMap[u.email] = authUser.id;
    }
  }

  // Seed default permissions for staff accounts
  const staffModules = [
    'guest_list', 'gh_maintenance', 'gh_inventory', 'office_bills',
    'vehicles_maintenance', 'office_maintenance', 'room_occupancy',
    'projects', 'community_events', 'documents'
  ];
  for (const staffEmail of ['concierge@pavilion-ops.com', 'facilities@pavilion-ops.com']) {
    const uid = createdMap[staffEmail];
    if (!uid) continue;
    await supabase.from('user_permissions').delete().eq('user_id', uid);
    const perms = staffModules.map(m => ({
      user_id: uid,
      module_key: m,
      can_view: true,
      can_add: true,
      can_edit: m.includes('maintenance') || m === 'guest_list' || m === 'room_occupancy',
      can_delete: false
    }));
    await supabase.from('user_permissions').insert(perms);
  }

  return createdMap;
}

async function insertBatch(table, rows) {
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`Error seeding ${table}:`, error.message);
  } else {
    console.log(`Seeded ${rows.length} rows into ${table}`);
  }
}

async function seedAllData() {
  const userIds = await seedUsers();
  const superAdminId = userIds['superadmin@pavilion-ops.com'];
  const adminId = userIds['admin@pavilion-ops.com'];
  const conciergeId = userIds['concierge@pavilion-ops.com'];
  const facilitiesId = userIds['facilities@pavilion-ops.com'];

  // 1. Guest List (25 rows)
  const guestCountries = ['Ghana', 'United Kingdom', 'United States', 'France', 'Germany', 'Singapore', 'Canada', 'Nigeria', 'Sweden', 'Netherlands'];
  const guestRooms = ['Penthouse Suite 01', 'Villa Aurelia', 'Suite 204', 'Garden Residence 03', 'Executive Loft 12', 'Clubhouse Suite', 'Courtyard Studio 04', 'Ambassador Suite 02'];
  const guestPurposes = ['Community Board Summit', 'Visiting Fellow', 'Architectural Review', 'Family Residence Stay', 'Operations Audit', 'Hospitality Retreat', 'Donor Delegation'];
  const guestNames = [
    'Alexander Thorne', 'Amara Mensah', 'Jean-Luc Moreau', 'Sophia Chen', 'Henrik Lindqvist',
    'Nadia Al-Mansoor', 'Kofi Annan-Boadu', 'Claire Dubois', 'Samuel Osei', 'Maya Patel',
    'Liam OConnor', 'Fatima Diallo', 'Lucas Weber', 'Zainab Ibrahim', 'Oliver Bennett',
    'Abena Boateng', 'Daniel Kim', 'Isabella Rossi', 'Tariq Hassan', 'Grace Mensah',
    'Noah Van Dijk', 'Chidinma Okafor', 'Ethan Brooks', 'Sanaa Haddad', 'Victor Hugo'
  ];
  await insertBatch('guest_list', guestNames.map((name, i) => ({
    name,
    check_in: dateOffset(i - 12),
    check_out: dateOffset(i - 8 + (i % 5)),
    country: guestCountries[i % guestCountries.length],
    room_allocated: guestRooms[i % guestRooms.length],
    purpose_of_stay: guestPurposes[i % guestPurposes.length]
  })));

  // 2. Guest House Maintenance (20 rows)
  const ghIssues = [
    'Smart thermostat calibration', 'Pool filtration pressure check', 'Bathroom brass dimmer replacement',
    'Patio sliding door track alignment', 'Hot water booster pump servicing', 'Keycard lock battery replacement',
    'Rain shower head descaling', 'Garden walkway bollard light repair', 'Kitchen induction cooktop check',
    'AC condenser coil cleaning', 'Ceiling fan balance adjustment', 'Window blind motor reset',
    'Backup inverter transfer test', 'Balcony railing varnish touch-up', 'Smoke detector battery audit',
    'Wi-Fi access point firmware update', 'Laundry dryer vent cleaning', 'Roof gutter clearing',
    'Water softener salt recharge', 'Intercom audio clarity tuning'
  ];
  const workers = ['Kwame Boateng', 'Daniel Mensah', 'Samuel Osei', 'Nordic HVAC Team', 'Sentinel Tech'];
  const statuses = ['Open', 'In Progress', 'Resolved'];
  await insertBatch('guest_house_maintenance', ghIssues.map((issue, i) => ({
    reported_on: dateOffset(-(i * 2)),
    issue,
    status: statuses[i % 3],
    updates: i % 3 === 2 ? 'Verified and signed off by facilities lead' : 'Scheduled with technician',
    location: guestRooms[i % guestRooms.length],
    name_of_worker: workers[i % workers.length],
    cost: 120 + (i * 35)
  })));

  // 3. Guest House Inventory (24 rows)
  const invItems = [
    'Egyptian Cotton 800TC Linen Sets', 'Nespresso Vertuo Pro Machines', 'Beosound Wireless Speakers',
    'Marble Bath Amenities Kits', 'Microfiber Bathrobes', 'Smart Keycard Fobs', 'Poolside Lounger Towels',
    'Filtered Water Carafes', 'Ergonomic Desk Chairs', '4K Smart TVs 55-inch', 'Air Purifier HEPA Units',
    'Steam Garment Presses', 'Ceramic Tea Service Sets', 'Outdoor Lanterns LED', 'First Aid Residence Kits',
    'Fire Extinguishers CO2', 'Espresso Descaling Packs', 'Hypoallergenic Pillows', 'Luggage Racks Walnut',
    'Electronic Wall Safes', 'Cordless Dyson Vacuums', 'Hair Dryers Ionic', 'Welcome Basket Hampers', 'Bedside USB-C Hubs'
  ];
  const conditions = ['Good', 'Good', 'Fair', 'Damaged'];
  await insertBatch('guest_house_inventory', invItems.map((item, i) => ({
    item,
    qty: 6 + (i % 15) * 3,
    condition: conditions[i % conditions.length],
    location: i % 2 === 0 ? 'Main Linen & Supply Store' : guestRooms[i % guestRooms.length],
    serial_number: `PV-INV-${1000 + i}`,
    cost: 85 + (i * 45),
    notes: i % 4 === 3 ? 'Flagged for replacement next cycle' : 'Inspected and catalogued'
  })));

  // 4. Office Bill Payments (24 rows across recent months)
  const billCompanies = [
    'ECG Commercial Power', 'GWCL Corporate Water', 'Starlink Enterprise Fiber',
    'Sentinel Security Systems', 'CleanWave Waste Management', 'SolarGrid Maintenance Co',
    'Apex Fire & Safety', 'GreenScape Groundskeeping'
  ];
  await insertBatch('office_bill_payments', Array.from({ length: 24 }, (_, i) => ({
    date: dateOffset(-(i * 7)),
    company: billCompanies[i % billCompanies.length],
    cheque_no: `CHQ-${8800 + i}`,
    payee: billCompanies[i % billCompanies.length],
    amount: 450 + ((i % 6) * 380),
    notes: `Monthly community & guest house billing cycle #${i + 1}`
  })));

  // 5. Vehicles Maintenance (15 rows)
  const vehicles = [
    'Mercedes V-Class Community Shuttle', 'Toyota Land Cruiser Prado 01',
    'Range Rover Guest Transfer 02', 'Ford Transit Utility Van', 'Hyundai H1 Staff Shuttle'
  ];
  const vehIssues = [
    'Scheduled 15,000km oil & filter service', 'Brake pad & rotor inspection', 'Wheel alignment & balancing',
    'AC compressor refrigerant recharge', 'Battery load & alternator test', 'Tire rotation & pressure calibration',
    'Suspension bushing replacement', 'Windshield wiper & fluid service'
  ];
  await insertBatch('vehicles_maintenance', Array.from({ length: 15 }, (_, i) => ({
    reported_on: dateOffset(-(i * 4)),
    vehicle_name: vehicles[i % vehicles.length],
    issue: vehIssues[i % vehIssues.length],
    status: statuses[i % 3],
    updates: i % 3 === 2 ? 'Road-tested and cleared' : 'In service bay',
    name_of_worker: i % 2 === 0 ? 'Silver Star Workshop' : 'Prestige Auto Care',
    cost: 180 + (i * 65)
  })));

  // 6. Office & Community Facility Maintenance (18 rows)
  const facilityLocations = ['Community Clubhouse', 'Main Gatehouse', 'Solar Inverter Room', 'Admin Office Wing', 'Perimeter Fence North', 'Gym & Wellness Pavilion'];
  const facilityIssues = [
    'Boardroom AV acoustic calibration', 'Biometric gate reader firmware update', 'Generator automatic transfer test',
    'Clubhouse chiller pressure check', 'Solar panel array dust wash', 'CCTV NVR storage expansion'
  ];
  await insertBatch('office_maintenance', Array.from({ length: 18 }, (_, i) => ({
    reported_on: dateOffset(-(i * 3)),
    issue: facilityIssues[i % facilityIssues.length],
    status: statuses[i % 3],
    updates: 'Tracked by facilities operations',
    location: facilityLocations[i % facilityLocations.length],
    name_of_worker: workers[i % workers.length],
    cost: 150 + (i * 55)
  })));

  // 7. Projects (16 rows)
  const projStages = ['Todo', 'In Progress', 'Review', 'Completed'];
  const projPriorities = ['High', 'Medium', 'Low'];
  const projTitles = [
    'Clubhouse Acoustic & Lighting Upgrade', 'Solar Microgrid Battery Expansion', 'Guest House Smart Lock Rollout',
    'Community Perimeter CCTV 4K Upgrade', 'Courtyard Landscaping & Irrigation', 'Rainwater Harvesting Filtration',
    'EV Charging Bays Installation', 'Fire & Life Safety Annual Audit', 'Guest Wi-Fi 6E Mesh Deployment',
    'Wellness Pavilion Equipment Refresh', 'Gatehouse Visitor Tablet Kiosk', 'Emergency Generator Overhaul',
    'Linen & Laundry Automation Setup', 'Community Waste Composting Station', 'Pool Heat Pump Installation', 'Archive Digitization Initiative'
  ];
  await insertBatch('projects', projTitles.map((title, i) => ({
    title,
    department: ['Facilities', 'Engineering', 'Guest House', 'Security', 'Operations'][i % 5],
    owner: ['Marcus Vance', 'Amara Mensah', 'Kwame Boateng', 'Elena Rostova'][i % 4],
    priority: projPriorities[i % 3],
    status: projStages[i % 4],
    progress: [20, 55, 85, 100][i % 4],
    due_date: dateOffset((i - 4) * 5),
    budget: 3500 + (i * 1800)
  })));

  // 8. Vendors (12 rows)
  const vendorNames = [
    'Silver Star Fleet Atelier', 'Sentinel Security Systems', 'Nordic Climate Engineering',
    'Aurelia Interiors & Lighting', 'Starlink Enterprise West', 'CleanWave Environmental',
    'Apex Fire & Safety Ltd', 'GreenScape Groundskeeping', 'VoltEdge Solar Microgrids',
    'PureFlow Water Filtration', 'Horizon Telecom Fiber', 'Artisan Linen & Laundry'
  ];
  await insertBatch('vendors', vendorNames.map((name, i) => ({
    name,
    category: ['Fleet', 'Security', 'HVAC', 'Interiors', 'Connectivity', 'Sanitation'][i % 6],
    contact: `ops${i + 1}@vendor-partner.com`,
    phone: `+233 30 274 ${1000 + i * 17}`,
    status: i % 5 === 4 ? 'Under Review' : 'Active',
    sla_score: 88 + (i % 12),
    annual_spend: 9500 + (i * 2800),
    renewal_date: dateOffset(20 + i * 25)
  })));

  // 9. Staff Directory (14 rows)
  const staffList = [
    { name: 'Victoria Sterling', role: 'Community Director', department: 'Executive Office', location: 'Admin Wing', status: 'On Duty', email: 'superadmin@pavilion-ops.com', phone: '+233 20 800 1001', utilization: 94 },
    { name: 'Marcus Vance', role: 'Operations Manager', department: 'Operations', location: 'Admin Wing', status: 'On Duty', email: 'admin@pavilion-ops.com', phone: '+233 20 800 1002', utilization: 90 },
    { name: 'Amara Mensah', role: 'Community Manager', department: 'Community', location: 'Clubhouse', status: 'On Duty', email: 'manager@pavilion-ops.com', phone: '+233 20 800 1003', utilization: 88 },
    { name: 'Elena Rostova', role: 'Guest House Concierge', department: 'Guest House', location: 'Reception', status: 'On Duty', email: 'concierge@pavilion-ops.com', phone: '+233 20 800 1004', utilization: 92 },
    { name: 'Kwame Boateng', role: 'Lead Facilities Engineer', department: 'Engineering', location: 'Workshop', status: 'In Field', email: 'facilities@pavilion-ops.com', phone: '+233 24 512 3309', utilization: 86 },
    { name: 'Daniel Mensah', role: 'Fleet Coordinator', department: 'Fleet', location: 'Garage Bay', status: 'On Duty', email: 'fleet@pavilion-ops.com', phone: '+233 27 339 1120', utilization: 84 },
    { name: 'Nadia Al-Mansoor', role: 'Procurement Officer', department: 'Finance', location: 'Admin Wing', status: 'Remote', email: 'procurement@pavilion-ops.com', phone: '+233 24 881 7740', utilization: 81 },
    { name: 'Samuel Osei', role: 'HVAC Technician', department: 'Engineering', location: 'Guest Wing', status: 'In Field', email: 'hvac@pavilion-ops.com', phone: '+233 24 611 4021', utilization: 87 },
    { name: 'Grace Addo', role: 'Housekeeping Supervisor', department: 'Guest House', location: 'Linen Vault', status: 'On Duty', email: 'housekeeping@pavilion-ops.com', phone: '+233 20 441 9082', utilization: 91 },
    { name: 'Ibrahim Tetteh', role: 'Security Lead', department: 'Security', location: 'Main Gate', status: 'On Duty', email: 'security@pavilion-ops.com', phone: '+233 24 992 1104', utilization: 95 },
    { name: 'Abena Kwarteng', role: 'Resident Liaison', department: 'Community', location: 'Clubhouse', status: 'On Duty', email: 'liaison@pavilion-ops.com', phone: '+233 20 715 3390', utilization: 83 },
    { name: 'Joseph Nkrumah', role: 'Grounds & Pool Specialist', department: 'Facilities', location: 'Courtyard', status: 'In Field', email: 'grounds@pavilion-ops.com', phone: '+233 24 302 8871', utilization: 85 }
  ];
  await insertBatch('staff_directory', staffList);

  // 10. Documents (12 rows)
  const docItems = [
    { title: 'Guest House Arrival & Concierge SOP v3.4', category: 'SOP', owner: 'Elena Rostova', size: '1.8 MB', status: 'Approved', summary: 'End-to-end suite readiness, keycard issuance, and guest orientation checklist.' },
    { title: 'Community Rules & Residency Handbook 2026', category: 'Legal & Compliance', owner: 'Amara Mensah', size: '3.1 MB', status: 'Approved', summary: 'Shared amenities etiquette, quiet hours, parking allocation, and visitor gate pass rules.' },
    { title: 'Preventive HVAC & Microgrid Maintenance Plan', category: 'Engineering', owner: 'Kwame Boateng', size: '940 KB', status: 'Approved', summary: 'Monthly and quarterly inspection schedules for chillers, solar inverters, and backup generators.' },
    { title: 'Vendor SLA & Procurement Governance Policy', category: 'Finance', owner: 'Nadia Al-Mansoor', size: '2.1 MB', status: 'Review Due', summary: 'Three-bid procurement rules, contractor KYC, and 95% SLA compliance terms.' },
    { title: 'Fire & Life Safety Evacuation Blueprint', category: 'Legal & Compliance', owner: 'Ibrahim Tetteh', size: '4.5 MB', status: 'Approved', summary: 'Muster points, extinguisher maps, and emergency responder contact tree.' },
    { title: 'Pool Water Chemistry & Hygiene Standard', category: 'SOP', owner: 'Joseph Nkrumah', size: '680 KB', status: 'Approved', summary: 'Daily pH, chlorine balance, and filter backwash log requirements.' },
    { title: 'Annual Community Insurance Binder 2026-2027', category: 'Legal & Compliance', owner: 'Victoria Sterling', size: '5.2 MB', status: 'Approved', summary: 'Property, liability, and guest house coverage schedules.' },
    { title: 'Housekeeping Turnaround & Linen Standard', category: 'SOP', owner: 'Grace Addo', size: '1.1 MB', status: 'Approved', summary: 'Room inspection scoring rubric and linen replacement intervals.' }
  ];
  await insertBatch('documents', docItems);

  // 11. Room Occupancy (10 suites)
  const suites = [
    { name: 'Penthouse Suite 01', wing: 'North Wing', capacity: 4, status: 'Occupied', guest: 'Alexander Thorne', check_out: dateOffset(4), housekeeping: 'Inspected', amenities: 'Private Terrace · Smart HVAC' },
    { name: 'Villa Aurelia', wing: 'Garden Courtyard', capacity: 6, status: 'Occupied', guest: 'Amara Mensah', check_out: dateOffset(6), housekeeping: 'Inspected', amenities: 'Private Pool · Full Kitchen' },
    { name: 'Suite 204', wing: 'East Wing', capacity: 2, status: 'Occupied', guest: 'Jean-Luc Moreau', check_out: dateOffset(3), housekeeping: 'In Service', amenities: 'Workspace · Fiber 1Gbps' },
    { name: 'Garden Residence 03', wing: 'Garden Courtyard', capacity: 3, status: 'Reserved', guest: 'Henrik Lindqvist', check_out: 'Arrives Tomorrow', housekeeping: 'Inspected', amenities: 'Patio · Quiet Zone' },
    { name: 'Executive Loft 12', wing: 'Main Residence', capacity: 2, status: 'Available', guest: null, check_out: 'Ready Now', housekeeping: 'Inspected', amenities: 'Balcony · Espresso Bar' },
    { name: 'Clubhouse Suite', wing: 'Clubhouse', capacity: 2, status: 'Available', guest: null, check_out: 'Ready Now', housekeeping: 'Turnaround', amenities: 'Pool Access · Concierge' },
    { name: 'Courtyard Studio 04', wing: 'East Wing', capacity: 2, status: 'Maintenance', guest: null, check_out: 'HVAC Calibration', housekeeping: 'Hold', amenities: 'Ground Floor · Step-Free' },
    { name: 'Ambassador Suite 02', wing: 'North Wing', capacity: 4, status: 'Available', guest: null, check_out: 'Ready Now', housekeeping: 'Inspected', amenities: 'Dining Lounge · Dual Bath' },
    { name: 'Garden Villa 05', wing: 'Garden Courtyard', capacity: 5, status: 'Reserved', guest: 'Maya Patel', check_out: dateOffset(9), housekeeping: 'Inspected', amenities: 'Garden Patio · Kitchenette' },
    { name: 'Suite 108', wing: 'Main Residence', capacity: 2, status: 'Available', guest: null, check_out: 'Ready Now', housekeeping: 'Inspected', amenities: 'High-Speed Wi-Fi · Desk' }
  ];
  await insertBatch('room_occupancy', suites);

  // 12. Community Events (8 rows)
  await insertBatch('community_events', [
    { title: 'Quarterly Community Town Hall & Budget Review', category: 'Community Meeting', date: dateOffset(5), time: '17:30', location: 'Main Clubhouse Hall', attendees: 34, pinned: true, description: 'Review community maintenance budget, guest house occupancy, and upcoming security upgrades.' },
    { title: 'Solar Microgrid & Water Filtration Inspection', category: 'Maintenance Notice', date: dateOffset(7), time: '09:00 - 11:30', location: 'All Residences & Guest Wing', attendees: 18, pinned: true, description: 'Preventive engineering check. Zero power interruption expected.' },
    { title: 'Visiting Fellows & Residents Welcome Reception', category: 'Social & Hospitality', date: dateOffset(10), time: '18:30', location: 'Courtyard Terrace', attendees: 27, pinned: false, description: 'Evening refreshments welcoming visiting guests and new community residents.' },
    { title: 'Community Fire & Safety Drill', category: 'Maintenance Notice', date: dateOffset(14), time: '10:00', location: 'All Wings & Gatehouse', attendees: 42, pinned: false, description: 'Annual 20-minute evacuation and muster point verification.' },
    { title: 'Weekend Courtyard Farmers & Artisan Market', category: 'Social & Hospitality', date: dateOffset(18), time: '08:30 - 13:00', location: 'Main Courtyard', attendees: 51, pinned: false, description: 'Local produce, coffee, and crafts for residents and guest house visitors.' }
  ]);

  // 13. Support Tickets & Replies
  if (conciergeId && adminId) {
    const ticketRows = [
      { created_by: conciergeId, created_by_name: 'Elena Rostova', created_by_email: 'concierge@pavilion-ops.com', category: 'Guest House Maintenance', subject: 'Suite 204 Smart Lock Battery Low Alert', description: 'Biometric lock is flashing amber; needs battery pack swap before next check-in.', status: 'In Progress', priority: 'High' },
      { created_by: facilitiesId || conciergeId, created_by_name: 'Kwame Boateng', created_by_email: 'facilities@pavilion-ops.com', category: 'Office Maintenance', subject: 'Clubhouse Projector HDMI Matrix Replacement', description: 'Signal drops intermittently during community town hall presentations.', status: 'Open', priority: 'Normal' },
      { created_by: conciergeId, created_by_name: 'Elena Rostova', created_by_email: 'concierge@pavilion-ops.com', category: 'Guest List', subject: 'Early Check-In Request for Villa Aurelia', description: 'Guest flight arrives at 07:30; requesting housekeeping priority.', status: 'Closed', priority: 'Normal', closed_by: adminId, closed_at: new Date().toISOString() }
    ];
    const { data: insertedTickets, error: tErr } = await supabase.from('tickets').insert(ticketRows).select();
    if (!tErr && insertedTickets?.length) {
      console.log(`Seeded ${insertedTickets.length} tickets`);
      await supabase.from('ticket_replies').insert({
        ticket_id: insertedTickets[0].id,
        author_id: adminId,
        author_name: 'Marcus Vance',
        author_role: 'admin',
        message: 'Technician assigned and battery pack dispatched to Guest House reception.'
      });
    }
  }

  // 14. Activity Logs (12 rows)
  if (adminId || superAdminId) {
    const actorId = adminId || superAdminId;
    await insertBatch('activity_logs', [
      { user_id: actorId, user_name: 'Marcus Vance', action: 'Created', module_name: 'Guest List', record_affected: 'Alexander Thorne — Penthouse Suite 01' },
      { user_id: actorId, user_name: 'Marcus Vance', action: 'Edited', module_name: 'Office Bill Payments', record_affected: 'ECG Commercial Power (CHQ-8800)' },
      { user_id: actorId, user_name: 'Amara Mensah', action: 'Created', module_name: 'Guest House Inventory', record_affected: 'Egyptian Cotton 800TC Linen Sets' },
      { user_id: actorId, user_name: 'Elena Rostova', action: 'Created', module_name: 'Guest House Maintenance', record_affected: 'Smart thermostat calibration' },
      { user_id: actorId, user_name: 'Kwame Boateng', action: 'Edited', module_name: 'Office Maintenance', record_affected: 'Boardroom AV acoustic calibration' },
      { user_id: actorId, user_name: 'Marcus Vance', action: 'Created', module_name: 'Vehicles Maintenance', record_affected: 'Mercedes V-Class Community Shuttle' }
    ]);
  }

  console.log('\nAll data seeded successfully!');
  console.log('--- Account Credentials ---');
  USERS.forEach(u => console.log(`${u.role.padEnd(12)} | ${u.email.padEnd(30)} | ${u.password}`));
}

seedAllData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
