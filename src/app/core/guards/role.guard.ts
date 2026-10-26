import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROLE_HOME, UserRole } from '../models/platform.model';

/**
 * roleGuard — the security boundary between the four apps.
 *
 * Routing is now split by account role:
 *   /vendor/**  -> vendor app
 *   /rider/**   -> rider app
 *   /admin/**   -> admin panel
 *   everything  -> customer app
 *
 * A customer who types /admin gets bounced to their own dashboard, and an
 * admin who types /dashboard gets bounced to the admin panel, so nobody
 * ever lands inside an app they cannot use. Rules live in one place and
 * are declarative in the route table.
 */
function makeGuard(allowed: readonly UserRole[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.whenReady();
    const role = auth.currentUser?.role;

    if (!role) return router.createUrlTree(['/login']);
    if (allowed.includes(role)) return true;
    return router.createUrlTree([ROLE_HOME[role]]);
  };
}

export const vendorGuard: CanActivateFn = makeGuard(['vendor', 'admin']);
export const riderGuard: CanActivateFn = makeGuard(['rider', 'admin']);
export const adminGuard: CanActivateFn = makeGuard(['admin']);
/** Signed-in customers only — vendors and riders are not shoppers here. */
export const customerGuard: CanActivateFn = makeGuard(['customer', 'admin']);