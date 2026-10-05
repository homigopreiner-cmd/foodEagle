import { CommonModule } from '@angular/common';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { AuthService } from '../../services/auth.service';
import { UserDataService, FavoriteItem } from '../../services/user-data.service';

interface Category {
  name: string;
  icon: string;
}

interface CampusFood {
  id: number;
  dishName: string;
  storeName: string;
  storeId: number;
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
export class DashboardPage implements OnInit {
  currentLocation: string = 'Campus Center';
  activeBanner = 0;
  activeTab = 0;
  
  userAvatarUrl: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';

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

  campusFoods: CampusFood[] = [
    {
      id: 1,
      dishName: 'Spanish Latte',
      storeName: 'The Red Eagle Nook',
      storeId: 1, 
      rating: 4.7,
      reviews: 128,
      price: 100,
      prepTime: '5–10 min',
      spot: 'Main Canteen',
      isHot: true,
      isOpen: true,
      imageUrl: 'assets/images/spanish-latte.jpe',
    },
    {
      id: 2,
      dishName: 'Dinakdakan',
      storeName: 'yanfayes',
      storeId: 2, 
      rating: 4.8,
      reviews: 86,
      price: 50,
      prepTime: '10–15 min',
      spot: 'Food Court',
      isHot: true,
      isOpen: true,
      imageUrl: 'assets/images/dinakdakan.webp',
    },
    {
      id: 3,
      dishName: 'Sweet Bananaque',
      storeName: 'ddk Corner',
      storeId: 3, 
      rating: 4.8,
      reviews: 42,
      price: 15,
      prepTime: '5–10 min',
      spot: 'Student Center Food Hub',
      isHot: false,
      isOpen: true,
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private auth: AuthService,
    private userData: UserDataService
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

  ngOnInit() {
    this.updateLocationFromUserData();
    this.loadFavorites();
    this.loadUserProfile();
  }

  // ionViewWillEnter is triggered every time the page becomes active/navigated back to
  ionViewWillEnter() {
    this.updateLocationFromUserData();
    this.loadFavorites();
    this.loadUserProfile();
  }

  loadUserProfile() {
    const user = this.auth.currentUser;
    if (user?.avatarUrl) {
      this.userAvatarUrl = user.avatarUrl;
    }
  }

  updateLocationFromUserData() {
    const queryLoc = this.route.snapshot.queryParamMap.get('location') || this.route.snapshot.queryParamMap.get('zone');
    if (queryLoc) {
      this.currentLocation = queryLoc;
      return;
    }

    // The user's saved delivery spot lives in their account record.
    const building = this.userData.current.location?.building;
    this.currentLocation = building ? this.prettyBuilding(building) : 'Campus Center';
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
    const vendorKey = food.storeId === 2 ? 'yanfayes' : food.storeId === 3 ? 'ddk-corner' : 'red-eagle-nook';
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
    event.stopPropagation();
    this.router.navigate(['/restaurant-detail'], {
      queryParams: { id: food.storeId, name: food.storeName, dish: food.dishName }
    });
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}