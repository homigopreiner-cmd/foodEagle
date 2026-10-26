import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guards';
import { customerGuard } from './core/guards/role.guard';

/**
 * The product is now four apps behind one router, split by URL namespace:
 *
 *   /vendor/**  Restaurant / Vendor app      (vendorGuard)
 *   /rider/**   Delivery Rider app           (riderGuard)
 *   /admin/**   Admin web dashboard          (adminGuard)
 *   everything  Customer app                 (customerGuard / guestGuard)
 *
 * Each subtree lazy-loads its own route file, so a shopper never downloads
 * the kitchen console, and the guards (core/guards/role.guard.ts) are the
 * single place that decides who may enter which one.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },

  // --- PUBLIC / ONBOARDING -------------------------------------------
  {
    path: 'splash',
    title: 'Food Eagle',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'walkthrough',
    title: 'Food Eagle · Welcome',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/walkthrough/walkthrough.page').then(m => m.WalkthroughPage)
  },
  {
    path: 'login',
    title: 'Food Eagle · Log in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'create-account',
    title: 'Food Eagle · Create account',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/create-account/create-account.page').then(m => m.CreateAccountPage)
  },
  {
    path: 'google-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/google-signup/google-signup.page').then(m => m.GoogleSignupPage)
  },
  {
    path: 'facebook-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/facebook-signup/facebook-signup.page').then(m => m.FacebookSignupPage)
  },
  {
    path: 'tiktok-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/tiktok-signup/tiktok-signup.page').then(m => m.TiktokSignupPage)
  },
  {
    path: 'otp',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/otp/otp.page').then(m => m.OtpPage)
  },
  {
    path: 'forgot-password',
    title: 'Food Eagle · Reset password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/customer/pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },

  // --- CUSTOMER APP ---------------------------------------------------
  {
    path: 'location-setup',
    title: 'Food Eagle · Delivery location',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/location-setup/location-setup.page').then(m => m.LocationSetupPage)
  },
  {
    path: 'categories',
    title: 'Food Eagle · Categories',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/categories/categories.page').then(m => m.CategoriesPage)
  },
  {
    path: 'items',
    title: 'Food Eagle · Menu',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/items/items.page').then(m => m.ItemsPage)
  },
  {
    path: 'cart',
    title: 'Food Eagle · Cart',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/cart/cart.page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    title: 'Food Eagle · Checkout',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/checkout/checkout.page').then(m => m.CheckoutPage)
  },
  {
    path: 'order-success',
    title: 'Food Eagle · Order placed',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/order-success/order-success.page').then(m => m.OrderSuccessPage)
  },
  {
    path: 'restaurant-detail',
    title: 'Food Eagle · Store',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/restaurant-detail/restaurant-detail.page').then(m => m.RestaurantDetailPage)
  },
  {
    path: 'dashboard',
    title: 'Food Eagle · Home',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'profile-hub',
    title: 'Food Eagle · Profile',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/profile-hub/profile-hub.page').then(m => m.ProfileHubPage)
  },
  {
    path: 'search',
    title: 'Food Eagle · Search',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/search/search.page').then(m => m.SearchPage)
  },
  {
    path: 'orders',
    title: 'Food Eagle · Orders',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/tracking-and-delivery/tracking-and-delivery.page').then(m => m.TrackingAndDeliveryPage)
  },
  {
    path: 'favorites',
    title: 'Food Eagle · Favorites',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/favorites/favorites.page').then(m => m.FavoritesPage)
  },
  {
    path: 'notification-center',
    title: 'Food Eagle · Notifications',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/notification-center/notification-center.page').then(m => m.NotificationCenterPage)
  },
  {
    path: 'help-center',
    title: 'Food Eagle · Help',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/help-center/help-center.page').then(m => m.HelpCenterPage)
  },
  {
    path: 'saved-addresses',
    title: 'Food Eagle · Addresses',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/saved-addresses/saved-addresses.page').then(m => m.SavedAddressesPage)
  },
  {
    path: 'security',
    title: 'Food Eagle · Security',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/pages/security/security.page').then(m => m.SecurityPage)
  },

  // --- RESTAURANT / VENDOR APP ---------------------------------------
  {
    path: 'vendor',
    loadChildren: () => import('./features/vendor/vendor.routes').then(m => m.VENDOR_ROUTES)
  },

  // --- DELIVERY RIDER APP --------------------------------------------
  {
    path: 'rider',
    loadChildren: () => import('./features/rider/rider.routes').then(m => m.RIDER_ROUTES)
  },

  // --- ADMIN PANEL (WEB DASHBOARD) -----------------------------------
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: 'dashboard' }
];