import { Routes } from '@angular/router';
import { riderGuard } from '../../core/guards/role.guard';
import { RiderShellComponent } from './rider.shell';

/**
 * Delivery Rider app — guarded like the vendor console: only riders (and
 * admins verifying the flow) can reach it, everyone else is sent home.
 */
export const RIDER_ROUTES: Routes = [
  {
    path: '',
    component: RiderShellComponent,
    canActivate: [riderGuard],
    children: [
      {
        path: '',
        title: 'Rider · Today',
        loadComponent: () =>
          import('./pages/rider-home/rider-home.page').then(m => m.RiderHomePage),
      },
      {
        path: 'deliveries',
        title: 'Rider · Deliveries',
        loadComponent: () =>
          import('./pages/rider-deliveries/rider-deliveries.page').then(m => m.RiderDeliveriesPage),
      },
      {
        path: 'earnings',
        title: 'Rider · Earnings',
        loadComponent: () =>
          import('./pages/rider-earnings/rider-earnings.page').then(m => m.RiderEarningsPage),
      },
      {
        path: 'profile',
        title: 'Rider · Profile',
        loadComponent: () =>
          import('./pages/rider-profile/rider-profile.page').then(m => m.RiderProfilePage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];