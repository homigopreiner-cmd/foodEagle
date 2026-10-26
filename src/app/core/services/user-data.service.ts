import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';

/**
 * UserDataService — the per-user "row" in the database.
 *
 * Every signed-in user gets one document (fe_user_data:{userId}) holding
 * their delivery location, saved addresses, favorites, notification
 * preferences and recent searches. The document is loaded on login /
 * session-restore and every mutation is written back immediately, so
 * everything a user does survives restarts, logouts and logins.
 */

export interface DeliveryLocation {
  building: string;
  landmark: string;
  savedAt: string;
}

export interface SavedAddress {
  id: string;
  building: string;
  landmark: string;
  savedAt: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  restaurant: string;
  vendorKey: string;
  price: number;
  rating: number;
  image: string;
  category?: string;
}

export interface NotificationPrefs {
  push: boolean;
  email: boolean;
  sms: boolean;
  orderUpdates: boolean;
  promos: boolean;
  quietHours: boolean;
}

export interface UserDoc {
  location: DeliveryLocation | null;
  addresses: SavedAddress[];
  favorites: FavoriteItem[];
  notificationPrefs: NotificationPrefs;
  recentSearches: string[];
}

const MAX_ADDRESSES = 5;
const MAX_RECENT_SEARCHES = 8;

const DEFAULT_PREFS: NotificationPrefs = {
  push: true,
  email: false,
  sms: true,
  orderUpdates: true,
  promos: false,
  quietHours: false,
};

function emptyDoc(): UserDoc {
  return {
    location: null,
    addresses: [],
    favorites: [],
    notificationPrefs: { ...DEFAULT_PREFS },
    recentSearches: [],
  };
}

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private doc: UserDoc = emptyDoc();
  private loadedUserId: string | null = null;

  readonly doc$ = new BehaviorSubject<UserDoc>(emptyDoc());

  constructor(
    private db: DatabaseService,
    private auth: AuthService
  ) {
    // The document always follows the signed-in account — this covers
    // every login path (login page, signups, session restore).
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        void this.loadForUser(user.id);
      } else {
        void this.unload();
      }
    });
  }

  get userId(): string | null {
    return this.loadedUserId;
  }

  get current(): UserDoc {
    return this.doc;
  }

  // ------------------------------------------------------------------
  // Load / unload (called by auth flows)
  // ------------------------------------------------------------------

  async loadForUser(userId: string): Promise<void> {
    await this.db.ready();
    if (this.loadedUserId === userId) return;
    const stored = await this.db.getJson<Partial<UserDoc> | null>(this.db.keyForUserData(userId), null);
    this.doc = this.normalizeDoc(stored);
    this.loadedUserId = userId;
    this.emit();
  }

  async unload(): Promise<void> {
    this.doc = emptyDoc();
    this.loadedUserId = null;
    this.emit();
  }

  private normalizeDoc(raw: Partial<UserDoc> | null): UserDoc {
    const doc = emptyDoc();
    if (!raw) return doc;

    if (raw.location && typeof raw.location === 'object') {
      doc.location = {
        building: String(raw.location.building ?? 'CICS'),
        landmark: String(raw.location.landmark ?? 'Near main entrance'),
        savedAt: String(raw.location.savedAt ?? new Date().toISOString()),
      };
    }
    if (Array.isArray(raw.addresses)) {
      doc.addresses = raw.addresses
        .filter(a => a && typeof a === 'object')
        .map(a => ({
          id: String(a.id ?? `${Date.now()}`),
          building: String(a.building ?? 'CICS'),
          landmark: String(a.landmark ?? ''),
          savedAt: String(a.savedAt ?? new Date().toISOString()),
        }));
    }
    if (Array.isArray(raw.favorites)) {
      doc.favorites = raw.favorites.filter(f => f && typeof f === 'object' && f.id);
    }
    if (raw.notificationPrefs && typeof raw.notificationPrefs === 'object') {
      doc.notificationPrefs = { ...DEFAULT_PREFS, ...raw.notificationPrefs };
    }
    if (Array.isArray(raw.recentSearches)) {
      doc.recentSearches = raw.recentSearches
        .filter((s): s is string => typeof s === 'string')
        .slice(0, MAX_RECENT_SEARCHES);
    }
    return doc;
  }

  private emit(): void {
    this.doc$.next({ ...this.doc });
  }

  private async persist(): Promise<void> {
    if (!this.loadedUserId) return;
    await this.db.setJson(this.db.keyForUserData(this.loadedUserId), this.doc);
    this.emit();
  }

  // ------------------------------------------------------------------
  // Delivery location
  // ------------------------------------------------------------------

  async setLocation(building: string, landmark: string): Promise<void> {
    this.doc.location = {
      building: building || 'CICS',
      landmark: landmark?.trim() || 'Near main entrance',
      savedAt: new Date().toISOString(),
    };
    await this.persist();
  }

  // ------------------------------------------------------------------
  // Saved addresses
  // ------------------------------------------------------------------

  async upsertAddress(building: string, landmark: string): Promise<void> {
    const savedAt = new Date().toISOString();
    const idx = this.doc.addresses.findIndex(a => a.building === building && a.landmark === landmark);
    if (idx > -1) {
      const [item] = this.doc.addresses.splice(idx, 1);
      this.doc.addresses.unshift({ ...item, savedAt });
    } else {
      this.doc.addresses.unshift({
        id: `addr_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        building,
        landmark,
        savedAt,
      });
      if (this.doc.addresses.length > MAX_ADDRESSES) {
        this.doc.addresses.length = MAX_ADDRESSES;
      }
    }
    await this.persist();
  }

  async removeAddress(id: string): Promise<void> {
    this.doc.addresses = this.doc.addresses.filter(a => a.id !== id);
    await this.persist();
  }

  // ------------------------------------------------------------------
  // Favorites (favorites page items + dashboard dish hearts)
  // ------------------------------------------------------------------

  async toggleFavorite(item: FavoriteItem): Promise<boolean> {
    const idx = this.doc.favorites.findIndex(f => f.id === item.id);
    if (idx > -1) {
      this.doc.favorites.splice(idx, 1);
      await this.persist();
      return false;
    }
    this.doc.favorites.unshift({ ...item });
    await this.persist();
    return true;
  }

  isFavorite(id: string): boolean {
    return this.doc.favorites.some(f => f.id === id);
  }

  // ------------------------------------------------------------------
  // Recent searches
  // ------------------------------------------------------------------

  async commitRecentSearch(term: string): Promise<void> {
    const t = term.trim();
    if (t.length < 2) return;
    const lower = t.toLowerCase();
    this.doc.recentSearches = [
      t,
      ...this.doc.recentSearches.filter(s => {
        const l = s.toLowerCase();
        return l !== lower && !lower.startsWith(l);
      }),
    ].slice(0, MAX_RECENT_SEARCHES);
    await this.persist();
  }

  async removeRecentSearch(term: string): Promise<void> {
    this.doc.recentSearches = this.doc.recentSearches.filter(s => s !== term);
    await this.persist();
  }

  async clearRecentSearches(): Promise<void> {
    this.doc.recentSearches = [];
    await this.persist();
  }

  // ------------------------------------------------------------------
  // Notification preferences
  // ------------------------------------------------------------------

  async setNotificationPrefs(patch: Partial<NotificationPrefs>): Promise<void> {
    this.doc.notificationPrefs = { ...this.doc.notificationPrefs, ...patch };
    await this.persist();
  }
}
