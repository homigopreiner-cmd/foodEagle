import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  NavController, 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol, IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  fastFoodOutline, pizzaOutline, beerOutline, iceCreamOutline, 
  fishOutline, nutritionOutline, restaurantOutline, flameOutline,
  gridOutline, homeOutline, searchOutline, receiptOutline, heartOutline, 
  personOutline, cartOutline, wineOutline 
} from 'ionicons/icons';
import { ItemsService } from '../../../../core/services/items.service';
import { Subscription } from 'rxjs';

export interface CategoryItem {
  id: string;
  name: string;
  itemCount: number;
  icon: string;
  /** Cover photo = a real dish from this category, so the tile is always
   *  in sync with the live catalogue (and actually appetizing). */
  cover?: string;
  /** Two signature dishes, shown under the title. */
  sample?: string;
  /** Set once the cover fails to load — falls back to the icon tile. */
  coverFailed?: boolean;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol, IonIcon
  ]
})
export class CategoriesPage implements OnInit, OnDestroy {

  searchQuery: string = '';
  activeTab: number = 0;
  /** Quick-jump chip filter — 'all' shows every browsable category. */
  activeChip: string = 'all';

  /** The shared catalogue loads asynchronously — tiles used to render
   *  against an empty cache and this page showed "No categories found"
   *  on first visit. Stay subscribed so counts land when the menu does. */
  private itemsSub?: Subscription;

  allCategories: CategoryItem[] = [
    { id: 'snacks', name: 'Snacks', itemCount: 0, icon: 'fast-food-outline' },
    { id: 'viand', name: 'Viand', itemCount: 0, icon: 'pizza-outline' },
    { id: 'drinks', name: 'Drinks & Beverages', itemCount: 0, icon: 'beer-outline' },
    { id: 'desserts', name: 'Desserts & Sweets', itemCount: 0, icon: 'ice-cream-outline' },
    { id: 'meals', name: 'Meals', itemCount: 0, icon: 'fish-outline' },
    { id: 'healthy', name: 'Healthy & Salad', itemCount: 0, icon: 'nutrition-outline' },
    { id: 'popular', name: 'Popular Deals', itemCount: 0, icon: 'flame-outline' }
  ];

  filteredCategories: CategoryItem[] = [];

  constructor(
    private itemsService: ItemsService,
    private router: Router,
    private navCtrl: NavController
  ) {
    addIcons({
      iceCreamOutline, cartOutline, wineOutline, fastFoodOutline, 
      homeOutline, searchOutline, receiptOutline, heartOutline, 
      personOutline, pizzaOutline, beerOutline, fishOutline, 
      nutritionOutline, restaurantOutline, flameOutline, gridOutline
    });
  }

  ngOnInit() {
    this.updateCategoryCounts();
    this.filterCategories();
    this.itemsSub = this.itemsService.items$.subscribe(() => {
      this.updateCategoryCounts();
      this.filterCategories();
    });
  }

  ngOnDestroy() {
    this.itemsSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.updateCategoryCounts();
    this.filterCategories();
  }

  private updateCategoryCounts() {
    const allItems = this.itemsService.getAllItems();
    this.allCategories.forEach(cat => {
      const catKey = cat.id.toLowerCase();
      const matches = allItems.filter((item: any) => {
        const catField = item.category;
        if (Array.isArray(catField)) {
          return catField.some((c: any) => String(c).toLowerCase().includes(catKey));
        }
        return catField ? String(catField).toLowerCase().includes(catKey) : false;
      });

      cat.itemCount = matches.length;
      // Photo-driven tile: borrow the first dish picture in this category.
      cat.cover = matches.find((m: any) => m.imageUrl)?.imageUrl || '';
      cat.sample = matches
        .slice(0, 2)
        .map((m: any) => m.title)
        .filter(Boolean)
        .join(', ');
      cat.coverFailed = false;
    });
  }

  filterCategories() {
    const q = this.searchQuery.toLowerCase().trim();
    // Dead categories (nothing on the menu yet) never appear — a tile that
    // leads to an empty page is worse than no tile at all.
    const browsable = this.allCategories.filter(cat => cat.itemCount > 0);
    this.filteredCategories = !q
      ? browsable
      : browsable.filter(cat =>
          cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q)
        );
  }

  /** The crown-jewel tile: "Popular Deals" anchors the page, wide and on top. */
  get feature(): CategoryItem | null {
    return (
      this.filteredCategories.find(c => c.id === 'popular') ??
      [...this.filteredCategories].sort((a, b) => b.itemCount - a.itemCount)[0] ??
      null
    );
  }

  /** Everything except the feature card — the regular two-column grid. */
  get gridCategories(): CategoryItem[] {
    const feature = this.feature;
    return this.filteredCategories.filter(c => c !== feature);
  }

  /** Grid after the chip filter is applied. */
  get shownCategories(): CategoryItem[] {
    if (this.activeChip === 'all') return this.gridCategories;
    return this.gridCategories.filter(c => c.id === this.activeChip);
  }

  setChip(id: string) {
    this.activeChip = id;
  }

  goBack() {
    this.navCtrl.navigateBack('/dashboard');
  }

  openCategory(category: CategoryItem) {
    this.router.navigate(['/items'], { 
      queryParams: { 
        category: category.id, 
        name: category.name 
      } 
    });
  }

  onTabChange(event: any) {
    if (event && typeof event.index === 'number') {
      this.activeTab = event.index;
      const id = event.item?.id;
      if (id === 'home') {
        this.navCtrl.navigateRoot('/dashboard');
      } else if (id === 'search') {
        this.navCtrl.navigateRoot('/search');
      } else if (id === 'orders') {
        this.router.navigate(['/orders']);
      } else if (id === 'favorites') {
        this.router.navigate(['/favorites']);
      } else if (id === 'profile') {
        this.router.navigate(['/profile-hub']);
      }
    }
  }
}