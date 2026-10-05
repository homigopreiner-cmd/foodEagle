import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locationOutline, fastFoodOutline, walletOutline, chevronForwardOutline } from 'ionicons/icons';
import { CartService, CartItem } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { UserDataService } from '../../services/user-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButtons, IonBackButton, IonButton, IonIcon]
})
export class CheckoutPage implements OnInit, OnDestroy {
  checkoutItems: CartItem[] = [];
  deliveryFee: number = 25;
  deliveryBuilding: string = 'CICS';
  deliveryLandmark: string = 'Near main entrance';
  isPlacingOrder: boolean = false;
  private cartSub!: Subscription;

  constructor(
    private cartService: CartService, 
    private orderService: OrderService, 
    private userData: UserDataService,
    private router: Router
  ) {
    addIcons({ locationOutline, fastFoodOutline, walletOutline, chevronForwardOutline });
  }

  ngOnInit() {
    // Subscribe to the cart observable to properly retrieve current items
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.checkoutItems = items;
    });

    // Show the user's saved delivery spot from their account.
    const location = this.userData.current.location;
    if (location) {
      this.deliveryBuilding = location.building;
      this.deliveryLandmark = location.landmark;
    }
  }

  ngOnDestroy() {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

  getTotal(): number {
    return this.getSubtotal() + (this.checkoutItems.length > 0 ? this.deliveryFee : 0);
  }

  async placeOrder() {
    if (this.isPlacingOrder || this.checkoutItems.length === 0) return;
    this.isPlacingOrder = true;

    try {
      // One order per checkout — summarized line items and grand total.
      const itemSummary = this.checkoutItems
        .map(item => `${item.quantity}x ${item.name}`)
        .join(', ');

      await this.orderService.addOrder({
        id: `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`,
        store: 'Food Eagle Partner',
        item: itemSummary,
        price: `₱${this.getTotal().toFixed(2)}`,
        image: this.checkoutItems[0].image || 'assets/images/corndog.jpg',
        status: 'toreceive',
        badgeText: 'On Delivery',
        badgeColorClass: 'amber',
        actionText: 'Track Rider',
        actionHandler: 'openMapModal',
        iconClass: 'fa-solid fa-location-dot',
        createdAt: new Date().toISOString()
      });

      await this.cartService.clearCart();
      this.router.navigate(['/order-success'], { replaceUrl: true });
    } finally {
      this.isPlacingOrder = false;
    }
  }
}