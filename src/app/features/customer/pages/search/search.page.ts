import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ModalController, NavController,
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar, IonButton, IonIcon,
  IonChip, IonLabel, IonContent, IonList, IonItem, IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline, timeOutline, closeOutline,
  trendingUpOutline, star, openOutline, globeOutline, cloudOfflineOutline
} from 'ionicons/icons';
import { ItemsService, ProductItem } from '../../../../core/services/items.service';
import { ProductDetailComponent } from '../../../../shared/components/product-detail/product-detail.component';
import { NavItem } from '../../../../shared/components/curved-bottom-nav/curved-bottom-nav.component';
import { UserDataService } from '../../../../core/services/user-data.service';
import { WebSearchService, WebSearchResult } from '../../../../core/services/web-search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar, IonButton, IonIcon,
    IonChip, IonLabel, IonContent, IonList, IonItem, IonSpinner
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

  // "From the web" — pages found by the server-side Exa search.
  private readonly webSearch = inject(WebSearchService);
  webResults: WebSearchResult[] = [];
  webState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  webError = '';
  private lastWebQuery = '';
  /** Guards against an older search landing after a newer one. */
  private webRequestId = 0;

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
    addIcons({
      searchOutline, timeOutline, closeOutline, trendingUpOutline, star,
      openOutline, globeOutline, cloudOfflineOutline
    });
  }

  ngOnInit() {
    this.filteredResults = this.itemsService.getAllItems();
    // Recent searches live in the signed-in user's saved data.
    this.recentSearches = this.userData.current.recentSearches;
  }

  // Open the keyboard as soon as the page is shown
  ionViewDidEnter() {
    // The catalogue is shared with the vendor app, so re-read it on every
    // entry — dishes added or sold out in the vendor console show up here.
    this.filteredResults = this.itemsService.getAllItems();
    this.updateResults();
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
    // Web results belong to the term that produced them.
    if (this.searchQuery.trim() !== this.lastWebQuery) {
      this.webState = 'idle';
      this.webResults = [];
      this.webError = '';
    }
  }

  /** Enter / Search key on the keyboard. */
  onSearchSubmit() {
    this.updateResults();
    if (this.filteredResults.length) {
      this.commitRecent(this.searchQuery);
    }
    void this.searchWeb();
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
    void this.searchWeb();
    this.dismissKeyboard();
  }

  resetSearch() {
    this.searchQuery = '';
    this.selectedFilter = 'All';
    this.updateResults();
    this.resetWebSearch();
    this.searchbar?.setFocus();
  }

  // ---------- From the web (Exa, called server-side) ----------

  /**
   * Asks the local search server for pages the catalogue does not have.
   *
   * The server owns the Exa key; this page only ever receives JSON. Every
   * outcome — including a missing key or an unreachable server — becomes a
   * state the section can show, never a silently empty list.
   */
  async searchWeb() {
    const query = this.searchQuery.trim();
    if (query.length < 2) {
      this.resetWebSearch();
      return;
    }

    const requestId = ++this.webRequestId;
    this.lastWebQuery = query;
    this.webState = 'loading';
    this.webError = '';

    try {
      const results = await this.webSearch.search(query);
      if (requestId !== this.webRequestId) return;
      this.webResults = results;
      this.webState = 'ready';
    } catch (error) {
      if (requestId !== this.webRequestId) return;
      this.webResults = [];
      this.webError = error instanceof Error ? error.message : 'The web search failed.';
      this.webState = 'error';
    }
  }

  private resetWebSearch() {
    this.webRequestId++;
    this.lastWebQuery = '';
    this.webResults = [];
    this.webError = '';
    this.webState = 'idle';
  }

  /** "www.example.com" → "example.com", for the result's source line. */
  hostOf(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  formatPublished(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
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
        restaurantName: item.vendorName || 'FOOD EAGLE KITCHEN'
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