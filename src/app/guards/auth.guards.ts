import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guards that keep the app's flow airtight:
 *  - authGuard:  protected pages require a signed-in user.
 *  - guestGuard: auth screens (login/signup/otp) bounce to the dashboard
 *                when a session already exists.
 *
 * Both wait for the database + session restore to finish first, so a slow
 * device can never flash the wrong screen.
 */

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();
  if (auth.isAuthenticated) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();
  if (!auth.isAuthenticated) return true;
  return router.createUrlTree(['/dashboard']);
};
