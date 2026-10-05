import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ModalController, NavController,
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar, IonButton, IonIcon,
  IonChip, IonLabel, IonContent, IonList, IonItem
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline, timeOutline, closeOutline,
  trendingUpOutline, star
} from 'ionicons/icons';
import { ItemsService, ProductItem } from '../../services/items.service';
import { ProductDetailComponent } from '../component/product-detail.component';
import { NavItem } from '../curved-bottom-nav/curved-bottom-nav.component';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar, IonButton, IonIcon,
    IonChip, IonLabel, IonContent, IonList, IonItem
  ]
})
export class SearchPage implements OnInit {
  @ViewChild(IonSearchbar) searchbar?: IonSearchbar;

  searchQuery = '';
  selectedFilter = 'All';
  activeTab = 2; // Set to index of search/add button so indicator stays here

  quickFilters: string[] = ['All', 'Snacks', 'Drinks', 'Meals', 'Desserts', 'Popular'];
  popularTags: string[] = ['Bananaque', 'Sisig', 'Taho', 'Corndog', 'Black Gulaman'];

  // Starts empty. Only filled by things the user actually searches for.
  recentSearches: string[] = [];
  removingTerm: string | null = null;

  filteredResults: ProductItem[] = [];

  readonly placeholderImg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">' +
      '<rect width="72" height="72" rx="14" fill="#f5e4e6"/>' +
      '<circle cx="36" cy="36" r="12" fill="none" stroke="#ccaeb3" stroke-width="3"/>' +
      '<path d="M45 45l8 8" stroke="#ccaeb3" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
    );


  constructor(
    private router: Router,
    private navCtrl: NavController,
    private itemsService: ItemsService,
    private modalCtrl: ModalController,
    private userData: UserDataService
  ) {
    addIcons({ searchOutline, timeOutline, closeOutline, trendingUpOutline, star });
  }

  ngOnInit() {
    this.filteredResults = this.itemsService.getAllItems();
    // Recent searches live in the signed-in user's saved data.
    this.recentSearches = this.userData.current.recentSearches;
  }

  // Open the keyboard as soon as the page is shown
  ionViewDidEnter() {
    setTimeout(() => this.searchbar?.setFocus(), 150);
  }

  /** True when the user is typing or has a category selected. */
  get isSearching(): boolean {
    return !!this.searchQuery.trim() || this.selectedFilter !== 'All';
  }

  // ---------- Search ----------

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value ?? '';
    this.updateResults();
  }

  /** Enter / Search key on the keyboard. */
  onSearchSubmit() {
    this.updateResults();
    if (this.filteredResults.length) {
      this.commitRecent(this.searchQuery);
    }
    this.dismissKeyboard();
  }

  selectFilter(filter: string) {
    // Tapping the active category again turns it off
    this.selectedFilter =
      filter !== 'All' && this.selectedFilter === filter ? 'All' : filter;
    this.updateResults();
  }

  updateResults() {
    this.filteredResults = this.itemsService.searchItems(
      this.searchQuery.trim(),
      this.selectedFilter
    );
  }

  /** Used by recent rows and popular tags. */
  applySearch(term: string) {
    this.searchQuery = term;
    this.updateResults();
    this.commitRecent(term);
    this.dismissKeyboard();
  }

  resetSearch() {
    this.searchQuery = '';
    this.selectedFilter = 'All';
    this.updateResults();
    this.searchbar?.setFocus();
  }

  dismissKeyboard() {
    this.searchbar?.getInputElement().then(el => el.blur());
  }

  // ---------- Recent searches (real history only, persisted per user) ----------

  private commitRecent(raw: string) {
    const term = raw.trim();
    if (term.length < 2) return;

    void this.userData.commitRecentSearch(term).then(() => {
      this.recentSearches = this.userData.current.recentSearches;
    });
  }

  removeRecent(term: string) {
    this.removingTerm = term;
    setTimeout(() => {
      void this.userData.removeRecentSearch(term).then(() => {
        this.recentSearches = this.userData.current.recentSearches;
        this.removingTerm = null;
      });
    }, 180);
  }

  clearRecent() {
    void this.userData.clearRecentSearches().then(() => {
      this.recentSearches = [];
    });
  }

  // ---------- Results ----------

  async selectItem(item: ProductItem) {
    // If they found it by searching, remember the dish name they ended up choosing
    if (this.searchQuery.trim()) {
      this.commitRecent(item.title);
    }
    this.dismissKeyboard();

    const modal = await this.modalCtrl.create({
      component: ProductDetailComponent,
      componentProps: {
        item: item, // FIX: Passed the full item object so the detail modal can read item.price
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        imageUrl: item.imageUrl,
        rating: item.rating,
        basePrice: item.price, // FIX: Changed from 'price' to 'basePrice'
        restaurantName: 'FOOD EAGLE KITCHEN'
      },
      cssClass: 'custom-popup-modal',
      mode: 'ios'
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.action === 'checkout') {
      // Checkout logic here if needed
    }
  }

  /** Splits text so the part matching the query can be highlighted. */
  highlightParts(text: string): { text: string; match: boolean }[] {
    const q = this.searchQuery.trim();
    if (!q || !text) return [{ text: text || '', match: false }];

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text
      .split(new RegExp(`(${escaped})`, 'gi'))
      .filter(part => part !== '')
      .map(part => ({ text: part, match: part.toLowerCase() === q.toLowerCase() }));
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return;
    img.dataset['fallback'] = '1';
    img.src = this.placeholderImg;
  }

  trackByTerm = (_: number, term: string) => term;
  trackByResult = (_: number, item: any) => item.id ?? item.title;

  formatCategory(category: any): string {
    if (Array.isArray(category)) {
      return category.join(', ');
    }
    return category || '';
  }

  formatPrice(price: number): string {
    return price ? price.toFixed(2) : '0.00';
  }

  goBack() {
    this.navCtrl.back();
  }

  onTabChange(event: { index: number; item: NavItem }) {
    this.activeTab = event.index;
    const id = event.item?.id;

    if (id === 'dashboard' || id === 'home') {
      this.navCtrl.navigateRoot('/dashboard');
    } else if (id === 'profile') {
      this.navCtrl.navigateRoot('/profile-hub');
    } else if (id === 'search' || id === 'add') {
      this.navCtrl.navigateRoot('/search');
    } else if (id === 'orders') {
      this.navCtrl.navigateRoot('/orders');
    } else if (id === 'favorites') {
      this.navCtrl.navigateRoot('/favorites');
    }
  }
}