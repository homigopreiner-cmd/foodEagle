import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { MenuService } from './menu.service';
import { SEED_MENU_ITEMS } from './menu-seed';

/**
 * SeedService — first-run bootstrap, exactly once per installation.
 *
 * Stores, riders and the order ledger seed themselves when they load
 * (they are the things an empty platform needs to look alive). The menu is
 * seeded here instead so that the catalogue has a single, obvious place to
 * live: the legacy customer dishes are pushed into the shared MenuService,
 * after which the vendor app owns them.
 *
 * The flag is persisted, so this never overwrites anything a vendor has
 * since edited.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private promise: Promise<void> | null = null;

  constructor(
    private db: DatabaseService,
    private menu: MenuService
  ) {}

  ready(): Promise<void> {
    if (!this.promise) this.promise = this.run();
    return this.promise;
  }

  private async run(): Promise<void> {
    await this.db.ready();
    await this.menu.ready();

    const done = await this.db.getJson<boolean>(this.db.seedFlagKey(), false);
    if (!done) {
      await this.menu.seedIfEmpty(SEED_MENU_ITEMS);
      await this.db.setJson(this.db.seedFlagKey(), true);
      console.info('[Seed] Loaded the first-run catalogue into the shared menu.');
    }

    // The flag above only ever ran once, so an install never saw catalogue
    // changes made to this file afterwards. The merge is idempotent: it adds
    // dishes that are missing and refreshes short descriptions, while every
    // price/availability edit a vendor has made is left untouched.
    await this.menu.mergeSeed(SEED_MENU_ITEMS);
  }
}