import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController, IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, 
  closeCircle, 
  chevronForwardOutline, 
  star, 
  removeOutline, 
  addOutline, 
  cartOutline 
} from 'ionicons/icons';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class ProductDetailComponent implements OnInit, OnChanges {

  @Input() item: any = null;
  @Input() basePrice: number = 0;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() restaurantName: string = 'FOOD EAGLE KITCHEN';
  /** Owning store id — the restaurant tag jumps to that store's own page. */
  @Input() vendorId: string = '';
  @Input() rating: number = 4.9;
  @Input() imageUrl: string = '';
  @Input() quantity: number = 1;
  @Input() totalPrice: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private location: Location,
    private toastController: ToastController,
    private cartService: CartService
  ) {
    addIcons({
      chevronBackOutline,
      closeCircle,
      chevronForwardOutline,
      star,
      removeOutline,
      addOutline,
      cartOutline
    });
  }

  ngOnInit() {
    this.updateProductDetails();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] || changes['basePrice']) {
      this.updateProductDetails();
    }
  }

  private updateProductDetails() {
    let rawPrice: any = undefined;

    if (this.item && typeof this.item === 'object') {
      this.title = this.item.title || this.item.name || this.title;
      this.rating = this.item.rating !== undefined ? this.item.rating : this.rating;
      this.imageUrl = this.item.imageUrl || this.item.image || this.imageUrl;
      this.description = this.item.description || this.item.subtitle || this.description;
      this.restaurantName = this.item.restaurantName || this.item.vendorName || this.restaurantName;
      this.vendorId = this.item.vendorId || this.vendorId;

      rawPrice = this.item.price ?? this.item.basePrice ?? this.item.cost;
    }

    if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
      rawPrice = this.basePrice;
    }

    // Clean and parse the price value safely
    this.basePrice = this.parsePrice(rawPrice);
    this.calculatePrice();
  }

  private parsePrice(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  increaseQuantity() {
    this.quantity++;
    this.calculatePrice();
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculatePrice();
    }
  }

  calculatePrice() {
    this.totalPrice = this.basePrice * this.quantity;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async openRestaurant() {
    await this.modalCtrl.dismiss();
    // The store tag on the details card opens that store's own page —
    // falling back to the menu when the dish carries no store id.
    if (this.vendorId) {
      await this.router.navigate(['/restaurant-detail'], {
        queryParams: { vendor: this.vendorId, name: this.restaurantName }
      });
      return;
    }
    await this.router.navigate(['/items'], {
      queryParams: { restaurant: this.restaurantName }
    });
  }

  /** First two letters of the store name for the tag's logo box. */
  get storeInitials(): string {
    const name = (this.restaurantName || '').trim();
    if (!name) return 'FE';
    const words = name.split(/\s+/).filter(w => /[a-z0-9]/i.test(w));
    if (!words.length) return 'FE';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  async addToCartWithToast() {
    this.pushItemToCartService();

    const toast = await this.toastController.create({
      message: `${this.quantity}x ${this.title} added to cart!`,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
    
    this.modalCtrl.dismiss({ added: true });
  }

  async addToCart() {
    this.pushItemToCartService();
    await this.modalCtrl.dismiss();
    this.router.navigate(['/cart']);
  }

  private pushItemToCartService() {
    const cartItem = {
      id: this.item?.id ?? this.title,
      name: this.title,
      price: this.basePrice,
      quantity: this.quantity,
      image: this.imageUrl,
      // Carried through so checkout can split a mixed basket per store.
      vendorId: this.vendorId || undefined,
      vendorName: this.vendorId ? this.restaurantName : undefined
    };

    this.cartService.addItem(cartItem);
  }
}