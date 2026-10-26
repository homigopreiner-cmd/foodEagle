import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locationOutline, fastFoodOutline, walletOutline, chevronForwardOutline } from 'ionicons/icons';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { OrderLine, PaymentMethod } from '../../../../core/models/platform.model';
import { UserDataService } from '../../../../core/services/user-data.service';
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
  /** Kept in sync by the payment card in the template. */
  paymentMethod: PaymentMethod = 'cod';
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
      // Hand the cart to the shared ledger. A mixed basket is split into
      // one order per store so the right vendor receives the ticket.
      const lines: OrderLine[] = this.checkoutItems.map(item => ({
        itemId: item.id,
        vendorId: item.vendorId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      await this.orderService.placeOrder({
        items: lines,
        paymentMethod: this.paymentMethod,
        dropoffBuilding: this.deliveryBuilding,
        dropoffLandmark: this.deliveryLandmark,
      });

      await this.cartService.clearCart();
      this.router.navigate(['/order-success'], { replaceUrl: true });
    } finally {
      this.isPlacingOrder = false;
    }
  }
}