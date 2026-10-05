import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';

export interface OrderItem {
  id: string;
  store: string;
  item: string;
  price: string;
  image: string;
  status: 'topay' | 'toreceive' | 'delivered' | 'refunds';
  badgeText: string;
  badgeColorClass: string;
  actionText: string;
  actionHandler: string;
  iconClass: string;
  createdAt?: string;
}

/**
 * OrderService — the user's order history, persisted in the database.
 *
 * Orders are saved under the signed-in user's key, so the whole history
 * (To Pay / To Receive / Delivered) comes back after restarts, logouts
 * and logins, exactly like a real app.
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders: OrderItem[] = [];
  private ordersSubject = new BehaviorSubject<OrderItem[]>([]);
  orders$ = this.ordersSubject.asObservable();

  private loadedUserId: string | null = null;

  constructor(
    private db: DatabaseService,
    private auth: AuthService
  ) {
    // Reload (or clear) the order history whenever the signed-in user changes.
    this.auth.currentUser$.subscribe(user => {
      const nextUserId = user?.id ?? null;
      if (nextUserId !== this.loadedUserId) {
        this.loadedUserId = nextUserId;
        void this.loadOrders();
      }
    });
  }

  private async loadOrders(): Promise<void> {
    await this.db.ready();
    if (!this.loadedUserId) {
      this.orders = [];
      this.ordersSubject.next([]);
      return;
    }
    const stored = await this.db.getJson<OrderItem[]>(this.db.keyForUserData(this.loadedUserId) + ':orders', []);
    this.orders = Array.isArray(stored) ? stored.filter(o => o && typeof o.id === 'string') : [];
    this.ordersSubject.next([...this.orders]);
  }

  private async persist(): Promise<void> {
    this.ordersSubject.next([...this.orders]);
    if (this.loadedUserId) {
      await this.db.setJson(this.db.keyForUserData(this.loadedUserId) + ':orders', this.orders);
    }
  }

  getOrders(): OrderItem[] {
    return this.orders;
  }

  async addOrder(order: OrderItem): Promise<void> {
    this.orders.unshift({ ...order, createdAt: order.createdAt ?? new Date().toISOString() });
    await this.persist();
  }

  /** Update a single order's status / badges (payment, delivery, review...). */
  async updateOrder(id: string, patch: Partial<OrderItem>): Promise<void> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return;
    this.orders[index] = { ...this.orders[index], ...patch };
    await this.persist();
  }
}