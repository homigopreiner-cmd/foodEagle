import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * CartService — a shopping cart per account.
 *
 * The cart is stored in the database under fe_cart:{userId} and swaps
 * automatically when the signed-in user changes, so each user's cart
 * comes back on login and nothing leaks between accounts.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private loadedUserId: string | null = null;
  private loadingPromise: Promise<void> | null = null;

  constructor(
    private db: DatabaseService,
    private auth: AuthService
  ) {
    // Reload (or clear) the cart whenever the signed-in user changes.
    this.auth.currentUser$.subscribe(user => {
      const nextUserId = user?.id ?? null;
      if (nextUserId !== this.loadedUserId) {
        this.loadedUserId = nextUserId;
        this.loadingPromise = this.loadCart();
      }
    });
  }

  private async loadCart(): Promise<void> {
    await this.db.ready();
    if (!this.loadedUserId) {
      this.cartItems = [];
      this.cartSubject.next([]);
      return;
    }
    const saved = await this.db.getJson<CartItem[]>(this.db.keyForCart(this.loadedUserId), []);
    this.cartItems = Array.isArray(saved)
      ? saved.filter(i => i && typeof i.name === 'string' && typeof i.price === 'number')
      : [];
    this.cartSubject.next([...this.cartItems]);
  }

  private async persist(): Promise<void> {
    this.cartSubject.next([...this.cartItems]);
    if (this.loadedUserId) {
      await this.db.setJson(this.db.keyForCart(this.loadedUserId), this.cartItems);
    }
  }

  getItems(): CartItem[] {
    return this.cartItems;
  }

  async addItem(item: { id?: string | number; name: string; price: number; quantity: number; image?: string }) {
    if (this.loadingPromise) await this.loadingPromise;

    if (!this.loadedUserId) return; // guests cannot build a cart

    const price = Number(item.price) || 0;
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const stringId = String(item.id ?? item.name);

    const existingIndex = this.cartItems.findIndex(i => i.id === stringId);
    if (existingIndex > -1) {
      this.cartItems[existingIndex].quantity += quantity;
    } else {
      this.cartItems.push({
        id: stringId,
        name: item.name,
        price,
        quantity,
        image: item.image
      });
    }
    await this.persist();
  }

  async updateQty(index: number, delta: number) {
    if (this.loadingPromise) await this.loadingPromise;
    if (!this.cartItems[index]) return;

    this.cartItems[index].quantity += delta;
    if (this.cartItems[index].quantity <= 0) {
      this.cartItems.splice(index, 1);
    }
    await this.persist();
  }

  async removeItem(index: number) {
    if (this.loadingPromise) await this.loadingPromise;
    if (this.cartItems[index]) {
      this.cartItems.splice(index, 1);
      await this.persist();
    }
  }

  async clearCart() {
    if (this.loadingPromise) await this.loadingPromise;
    this.cartItems = [];
    await this.persist();
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotal(deliveryFee: number = 25): number {
    return this.getSubtotal() + (this.cartItems.length > 0 ? deliveryFee : 0);
  }
}