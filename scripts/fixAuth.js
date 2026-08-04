import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env to get the service role key
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const users = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', email: 'superadmin@mtaghana.org', password: 'SuperAdmin123!', name: 'Alhaj Mubarak Ahmad', role: 'super_admin' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'admin@mtaghana.org', password: 'Admin123!', name: 'Rashid Osei Boateng', role: 'admin' },
  { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', email: 'staff@mtaghana.org', password: 'Staff123!', name: 'Ibrahim Kwame Mensah', role: 'staff' }
];

async function fixUsers() {
  console.log("Starting user creation process...");
  
  for (const user of users) {
    console.log(`Processing ${user.email}...`);
    // Check if user exists
    const { data: { users: existingUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    let authUser = existingUsers?.find(u => u.email === user.email);
    
    if (!authUser) {
      console.log(`Creating auth user for ${user.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.name }
      });
      if (error) {
        console.error(`Failed to create auth user ${user.email}:`, error);
        continue;
      }
      authUser = data.user;
      console.log(`Auth user created: ${authUser.id}`);
    } else {
      console.log(`Auth user already exists. Updating password...`);
      await supabase.auth.admin.updateUserById(authUser.id, { password: user.password });
    }

    // Upsert into public.users
    console.log(`Upserting public.users record for ${user.email}...`);
    const { error: publicError } = await supabase.from('users').upsert({
      id: authUser.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: 'Active'
    });
    
    if (publicError) console.error(`Error upserting public user:`, publicError);
  }
  
  // Create staff permissions
  console.log("Creating staff permissions...");
  const staff = await supabase.from('users').select('id').eq('email', 'staff@mtaghana.org').single();
  if (staff.data) {
    const staffId = staff.data.id;
    const permissions = [
      { user_id: staffId, module_key: 'guest_list', can_view: true, can_add: true, can_edit: false, can_delete: false },
      { user_id: staffId, module_key: 'gh_maintenance', can_view: true, can_add: true, can_edit: true, can_delete: false },
      { user_id: staffId, module_key: 'gh_inventory', can_view: true, can_add: true, can_edit: true, can_delete: false },
      { user_id: staffId, module_key: 'office_bills', can_view: true, can_add: false, can_edit: false, can_delete: false },
      { user_id: staffId, module_key: 'office_assets', can_view: true, can_add: true, can_edit: false, can_delete: false },
      { user_id: staffId, module_key: 'office_maintenance', can_view: true, can_add: false, can_edit: false, can_delete: false },
    ];
    
    // Delete existing permissions for this user to avoid conflicts
    await supabase.from('user_permissions').delete().eq('user_id', staffId);
    
    const { error: permError } = await supabase.from('user_permissions').insert(permissions);
    if (permError) console.error(`Error inserting permissions:`, permError);
    else console.log("Permissions seeded successfully.");
  }
  
  console.log("Done.");
}

fixUsers();
