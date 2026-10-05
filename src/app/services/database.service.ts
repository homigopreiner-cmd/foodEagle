import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * DatabaseService — the app's local "database".
 *
 * Backed by @capacitor/preferences, which persists reliably on
 * Web (IndexedDB/localStorage), Android (SharedPreferences) and
 * iOS (NSUserDefaults). All values are stored as JSON strings with
 * safe parse helpers, so every consumer works with typed objects.
 *
 * Tables (key layout):
 *   fe_users                     -> { [normalizedIdentifier]: UserRecord }
 *   fe_session                   -> { userId, loginAt }
 *   fe_user_data:{userId}        -> per-user document (location, addresses, favorites, orders, prefs...)
 *   fe_cart:{userId}             -> per-user shopping cart
 *
 * On first run it also migrates the app's old flat localStorage keys
 * (foodeagle_user_profile, savedDeliveryLocation, ...) into this schema
 * so existing users keep their data.
 */

const KEYS = {
  USERS: 'fe_users',
  SESSION: 'fe_session',
  userData: (userId: string) => `fe_user_data:${userId}`,
  cart: (userId: string) => `fe_cart:${userId}`,
};

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readyPromise: Promise<void> | null = null;
  private initDone = false;

  /** Runs the one-time bootstrap (legacy migration) exactly once. */
  ready(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = this.init();
    }
    return this.readyPromise;
  }

  private async init(): Promise<void> {
    if (this.initDone) return;
    this.initDone = true;
    await this.migrateLegacyData();
  }

  // ------------------------------------------------------------------
  // Generic JSON helpers
  // ------------------------------------------------------------------

  async getJson<T>(key: string, fallback: T): Promise<T> {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null || value === undefined) return fallback;
      return JSON.parse(value) as T;
    } catch (e) {
      console.error(`[DB] Failed to read "${key}"`, e);
      return fallback;
    }
  }

  async setJson(key: string, value: unknown): Promise<void> {
    try {
      await Preferences.set({ key, value: JSON.stringify(value) });
    } catch (e) {
      console.error(`[DB] Failed to write "${key}"`, e);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.error(`[DB] Failed to remove "${key}"`, e);
    }
  }

  usersKey(): string {
    return KEYS.USERS;
  }

  sessionKey(): string {
    return KEYS.SESSION;
  }

  keyForUserData(userId: string): string {
    return KEYS.userData(userId);
  }

  keyForCart(userId: string): string {
    return KEYS.cart(userId);
  }

  // ------------------------------------------------------------------
  // Legacy migration — pull the old flat localStorage keys into the DB
  // ------------------------------------------------------------------

  private async migrateLegacyData(): Promise<void> {
    try {
      const users = await this.getJson<Record<string, unknown>>(KEYS.USERS, {});
      if (Object.keys(users).length > 0) {
        return; // Database already initialized — nothing to migrate
      }

      const legacyProfileRaw = localStorage.getItem('foodeagle_user_profile');
      if (!legacyProfileRaw) return;

      const legacy = JSON.parse(legacyProfileRaw) as Record<string, unknown>;
      const contact = String(legacy['contact'] ?? '').trim();
      if (!contact) return;

      // Seed the users table with the legacy profile. The account is flagged
      // `legacy` so the user is asked to (re)set a password through
      // Forgot Password the first time they try to sign in.
      const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const identifier = contact.toLowerCase();

      const record = {
        id: userId,
        name: String(legacy['name'] ?? 'Food Eagle User'),
        identifier,
        email: String(legacy['email'] ?? ''),
        avatarUrl: legacy['avatarUrl'] ? String(legacy['avatarUrl']) : '',
        provider: 'local',
        legacy: true,
        passwordHash: '',
        passwordSalt: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.setJson(KEYS.USERS, { [identifier]: record });

      // Migrate the legacy delivery location + address history
      const location = localStorage.getItem('savedDeliveryLocation');
      const history = localStorage.getItem('foodEagleAddressHistory');
      let doc: Record<string, unknown> = {};
      if (location) {
        try {
          const parsed = JSON.parse(location) as { building?: string; details?: { landmark?: string } };
          doc['location'] = {
            building: parsed.building ?? 'CICS',
            landmark: parsed.details?.landmark ?? 'Near main entrance',
            savedAt: new Date().toISOString(),
          };
        } catch { /* ignore malformed */ }
      }
      if (history) {
        try { doc['addresses'] = JSON.parse(history); } catch { /* ignore malformed */ }
      }
      await this.setJson(KEYS.userData(userId), doc);

      // Migrate the legacy cart
      const cart = localStorage.getItem('foodeagle_cart');
      if (cart) {
        await this.setJson(KEYS.cart(userId), cart); // already JSON
      }

      // Clean up the legacy keys so migration never runs twice
      localStorage.removeItem('foodeagle_user_profile');
      localStorage.removeItem('savedDeliveryLocation');
      localStorage.removeItem('foodEagleAddressHistory');
      localStorage.removeItem('foodeagle_cart');
      localStorage.removeItem('favoriteFoodIds');
      localStorage.removeItem('currentDeliveryLocation');
      localStorage.removeItem('selectedLocation');
      localStorage.removeItem('deliveryZone');

      console.info('[DB] Legacy profile migrated into local database.');
    } catch (e) {
      console.error('[DB] Legacy migration failed', e);
    }
  }
}
