import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, removeOutline, cartOutline, arrowForwardOutline } from 'ionicons/icons';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle]
})
export class CartPage implements OnInit {
  items: CartItem[] = [];

  constructor(private cartService: CartService, private router: Router) {
    addIcons({ trashOutline, addOutline, removeOutline, cartOutline, arrowForwardOutline });
  }

  ngOnInit() {
    // Immediately grab current items synchronously to prevent lag
    this.items = this.cartService.getItems();
    
    // Subscribe to ongoing cart changes
    this.cartService.cart$.subscribe(items => { 
      this.items = items; 
    });
  }

  ionViewWillEnter() {
    // Refresh items every time user navigates back to the cart tab
    this.items = this.cartService.getItems();
  }

  increase(index: number) { 
    this.cartService.updateQty(index, 1); 
    this.items = this.cartService.getItems();
  }
  
  decrease(index: number) { 
    this.cartService.updateQty(index, -1); 
    this.items = this.cartService.getItems();
  }

  removeItem(index: number) {
    void this.cartService.removeItem(index);
  }

  getSubtotal(): number { 
    return this.cartService.getSubtotal(); 
  }
  
  getTotal(): number { 
    return this.cartService.getTotal(25); 
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}