import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonButtons, IonBackButton, IonIcon,
  IonHeader, IonToolbar, IonTitle, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  trashOutline, addOutline, removeOutline, cartOutline, arrowForwardOutline,
  chevronForwardOutline, storefrontOutline, bicycleOutline, navigateOutline,
  cashOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../../../core/services/cart.service';

/** One dish line, tagged with its position in the flat cart array. */
export interface CartLine {
  item: CartItem;
  index: number;
}

/** Everything belonging to one store — checkout splits the basket per vendor. */
export interface CartGroup {
  vendorId: string;
  vendorName: string;
  initials: string;
  lines: CartLine[];
  subtotal: number;
}

/**
 * Cart — the order sheet.
 *
 * Design notes:
 *  - Lines are grouped by store because a mixed basket is split into one
 *    order per kitchen on checkout; showing that here sets the right
 *    expectation before the customer pays.
 *  - Removing a line is undoable for a few seconds (toast + UNDO), the
 *    standard safety net for a destructive tap.
 *  - The checkout bar floats above the global bottom nav and carries the
 *    running total, so the price is always in reach.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonButtons, IonBackButton, IonIcon,
    IonHeader, IonToolbar, IonTitle
  ]
})
export class CartPage implements OnInit, OnDestroy {
  items: CartItem[] = [];
  groups: CartGroup[] = [];

  /** Same flat fee the checkout page and OrderService charge. */
  readonly deliveryFee = 25;

  private cartSub?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    private toast: ToastController,
    private cd: ChangeDetectorRef
  ) {
    addIcons({
      trashOutline, addOutline, removeOutline, cartOutline, arrowForwardOutline,
      chevronForwardOutline, storefrontOutline, bicycleOutline, navigateOutline,
      cashOutline
    });
  }

  ngOnInit() {
    // Seed synchronously first so the page never flashes empty, then stay
    // in sync. markForCheck keeps the repaint honest on this zoneless app.
    this.items = this.cartService.getItems();
    this.rebuildGroups();

    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.items = items;
      this.rebuildGroups();
      this.cd.markForCheck();
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.items = this.cartService.getItems();
    this.rebuildGroups();
  }

  /** Flat item count shown next to the page title. */
  get totalQty(): number {
    return this.items.reduce((n, item) => n + item.quantity, 0);
  }

  increase(index: number) {
    void this.cartService.updateQty(index, 1);
  }

  decrease(index: number) {
    // The minus button is disabled at qty 1, so this can never delete.
    void this.cartService.updateQty(index, -1);
  }

  /** Undoable removal — the toast puts the line straight back. */
  async removeLine(line: CartLine): Promise<void> {
    const removed: CartItem = { ...line.item };
    await this.cartService.removeItem(line.index);

    const toast = await this.toast.create({
      message: `${removed.name} removed from your cart`,
      duration: 4000,
      position: 'top',
      color: 'dark',
      buttons: [
        {
          text: 'UNDO',
          role: 'action',
          handler: () => {
            void this.cartService.addItem(removed);
          },
        },
      ],
    });
    await toast.present();
  }

  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

  getTotal(): number {
    return this.cartService.getTotal(this.deliveryFee);
  }

  peso(value: number): string {
    return `\u20b1${(Number(value) || 0).toFixed(2)}`;
  }

  /** Store header tap → that store's own page. */
  goToStore(group: CartGroup) {
    this.router.navigate(['/restaurant-detail'], {
      queryParams: { vendor: group.vendorId, name: group.vendorName },
    });
  }

  browseStores() {
    this.router.navigate(['/categories']);
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  /** Rebuilds the per-store sections from the flat cart array. */
  private rebuildGroups() {
    const map = new Map<string, CartGroup>();
    this.items.forEach((item, index) => {
      const vendorId = item.vendorId ?? 'red-eagle-nook';
      const vendorName = item.vendorName ?? 'Food Eagle Kitchen';
      let group = map.get(vendorId);
      if (!group) {
        group = {
          vendorId,
          vendorName,
          initials: CartPage.initialsOf(vendorName),
          lines: [],
          subtotal: 0,
        };
        map.set(vendorId, group);
      }
      group.lines.push({ item, index });
      group.subtotal += item.price * item.quantity;
    });
    this.groups = [...map.values()];
  }

  private static initialsOf(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase() ?? '')
      .join('');
    return initials || 'FE';
  }
}
