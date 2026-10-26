import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { VendorProfile } from '../models/platform.model';

/**
 * VendorService — store profiles shared by every app.
 *
 *   customer -> sees only approved, open stores
 *   vendor    -> edits the stores it owns, pauses them, claims new ones
 *   admin     -> approves / suspends any store
 *
 * Storage: fe_vendors = VendorProfile[]
 */
@Injectable({ providedIn: 'root' })
export class VendorService {
  private stores: VendorProfile[] = [];
  private readonly subject = new BehaviorSubject<VendorProfile[]>([]);
  /** Emits the live store list — every dashboard subscribes to this. */
  readonly stores$ = this.subject.asObservable();

  private readonly activeSubject = new BehaviorSubject<string | null>(null);
  /** Emits the id of the outlet currently open in the vendor app. */
  readonly activeStoreId$ = this.activeSubject.asObservable();

  private readyPromise: Promise<void> | null = null;

  constructor(
    private db: DatabaseService,
    private auth: AuthService
  ) {}

  ready(): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load();
    return this.readyPromise;
  }

  private async load(): Promise<void> {
    await this.db.ready();
    const stored = await this.db.getJson<VendorProfile[] | null>(this.db.vendorsKey(), null);

    if (stored && Array.isArray(stored) && stored.length) {
      this.stores = stored;
    } else {
      this.stores = VendorService.seedStores();
      awaitingAuth: {
        await this.auth.whenReady();
        // Link the seeded staff account so the vendor app has an owner.
        const staff = await this.auth.findUser(VendorService.STAFF_ACCOUNT);
        if (staff) this.stores.forEach(s => (s.ownerIdentifier ||= staff.identifier));
      }
      await this.db.setJson(this.db.vendorsKey(), this.stores);
      console.info('[Vendor] Seeded three campus stores.');
    }

    // Later runs: heal any store that lost its owner (fresh install of the
    // seeded staff account, restored backup, ...).
    await this.grantOrphanStores();
    this.subject.next([...this.stores]);
  }

  /** The account created by AuthService.seedPartnerAccounts(). */
  static readonly STAFF_ACCOUNT = 'vendor.foodeagle@gmail.com';

  private async grantOrphanStores(): Promise<void> {
    if (this.stores.every(s => s.ownerIdentifier)) return;
    await this.auth.whenReady();
    const staff = await this.auth.findUser(VendorService.STAFF_ACCOUNT);
    if (!staff) return;
    let changed = false;
    for (const store of this.stores) {
      if (!store.ownerIdentifier) {
        store.ownerIdentifier = staff.identifier;
        changed = true;
      }
    }
    if (changed) await this.persist();
  }

  // ------------------------------------------------------------------
  // Active store (the outlet currently open in the vendor app)
  // ------------------------------------------------------------------

  get activeStoreId(): string | null {
    return this.activeSubject.value;
  }

  setActiveStore(id: string): void {
    this.activeSubject.next(id);
  }

  /** First store owned by a staff account, used to pick an initial outlet. */
  async firstOwned(identifier: string): Promise<VendorProfile | null> {
    const owned = await this.ownedBy(identifier);
    if (!owned.length) return null;
    const current = owned.find(s => s.id === this.activeStoreId) ?? owned[0];
    this.activeSubject.next(current.id);
    return current;
  }

  private async persist(): Promise<void> {
    await this.db.setJson(this.db.vendorsKey(), this.stores);
    this.subject.next([...this.stores]);
  }

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  async all(): Promise<VendorProfile[]> {
    await this.ready();
    return [...this.stores];
  }

  /** Stores a shopper is allowed to browse. */
  async customerVisible(): Promise<VendorProfile[]> {
    const all = await this.all();
    return all.filter(s => s.approved && s.acceptingOrders);
  }

  async findById(vendorId: string): Promise<VendorProfile | null> {
    await this.ready();
    return this.stores.find(s => s.id === vendorId) ?? null;
  }

  /** Store this staff account is allowed to run. */
  async ownedBy(identifier: string): Promise<VendorProfile[]> {
    const all = await this.all();
    return all.filter(s => s.ownerIdentifier === identifier);
  }

  /** Pairs the signed-in vendor with a store on every app load. */
  async resolveActive(identifier: string): Promise<VendorProfile | null> {
    const owned = await this.ownedBy(identifier);
    if (!owned.length) return this.firstUnclaimed() ?? null;
    const current = owned.find(s => s.id === this.activeStoreId) ?? owned[0];
    this.activeSubject.next(current.id);
    return current;
  }

  /** Best-effort fallback when a partner account owns nothing yet. */
  async firstUnclaimed(): Promise<VendorProfile | null> {
    const all = await this.all();
    return all.find(s => !s.ownerIdentifier) ?? null;
  }

  async ownedStores(identifier: string): Promise<VendorProfile[]> {
    return this.ownedBy(identifier);
  }

  // ------------------------------------------------------------------
  // Writes (vendor app)
  // ------------------------------------------------------------------

  async updateStore(vendorId: string, patch: Partial<VendorProfile>): Promise<VendorProfile | null> {
    await this.ready();
    const idx = this.stores.findIndex(s => s.id === vendorId);
    if (idx === -1) return null;
    const next = { ...this.stores[idx], ...patch, id: vendorId };
    this.stores[idx] = next;
    await this.persist();
    return next;
  }

  async toggleAccepting(vendorId: string): Promise<boolean> {
    const store = await this.findById(vendorId);
    if (!store) return false;
    await this.updateStore(vendorId, { acceptingOrders: !store.acceptingOrders });
    return !store.acceptingOrders;
  }

  /** Admin moderation. */
  async setApproved(vendorId: string, approved: boolean): Promise<void> {
    await this.updateStore(vendorId, { approved });
  }

  /** Transfer ownership when a partner account signs up for a store. */
  async claim(vendorId: string, identifier: string): Promise<void> {
    await this.updateStore(vendorId, { ownerIdentifier: identifier, approved: true });
  }

  // ------------------------------------------------------------------
  // First-run seed
  // ------------------------------------------------------------------

  static seedStores(): VendorProfile[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'red-eagle-nook',
        slug: 'red-eagle-nook',
        name: 'The Red Eagle Nook',
        tagline: 'Coffee, rice meals & comfort food',
        spot: 'Main Canteen',
        logoUrl: 'assets/images/food-eagle-logo1.png',
        heroUrl: 'assets/images/spanish-latte.jpe',
        hours: 'Mon–Sat 7:00 AM – 6:00 PM',
        prepTime: '5–10 min',
        rating: 4.7,
        reviews: 128,
        ownerIdentifier: null, // claimed by the seeded vendor account below
        approved: true,
        acceptingOrders: true,
        createdAt: now,
      },
      {
        id: 'yanfayes',
        slug: 'yanfayes',
        name: 'yanfayes',
        tagline: 'Ilocano grills & sizzling plates',
        spot: 'Food Court',
        logoUrl: 'assets/images/yanfayes.jpg',
        heroUrl: 'assets/images/dinakdakan.webp',
        hours: 'Mon–Sat 8:00 AM – 7:00 PM',
        prepTime: '10–15 min',
        rating: 4.8,
        reviews: 86,
        ownerIdentifier: null,
        approved: true,
        acceptingOrders: true,
        createdAt: now,
      },
      {
        id: 'ddk-corner',
        slug: 'ddk-corner',
        name: 'DDK Corner',
        tagline: 'Street snacks, sweets & cold drinks',
        spot: 'Student Center Food Hub',
        logoUrl: 'assets/images/ddk-corner.jpg',
        heroUrl: 'assets/images/street food.jpg',
        hours: 'Mon–Fri 7:30 AM – 5:00 PM',
        prepTime: '5–10 min',
        rating: 4.8,
        reviews: 42,
        ownerIdentifier: null,
        approved: true,
        acceptingOrders: true,
        createdAt: now,
      },
    ];
  }
}