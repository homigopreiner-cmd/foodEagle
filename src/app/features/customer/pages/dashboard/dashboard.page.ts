import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavController } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonAvatar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  arrowForwardOutline,
  restaurantOutline,
  locationOutline,
  notificationsOutline,
  personCircleOutline,
  searchOutline,
  star,
  heart,
  trendingUpOutline,
  wineOutline,
  iceCreamOutline,
  pizzaOutline,
  homeOutline,
  personOutline,
  documentTextOutline,
  heartOutline,
  gridOutline,
  cartOutline,
  timeOutline
} from 'ionicons/icons';
import { register } from 'swiper/element/bundle';
register();
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDataService, FavoriteItem } from '../../../../core/services/user-data.service';
import { MenuService } from '../../../../core/services/menu.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { SeedService } from '../../../../core/services/seed.service';
import { MenuItem, VendorProfile } from '../../../../core/models/platform.model';
import { CartService } from '../../../../core/services/cart.service';
import { ProductDetailComponent } from '../../../../shared/components/product-detail/product-detail.component';

interface Category {
  name: string;
  icon: string;
}

/**
 * A dish card as the customer app renders it.
 *
 * It is assembled at runtime from the shared catalogue (MenuService) and
 * the store profiles (VendorService) — the dashboard no longer owns any
 * food data of its own, which is what lets the vendor app change what
 * shoppers see.
 */
interface CampusFood {
  id: string;
  dishName: string;
  storeName: string;
  /** Numeric store key used by the restaurant detail screen. */
  storeId: number;
  /** Real store id — every link that opens the store page uses this. */
  vendorId: string;
  description: string;
  rating: number;
  price: number;
  imageUrl: string;
  isHot?: boolean;
  reviews?: number;
  prepTime?: string;
  spot?: string;
  isOpen?: boolean;
  isFavorite?: boolean;
}

interface BannerSlide {
  tagline: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

/** Stable numeric keys for the three seeded stores. */
const STORE_KEYS: Record<string, number> = {
  'red-eagle-nook': 1,
  'yanfayes': 2,
  'ddk-corner': 3,
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonAvatar,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly currentLocationState = signal<string>('Campus Center');
  get currentLocation(): string { return this.currentLocationState(); }
  activeBanner = 0;
  activeTab = 0;

  private readonly userAvatarUrlState = signal<string>('https://ionicframework.com/docs/img/demos/avatar.svg');
  get userAvatarUrl(): string { return this.userAvatarUrlState(); }

  /** Dishes shown to the shopper — rebuilt from the shared catalogue. */
  private readonly campusFoodsState = signal<CampusFood[]>([]);
  get campusFoods(): CampusFood[] { return this.campusFoodsState(); }
  private readonly storesState = signal<VendorProfile[]>([]);
  get stores(): VendorProfile[] { return this.storesState(); }

  bannerSlides: BannerSlide[] = [
    {
      tagline: 'HOT DEALS TODAY',
      title: 'Good food, delivered fast.',
      subtitle: 'Get up to 30% OFF your first order!',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    },
    {
      tagline: 'CRAVING BURGERS?',
      title: 'Lumpia & Ilocos Empanada',
      subtitle: 'Free delivery on orders over ₱500',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85',
    },
    {
      tagline: 'SWEET REFRESHMENT',
      title: 'Refreshing Drinks',
      subtitle: 'Buy 1 Get 1 on selected flavors',
      imageUrl: 'assets/images/slide3.png',
    },
  ];

  categories: Category[] = [
    { name: 'Desserts', icon: 'ice-cream-outline' },
    { name: 'Meals', icon: 'restaurant-outline' },
    { name: 'Drinks', icon: 'wine-outline' },
    { name: 'Snacks', icon: 'pizza-outline' },
  ];

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private auth: AuthService,
    private userData: UserDataService,
    private menu: MenuService,
    private vendors: VendorService,
    private seed: SeedService,
    private modalCtrl: ModalController,
    private cartService: CartService,
    private toastController: ToastController
  ) {
    addIcons({
      add,
      homeOutline,
      locationOutline,
      personCircleOutline,
      notificationsOutline,
      arrowForwardOutline,
      star,
      heart,
      trendingUpOutline,
      personOutline,
      documentTextOutline,
      heartOutline,
      gridOutline,
      iceCreamOutline,
      restaurantOutline,
      wineOutline,
      pizzaOutline,
      searchOutline,
      cartOutline,
      timeOutline
    });
  }

