import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ModalController, NavController, ToastController, 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonSearchbar, 
  IonContent, IonGrid, IonRow, IonCol, IonChip 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { optionsOutline, star, fastFoodOutline, cartOutline, arrowForwardOutline, storefrontOutline } from 'ionicons/icons';
import { ItemsService, ProductItem } from '../../../../core/services/items.service';
import { CartService } from '../../../../core/services/cart.service';
import { ProductDetailComponent } from '../../../../shared/components/product-detail/product-detail.component';
import { NavItem } from '../../../../shared/components/curved-bottom-nav/curved-bottom-nav.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonSearchbar,
    IonContent, IonGrid, IonRow, IonCol, IonChip
  ]
})
export class ItemsPage implements OnInit, OnDestroy, AfterViewInit {
  categoryName: string = 'All Items';
  searchQuery: string = '';
  filteredItems: ProductItem[] = [];
  activeNavIndex: number = 0;
  returnUrl: string = '/dashboard';

  private subs: Subscription[] = [];
  private viewReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private itemsService: ItemsService,
    private cartService: CartService,
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ optionsOutline, star, fastFoodOutline, cartOutline, arrowForwardOutline, storefrontOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.categoryName = params['name'] || params['category'] || 'All Items';
      this.searchQuery = params['search'] || '';

      if (params['returnTo']) {
        this.returnUrl = `/${params['returnTo']}`;
      }

      this.loadFilteredItems();
    });

    // The catalogue is loaded asynchronously; this app runs without zone.js,
    // so re-read and repaint the moment it (or a vendor edit) arrives —
    // otherwise a direct link to this page renders its empty state.
    this.subs.push(
      this.itemsService.items$.subscribe(() => {
        this.loadFilteredItems();
        if (this.viewReady) this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit() {
    this.viewReady = true;
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // The catalogue is shared with the vendor app, so re-read it every time
  // this page comes to the front — a dish added or sold out in the vendor
  // console shows up here without restarting anything.
  ionViewWillEnter() {
    this.loadFilteredItems();
    if (this.viewReady) this.cdr.detectChanges();
  }

  loadFilteredItems() {
    this.filteredItems = this.itemsService.searchItems(this.searchQuery, this.categoryName);
  }

  filterItems() {
    this.loadFilteredItems();
  }

  async selectItem(item: ProductItem) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailComponent,
      componentProps: {
        item: item, // FIX: Passed the full item object so the detail modal can read item.price
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        imageUrl: item.imageUrl,
        rating: item.rating,
        basePrice: item.price,
        restaurantName: item.vendorName || 'FOOD EAGLE KITCHEN'
      },
      cssClass: 'custom-popup-modal',
      mode: 'ios'
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      if (data.action === 'checkout' || data.action === 'add') {
        const qty = data.quantity || 1;
        
        this.cartService.addItem({
          id: item.id || item.title,
          name: item.title,
          price: item.price,
          quantity: qty,
          image: item.imageUrl,
          // Carried through to checkout so a mixed basket can be split
          // into one order per store.
          vendorId: item.vendorId,
          vendorName: item.vendorName
        });
        
        await this.presentAddToast(item.title, qty);

        if (data.action === 'checkout') {
          this.router.navigate(['/cart']);
        }
      }
    }
  }

  async addToCart(item: ProductItem, event: Event) {
    event.stopPropagation();
    
    this.cartService.addItem({
      id: item.id || item.title,
      name: item.title,
      price: item.price,
      quantity: 1,
      image: item.imageUrl,
      vendorId: item.vendorId,
      vendorName: item.vendorName
    });

    await this.presentAddToast(item.title, 1);
  }

  async presentAddToast(itemName: string, quantity: number) {
    const toast = await this.toastController.create({
      message: `Added ${quantity}x ${itemName} to cart`,
      duration: 1500,
      position: 'bottom',
      color: 'dark',
      cssClass: 'modern-toast'
    });
    await toast.present();
  }

  openFilter() {}

  /** Store name on a dish card opens that store's own page. */
  openStore(item: ProductItem, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/restaurant-detail'], {
      queryParams: { vendor: item.vendorId, name: item.vendorName }
    });
  }

  goBack() {
    this.router.navigate([this.returnUrl]);
  }

  onTabSelected(event: { index: number; item: NavItem }) {
    this.activeNavIndex = event.index;
    const id = event.item.id;
    if (id === 'home') this.navCtrl.navigateRoot('/dashboard');
    else if (id === 'profile') this.router.navigate(['/profile-hub']);
    else if (id === 'search') this.navCtrl.navigateRoot('/search');
    else if (id === 'orders') this.router.navigate(['/orders']);
    else if (id === 'favorites') this.router.navigate(['/favorites']);
  }
}