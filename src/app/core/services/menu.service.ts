import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { VendorService } from './vendor.service';
import {
  FoodCategory,
  MenuItem,
  DEFAULT_DELIVERY_FEE,
} from '../models/platform.model';

/**
 * MenuService — the single source of truth for everything on sale.
 *
 * The customer app, the vendor app and the admin panel all read from this
 * one catalogue. That is the whole trick behind a two-sided marketplace:
 * when a vendor toggles availability in the Vendor app, the customer's
 * dashboard changes on the next refresh because there is only one array.
 *
 * Storage: fe_menu = { [vendorId]: MenuItem[] } (items stay grouped by
 * store so a vendor can never accidentally edit someone else's menu).
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private menu: Record<string, MenuItem[]> = {};
  private readyPromise: Promise<void> | null = null;

  /** Fires whenever the catalogue changes, so views can re-read it. */
  private readonly changesSubject = new BehaviorSubject<void>(undefined);
  readonly changes$ = this.changesSubject.asObservable();

  constructor(
    private db: DatabaseService,
    private vendors: VendorService
  ) {}

  ready(): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load();
    return this.readyPromise;
  }

  private async load(): Promise<void> {
    await this.db.ready();
    this.menu = await this.db.getJson<Record<string, MenuItem[]>>(this.db.menuKey(), {});
    for (const key of Object.keys(this.menu)) {
      if (!Array.isArray(this.menu[key])) delete this.menu[key];
    }
  }

  private async persist(): Promise<void> {
    await this.db.setJson(this.db.menuKey(), this.menu);
    this.changesSubject.next();
  }

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  /** Every item across every store — the customer catalogue. */
  async all(): Promise<MenuItem[]> {
    await this.ready();
    return Object.values(this.menu).flat();
  }

  async byVendor(vendorId: string): Promise<MenuItem[]> {
    await this.ready();
    return [...(this.menu[vendorId] ?? [])];
  }

  /** Map of vendorId -> store name so catalogue rows can name their kitchen. */
  async vendorNames(): Promise<Record<string, string>> {
    const stores = await this.vendors.all();
    return stores.reduce<Record<string, string>>((map, store) => {
      map[store.id] = store.name;
      return map;
    }, {});
  }

  async findById(itemId: string): Promise<MenuItem | null> {
    await this.ready();
    for (const items of Object.values(this.menu)) {
      const hit = items.find(i => i.id === itemId);
      if (hit) return hit;
    }
    return null;
  }

  /** Items eligible to be bought: only from approved, accepting stores. */
  async availableFor(approvedVendorIds: string[]): Promise<MenuItem[]> {
    const items = await this.all();
    return items.filter(
      i => i.available && approvedVendorIds.includes(i.vendorId)
    );
  }

  static readonly CATEGORIES: readonly FoodCategory[] =
    ['meals', 'snacks', 'drinks', 'desserts', 'popular'];

  // ------------------------------------------------------------------
  // Writes (vendor app)
  // ------------------------------------------------------------------

  async add(vendorId: string, input: {
    title: string;
    subtitle?: string;
    description?: string;
    price: number;
    category: FoodCategory[];
    imageUrl?: string;
  }): Promise<MenuItem> {
    await this.ready();
    const now = new Date().toISOString();
    const item: MenuItem = {
      id: `it_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      vendorId,
      title: input.title.trim(),
      subtitle: (input.subtitle ?? '').trim(),
      description: (input.description ?? '').trim(),
      price: Math.max(0, Number(input.price) || 0),
      rating: 4.8,
      reviews: 0,
      distance: '0.5 km',
      category: input.category.length ? input.category : ['meals'],
      imageUrl: input.imageUrl?.trim() || 'assets/images/street food.jpg',
      available: true,
      createdAt: now,
      updatedAt: now,
    };
    this.menu[vendorId] = [item, ...(this.menu[vendorId] ?? [])];
    await this.persist();
    return item;
  }

  async update(itemId: string, patch: Partial<
    Pick<MenuItem, 'title' | 'subtitle' | 'description' | 'price' | 'category' | 'imageUrl' | 'available'>
  >): Promise<MenuItem | null> {
    await this.ready();
    for (const items of Object.values(this.menu)) {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) continue;
      const next: MenuItem = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
      if (typeof patch.price === 'number') next.price = Math.max(0, patch.price);
      items[idx] = next;
      await this.persist();
      return next;
    }
    return null;
  }

  async remove(itemId: string): Promise<boolean> {
    await this.ready();
    for (const items of Object.values(this.menu)) {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) continue;
      items.splice(idx, 1);
      await this.persist();
      return true;
    }
    return false;
  }

  async toggleAvailable(itemId: string): Promise<boolean | null> {
    const item = await this.findById(itemId);
    if (!item) return null;
    const updated = await this.update(itemId, { available: !item.available });
    return updated?.available ?? null;
  }

  /** Wipes and re-seeds a store's menu (used on first run). */
  async seedVendor(vendorId: string, items: Omit<MenuItem, 'vendorId'>[]): Promise<void> {
    await this.ready();
    this.menu[vendorId] = items.map(i => ({ ...i, vendorId }));
    await this.persist();
  }

  async seedIfEmpty(records: MenuItem[]): Promise<void> {
    await this.ready();
    if (Object.keys(this.menu).length > 0) return;
    for (const item of records) {
      (this.menu[item.vendorId] ??= []).push(item);
    }
    await this.persist();
  }

  /**
   * Merges the seed catalogue into an install that may already have one.
   *
   * The old first-run flag meant that once an install had seeded, it never
   * saw the seed file again — so adding dishes to this file changed nothing
   * for anyone who had already opened the app. This runs on every launch and
   * is idempotent:
   *
   *   • a dish that does not exist yet in its store's menu is added;
   *   • a dish that exists keeps everything a vendor may have edited
   *     (price, availability, image) EXCEPT its description, which is
   *     upgraded when the seed carries a longer long-form copy — that is
   *     how older installs receive the food-details descriptions.
   *
   * Matching is by (vendorId, title) so the catalogue stays stable across
   * id changes and duplicated titles can never collide across stores.
   */
  async mergeSeed(records: MenuItem[]): Promise<void> {
    await this.ready();
    const normalize = (title: string) => title.trim().toLowerCase();
    let changed = false;

    for (const rec of records) {
      const group = this.menu[rec.vendorId];
      if (!group) {
        this.menu[rec.vendorId] = [{ ...rec }];
        changed = true;
        continue;
      }

      const idx = group.findIndex(i => normalize(i.title) === normalize(rec.title));
      if (idx === -1) {
        // Guard against a duplicate id inside the same store (the original
        // seed shipped two different dishes both numbered "1").
        const idTaken = group.some(i => i.id === rec.id);
        group.push({ ...rec, id: idTaken ? `${rec.id}_${rec.vendorId}` : rec.id });
        changed = true;
        continue;
      }

      const existing = group[idx];
      const needsLongerDescription =
        rec.description.length > existing.description.length + 20;
      const needsUniqueLocalId =
        rec.id !== existing.id && !group.some(i => i.id === rec.id);

      if (needsLongerDescription || needsUniqueLocalId) {
        group[idx] = {
          ...existing,
          description: needsLongerDescription ? rec.description : existing.description,
          id: needsUniqueLocalId ? rec.id : existing.id,
          updatedAt: new Date().toISOString(),
        };
        changed = true;
      }
    }

    if (changed) await this.persist();
  }

  get deliveryFee(): number {
    return DEFAULT_DELIVERY_FEE;
  }
}