import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guards';

/**
 * Public + onboarding routes get guestGuard (bounces to /dashboard when a
 * session exists). Everything inside the app gets authGuard.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'walkthrough',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/walkthrough/walkthrough.page').then(m => m.WalkthroughPage)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'create-account',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/create-account/create-account.page').then(m => m.CreateAccountPage)
  },
  {
    path: 'google-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/google-signup/google-signup.page').then(m => m.GoogleSignupPage)
  },
  {
    path: 'facebook-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/facebook-signup/facebook-signup.page').then(m => m.FacebookSignupPage)
  },
  {
    path: 'tiktok-signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/tiktok-signup/tiktok-signup.page').then(m => m.TiktokSignupPage)
  },
  {
    path: 'otp',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/otp/otp.page').then(m => m.OtpPage)
  },
  {
    path: 'location-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/location-setup/location-setup.page').then(m => m.LocationSetupPage)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/categories/categories.page').then(m => m.CategoriesPage)
  },
  {
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/items/items.page').then(m => m.ItemsPage)
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage)
  },
  {
    path: 'order-success',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/order-success/order-success.page').then(m => m.OrderSuccessPage)
  },
  {
    path: 'restaurant-detail',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/restaurant-detail/restaurant-detail.page').then(m => m.RestaurantDetailPage)
  },

  // --- BOTTOM NAVIGATION CORE ROUTES ---
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'profile-hub',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile-hub/profile-hub.page').then(m => m.ProfileHubPage)
  },
  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tracking-and-delivery/tracking-and-delivery.page').then(m => m.TrackingAndDeliveryPage)
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/favorites/favorites.page').then(m => m.FavoritesPage)
  },

  // --- ADDITIONAL FEATURE PAGES ---
  {
    path: 'notification-center',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notification-center/notification-center.page').then(m => m.NotificationCenterPage)
  },
  {
    path: 'help-center',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/help-center/help-center.page').then(m => m.HelpCenterPage)
  },
  {
    path: 'saved-addresses',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/saved-addresses/saved-addresses.page').then(m => m.SavedAddressesPage)
  },
  {
    path: 'security',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/security/security.page').then(m => m.SecurityPage)
  }
];
