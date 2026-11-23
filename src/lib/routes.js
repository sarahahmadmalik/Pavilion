export const PAGE_TO_PATH = {
  dashboard: '/dashboard',
  analytics: '/analytics',
  room_occupancy: '/suites',
  guest_list: '/guests',
  gh_maintenance: '/gh-maintenance',
  gh_inventory: '/gh-inventory',
  office_bills: '/bills',
  vehicles_maintenance: '/fleet',
  office_maintenance: '/office-maintenance',
  projects: '/projects',
  community_events: '/events',
  vendors: '/vendors',
  staff_directory: '/staff',
  documents: '/documents',
  team_chat: '/chat',
  tickets: '/tickets',
  activity_log: '/activity-log',
  user_management: '/users',
  profile: '/profile'
};

const PATH_TO_PAGE = Object.entries(PAGE_TO_PATH).reduce((acc, [page, path]) => {
  acc[path] = page;
  return acc;
}, {});

export function getPathForPage(pageKey) {
  return PAGE_TO_PATH[pageKey] || '/dashboard';
}

export function getPageFromPath(pathname = '/') {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/index.html') return 'dashboard';
  return PATH_TO_PAGE[clean] || 'not_found';
}
