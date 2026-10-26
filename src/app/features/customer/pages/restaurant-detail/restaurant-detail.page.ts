import { Component, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon, ModalController, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  star, starOutline, starHalf, locationOutline, timeOutline, cartOutline, addOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { MenuService } from '../../../../core/services/menu.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { SeedService } from '../../../../core/services/seed.service';
import { FoodCategory, MenuItem, VendorProfile } from '../../../../core/models/platform.model';
import { ProductDetailComponent } from '../../../../shared/components/product-detail/product-detail.component';

/** Stable numeric keys kept for old links (?id=2 still means yanfayes). */
const STORE_KEYS: Record<string, number> = {
  'red-eagle-nook': 1,
  'yanfayes': 2,
  'ddk-corner': 3,
};

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  meals: 'Meals',
  snacks: 'Snacks',
  drinks: 'Drinks',
  desserts: 'Desserts',
  popular: 'Popular',
};

/**
 * Store page — one per vendor/restaurant.
 *
 * This screen used to carry its own hard-coded copy of three stores and
 * their dishes, which meant the page a shopper landed on was never the
 * store they clicked: the real catalogue (MenuService) and the real store
 * profile (VendorService) are shared by every app, and this page now reads
 * them. A dish a vendor publishes, pauses or reprices appears here on the
 * next refresh, and every store gets its own genuine page.
 */
@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.page.html',
  styleUrls: ['./restaurant-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonButtons, IonBackButton, IonButton, IonIcon
  ]
})
export class RestaurantDetailPage implements OnInit, OnDestroy, AfterViewInit {
  vendorId: string = 'red-eagle-nook';
  vendor: VendorProfile | null = null;
  menuCategories: string[] = ['All Items'];
  selectedCategory = 'All Items';
  menuItems: MenuItem[] = [];
  loading = true;

  private subs: Subscription[] = [];
  private destroyed = false;
  private viewReady = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private menu: MenuService,
    private vendors: VendorService,
    private seed: SeedService,
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ star, starOutline, starHalf, locationOutline, timeOutline, cartOutline, addOutline });
  }

  async ngOnInit() {
    await this.seed.ready();

    this.subs.push(
      this.route.queryParams.subscribe(params => {
        this.vendorId = RestaurantDetailPage.resolveVendorId(params);
        void this.loadStore();
      }),
      // A vendor edit (new dish, sold out, price change) refreshes this page.
      this.menu.changes$.subscribe(() => void this.loadStore())
    );
  }

  ngAfterViewInit() {
    this.viewReady = true;
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.subs.forEach(s => s.unsubscribe());
  }

  /** Accepts ?vendor=slug, ?id=1|slug or ?name=Store Name (old links too). */
  private static resolveVendorId(params: { [key: string]: any }): string {
    const vendorParam = String(params['vendor'] ?? params['id'] ?? '').trim();
    const nameParam = String(params['name'] ?? '').trim().toLowerCase();

    const NUMERIC_KEYS: Record<string, string> = {
      '1': 'red-eagle-nook',
      '2': 'yanfayes',
      '3': 'ddk-corner',
    };

    if (NUMERIC_KEYS[vendorParam]) return NUMERIC_KEYS[vendorParam];
    if (vendorParam === 'yanfayes' || nameParam.includes('yanfaye')) return 'yanfayes';
    if (vendorParam === 'ddk-corner' || nameParam.includes('ddk')) return 'ddk-corner';
    if (vendorParam === 'red-eagle-nook' || nameParam.includes('nook') || nameParam.includes('red eagle')) {
      return 'red-eagle-nook';
    }
    return vendorParam || 'red-eagle-nook';
  }

  /** Loads the store profile and that store's own menu items. */
  private async loadStore(): Promise<void> {
    this.loading = true;
    await this.vendors.ready();

    const store = await this.vendors.findById(this.vendorId);
    if (!store) {
      // Unknown id in the URL: fall back to the flagship store instead of
      // rendering an empty shell.
      const all = await this.vendors.all();
      this.vendor = all[0] ?? null;
      this.vendorId = this.vendor?.id ?? this.vendorId;
    } else {
      this.vendor = store;
    }

    const items = (await this.menu.byVendor(this.vendorId))
      .filter(item => item.available);
    this.menuItems = items;

    // Chips come from the categories this store actually sells.
    const present = new Set<FoodCategory>();
    items.forEach(i => i.category.forEach(c => present.add(c)));
    this.menuCategories = [
      'All Items',
      ...(['meals', 'snacks', 'drinks', 'desserts', 'popular'] as FoodCategory[])
        .filter(c => present.has(c))
        .map(c => CATEGORY_LABELS[c]),
    ];
    if (!this.menuCategories.includes(this.selectedCategory)) {
      this.selectedCategory = 'All Items';
    }

    this.loading = false;
    // This app runs without zone.js: plain-field updates after an `await`
    // are invisible until the next scheduled check, so repaint explicitly.
    if (!this.destroyed && this.viewReady) this.cdr.detectChanges();
  }

  get filteredItems(): MenuItem[] {
    if (this.selectedCategory === 'All Items') return this.menuItems;
    const wanted = (Object.keys(CATEGORY_LABELS) as FoodCategory[])
      .find(c => CATEGORY_LABELS[c] === this.selectedCategory);
    if (!wanted) return this.menuItems;
    return this.menuItems.filter(i => i.category.includes(wanted));
  }

  getVendorStars() {
    return this.calculateStars(this.vendor?.rating ?? 4.7);
  }

  getItemStars(rating: number) {
    return this.calculateStars(rating);
  }

  private calculateStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('star');
      } else if (rating >= i - 0.5) {
        stars.push('star-half');
      } else {
        stars.push('star-outline');
      }
    }
    return stars;
  }

  /** Tapping a dish opens the shared food-details card. */
  async openDetails(item: MenuItem) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailComponent,
      componentProps: {
        item: item,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        imageUrl: item.imageUrl,
        rating: item.rating,
        basePrice: item.price,
        vendorId: item.vendorId,
        vendorName: this.vendor?.name,
        restaurantName: this.vendor?.name ?? 'FOOD EAGLE KITCHEN'
      },
      cssClass: 'custom-popup-modal',
      mode: 'ios'
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && (data.action === 'checkout' || data.action === 'add' || data.added)) {
      if (data.action === 'checkout') this.router.navigate(['/cart']);
    }
  }

  /** Quick "+" button on a menu card — straight to the cart. */
  async addToCart(item: MenuItem) {
    await this.cartService.addItem({
      id: item.id,
      name: item.title,
      price: item.price,
      quantity: 1,
      image: item.imageUrl,
      vendorId: item.vendorId,
      vendorName: this.vendor?.name
    });

    const toast = await this.toastController.create({
      message: `Added 1x ${item.title} to cart`,
      duration: 1500,
      position: 'bottom',
      color: 'dark',
      cssClass: 'modern-toast'
    });
    await toast.present();
  }
}
