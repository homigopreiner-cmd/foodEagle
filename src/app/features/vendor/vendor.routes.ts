import { Routes } from '@angular/router';
import { vendorGuard } from '../../core/guards/role.guard';
import { VendorShellComponent } from './vendor.shell';

/**
 * Restaurant / Vendor app — one route tree, one guard, lazy pages.
 *
 * Every route sits behind vendorGuard, so a shopper wandering into
 * /vendor/orders is bounced back to their own dashboard instead of seeing
 * the kitchen console.
 */
export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    component: VendorShellComponent,
    canActivate: [vendorGuard],
    children: [
      {
        path: '',
        title: 'Vendor · Home',
        loadComponent: () =>
          import('./pages/vendor-home/vendor-home.page').then(m => m.VendorHomePage),
      },
      {
        path: 'orders',
        title: 'Vendor · Orders',
        loadComponent: () =>
          import('./pages/vendor-orders/vendor-orders.page').then(m => m.VendorOrdersPage),
      },
      {
        path: 'menu',
        title: 'Vendor · Menu',
        loadComponent: () =>
          import('./pages/vendor-menu/vendor-menu.page').then(m => m.VendorMenuPage),
      },
      {
        path: 'store',
        title: 'Vendor · Store',
        loadComponent: () =>
          import('./pages/vendor-store/vendor-store.page').then(m => m.VendorStorePage),
      },
      {
        path: 'earnings',
        title: 'Vendor · Earnings',
        loadComponent: () =>
          import('./pages/vendor-earnings/vendor-earnings.page').then(m => m.VendorEarningsPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];