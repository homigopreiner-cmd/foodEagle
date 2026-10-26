import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/role.guard';
import { AdminShellComponent } from './admin.shell';

/**
 * Admin Panel — the web dashboard.
 *
 * Tightest guard on the platform: admins only. Vendors and riders are kept
 * out even though they are signed in, because oversight must not be
 * editable by the parties being overseen.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        title: 'Admin · Dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
      },
      {
        path: 'orders',
        title: 'Admin · Orders',
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders.page').then(m => m.AdminOrdersPage),
      },
      {
        path: 'stores',
        title: 'Admin · Stores',
        loadComponent: () =>
          import('./pages/admin-stores/admin-stores.page').then(m => m.AdminStoresPage),
      },
      {
        path: 'riders',
        title: 'Admin · Riders',
        loadComponent: () =>
          import('./pages/admin-riders/admin-riders.page').then(m => m.AdminRidersPage),
      },
      {
        path: 'users',
        title: 'Admin · Users',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.page').then(m => m.AdminUsersPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];