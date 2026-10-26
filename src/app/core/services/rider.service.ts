import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { RiderProfile } from '../models/platform.model';

/**
 * RiderService — the courier pool.
 *
 * `online` is the dispatch switch: a rider only counts as available when
 * they are online AND not already carrying an active delivery, which is
 * how pickup.assignment decides who may accept an order.
 *
 * Storage: fe_riders = RiderProfile[]
 */
@Injectable({ providedIn: 'root' })
export class RiderService {
  private riders: RiderProfile[] = [];
  private readonly subject = new BehaviorSubject<RiderProfile[]>([]);
  readonly riders$ = this.subject.asObservable();

  private readyPromise: Promise<void> | null = null;

  constructor(private db: DatabaseService) {}

  ready(): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load();
    return this.readyPromise;
  }

  private async load(): Promise<void> {
    await this.db.ready();
    const stored = await this.db.getJson<RiderProfile[] | null>(this.db.ridersKey(), null);

    if (stored && Array.isArray(stored) && stored.length) {
      this.riders = stored;
    } else {
      this.riders = await RiderService.seedRiders();
      await this.db.setJson(this.db.ridersKey(), this.riders);
      console.info('[Rider] Seeded the courier pool.');
    }
    this.subject.next([...this.riders]);
  }

  private async persist(): Promise<void> {
    await this.db.setJson(this.db.ridersKey(), this.riders);
    this.subject.next([...this.riders]);
  }

  async all(): Promise<RiderProfile[]> {
    await this.ready();
    return [...this.riders];
  }

  async findById(riderId: string): Promise<RiderProfile | null> {
    await this.ready();
    return this.riders.find(r => r.id === riderId) ?? null;
  }

  async ownedBy(identifier: string): Promise<RiderProfile | null> {
    const all = await this.all();
    return all.find(r => r.accountIdentifier === identifier) ?? null;
  }

  /** Creates (or reuses) the rider profile behind a rider account. */
  async ensureFor(identifier: string, name: string): Promise<RiderProfile> {
    const all = await this.all();
    const existing = all.find(r => r.accountIdentifier === identifier);
    if (existing) return existing;

    const profile: RiderProfile = {
      id: `rider_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      name,
      contact: identifier.includes('@') ? identifier : identifier,
      vehicle: 'Motorcycle',
      plateNo: '',
      accountIdentifier: identifier,
      online: false,
      rating: 5,
      completedDeliveries: 0,
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
    };
    this.riders.push(profile);
    await this.persist();
    return profile;
  }

  async update(riderId: string, patch: Partial<RiderProfile>): Promise<RiderProfile | null> {
    await this.ready();
    const idx = this.riders.findIndex(r => r.id === riderId);
    if (idx === -1) return null;
    const next = { ...this.riders[idx], ...patch, id: riderId };
    this.riders[idx] = next;
    await this.persist();
    return next;
  }

  async setOnline(riderId: string, online: boolean): Promise<void> {
    await this.update(riderId, { online });
  }

  /** Called every time a delivery is completed. */
  async recordDelivery(riderId: string, earnings: number): Promise<void> {
    await this.update(riderId, {
      completedDeliveries: (this.riders.find(r => r.id === riderId)?.completedDeliveries ?? 0) + 1,
      totalEarnings: (this.riders.find(r => r.id === riderId)?.totalEarnings ?? 0) + earnings,
    });
  }

  private static async seedRiders(): Promise<RiderProfile[]> {
    const now = new Date().toISOString();
    // Look up the seeded rider account so the profile is already linked.
    const identifier = 'rider.foodeagle@gmail.com';
    return [
      {
        id: 'rider_seed_juan',
        name: 'Juan Dela Cruz',
        contact: identifier,
        vehicle: 'Motorcycle',
        plateNo: 'DTO-1187',
        accountIdentifier: identifier,
        online: true,
        rating: 4.9,
        completedDeliveries: 132,
        totalEarnings: 3480,
        createdAt: now,
      },
      {
        id: 'rider_seed_maria',
        name: 'Maria Santos',
        contact: 'maria.rider@gmail.com',
        vehicle: 'Bicycle',
        plateNo: '',
        accountIdentifier: null,
        online: true,
        rating: 4.8,
        completedDeliveries: 87,
        totalEarnings: 2175,
        createdAt: now,
      },
      {
        id: 'rider_seed_pedro',
        name: 'Pedro Reyes',
        contact: 'pedro.rider@gmail.com',
        vehicle: 'Motorcycle',
        plateNo: 'DTO-9042',
        accountIdentifier: null,
        online: false,
        rating: 4.7,
        completedDeliveries: 41,
        totalEarnings: 1150,
        createdAt: now,
      },
    ];
  }
}