  async ngOnInit() {
    this.updateLocationFromUserData();
    this.loadUserProfile();

    // Wait for the first-run catalogue, then follow the shared menu and
    // store list: a vendor pause, new dish or sold-out toggle refreshes
    // this screen without a restart.
    await this.seed.ready();
    // Without this the store profiles were never loaded on this screen and
    // every dish fell back to "Food Eagle Partner" — the store name behind
    // each card (and its link to the store page) comes from here.
    await this.vendors.ready();

    this.subs.push(
      this.vendors.stores$.subscribe(stores => {
        this.storesState.set( stores);
        void this.rebuild();
      }),
      this.menu.changes$.subscribe(() => void this.rebuild())
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ionViewWillEnter is triggered every time the page becomes active/navigated back to
  ionViewWillEnter() {
    this.updateLocationFromUserData();
    this.loadUserProfile();
    void this.rebuild();
  }

  /** Assembles the dish cards from the shared catalogue + store profiles. */
  private async rebuild(): Promise<void> {
    const items = await this.menu.all();
    const storeIndex = new Map<string, { store: VendorProfile; key: number }>();

    this.stores.forEach((store, i) => {
      storeIndex.set(store.id, { store, key: STORE_KEYS[store.id] ?? i + 1 });
    });

    this.campusFoodsState.set( items
      .filter(item => item.available)
      .map(item => {
        const entry = storeIndex.get(item.vendorId);
        const store = entry?.store;
        // Suspended stores are hidden entirely; merely paused ones stay
        // visible but are labelled "Closed" by the template.
        if (store && !store.approved) return null;

        return {
          id: item.id,
          dishName: item.title,
          storeName: store?.name ?? 'Food Eagle Partner',
          storeId: entry?.key ?? 1,
          vendorId: item.vendorId,
          description: item.description,
          rating: item.rating,
          reviews: item.reviews,
          price: item.price,
          prepTime: store?.prepTime ?? '5–10 min',
          spot: store?.spot ?? 'Campus Center',
          imageUrl: item.imageUrl,
          isHot: item.category.includes('popular'),
          isOpen: store?.acceptingOrders ?? true,
          isFavorite: this.userData.isFavorite(`dish-${item.id}`),
        } as CampusFood;
      })
      .filter((food): food is CampusFood => food !== null));
  }

  loadUserProfile() {
    const user = this.auth.currentUser;
    if (user?.avatarUrl) {
      this.userAvatarUrlState.set( user.avatarUrl);
    }
  }

  updateLocationFromUserData() {
    const queryLoc = this.route.snapshot.queryParamMap.get('location') || this.route.snapshot.queryParamMap.get('zone');
    if (queryLoc) {
      this.currentLocationState.set( queryLoc);
      return;
    }

    // The user's saved delivery spot lives in their account record.
    const building = this.userData.current.location?.building;
    this.currentLocationState.set( building ? this.prettyBuilding(building) : 'Campus Center');
  }

  private prettyBuilding(code: string): string {
    return code
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  goToProfile() {
    this.router.navigate(['/profile-hub']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToSearch() {
    this.navCtrl.navigateRoot('/search', { animated: false });
  }

  goToCategories() {
    this.router.navigate(['/categories']);
  }

  goToItems(categoryName: string = 'Popular') {
    this.router.navigate(['/items'], {
      queryParams: { name: categoryName, returnTo: 'dashboard' },
    });
  }

  openCategoryQuickLink(categoryName: string) {
    this.router.navigate(['/items'], {
      queryParams: { name: categoryName, returnTo: 'dashboard' }
    });
  }

  selectBanner(index: number) {
    this.activeBanner = index;
  }

  goToRestaurantDetail(storeTitle: string, id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/restaurant-detail'], {
      queryParams: { id: id, name: storeTitle }
    });
  }

  trackById = (_: number, food: CampusFood) => food.id;

  /** Converts a dashboard dish card into the shared FavoriteItem shape. */
  private toFavoriteItem(food: CampusFood): FavoriteItem {
    const vendorKey = food.vendorId ||
      (food.storeId === 2 ? 'yanfayes' : food.storeId === 3 ? 'ddk-corner' : 'red-eagle-nook');
    return {
      id: `dish-${food.id}`,
      name: food.dishName,
      restaurant: food.storeName,
      vendorKey,
      price: food.price,
      rating: food.rating,
      image: food.imageUrl,
    };
  }

  async toggleFavorite(food: CampusFood, event: Event) {
    event.stopPropagation();
    // One favorites list per account, shared with the Favorites page.
    const nowFavorite = await this.userData.toggleFavorite(this.toFavoriteItem(food));
    food.isFavorite = nowFavorite;
  }

  private loadFavorites() {
    // Heart state comes straight from the persisted favorites list.
    this.campusFoods.forEach(f => {
      f.isFavorite = this.userData.isFavorite(`dish-${f.id}`);
    });
  }

  quickAdd(food: CampusFood, event: Event) {
    // The "+" on a Campus Favorites card adds the dish straight to the cart
    // (it used to navigate to the store page, which belongs to the name).
    event.stopPropagation();
    void this.cartService.addItem({
      id: food.id,
      name: food.dishName,
      price: food.price,
      quantity: 1,
      image: food.imageUrl,
      vendorId: food.vendorId,
      vendorName: food.storeName
    });
    void this.presentAddToast(food.dishName, 1);
  }

  private async presentAddToast(itemName: string, quantity: number): Promise<void> {
    const toast = await this.toastController.create({
      message: `Added ${quantity}x ${itemName} to cart`,
      duration: 1500,
      position: 'bottom',
      color: 'dark',
      cssClass: 'modern-toast'
    });
    await toast.present();
  }

  /** Tapping the box of a dish opens its food-details card. */
  async openFoodDetails(food: CampusFood) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailComponent,
      componentProps: {
        item: {
          id: food.id,
          title: food.dishName,
          price: food.price,
          rating: food.rating,
          imageUrl: food.imageUrl,
          description: food.description,
          vendorId: food.vendorId,
          vendorName: food.storeName
        },
        title: food.dishName,
        description: food.description,
        imageUrl: food.imageUrl,
        rating: food.rating,
        basePrice: food.price,
        vendorId: food.vendorId,
        vendorName: food.storeName,
        restaurantName: food.storeName
      },
      cssClass: 'custom-popup-modal',
      mode: 'ios'
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.action === 'checkout') {
      this.router.navigate(['/cart']);
    }
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}