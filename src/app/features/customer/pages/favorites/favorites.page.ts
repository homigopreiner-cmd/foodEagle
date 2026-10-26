import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonContent, 
  IonIcon, 
  IonButton,
  IonRippleEffect
} from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  heart, 
  heartOutline,
  heartDislikeOutline, 
  star, 
  bagHandle, 
  sparklesOutline,
  chevronBackOutline,
  storefrontOutline
} from 'ionicons/icons';
import { UserDataService, FavoriteItem } from '../../../../core/services/user-data.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonRippleEffect
  ]
})
export class FavoritesPage implements OnInit, OnDestroy, AfterViewInit {

  favorites: FavoriteItem[] = [];

  private docSub?: Subscription;
  private viewReady = false;

  constructor(
    private router: Router,
    private userData: UserDataService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ 
      heart, 
      heartOutline,
      heartDislikeOutline, 
      star, 
      bagHandle, 
      sparklesOutline,
      chevronBackOutline,
      storefrontOutline
    });
  }

  ngOnInit() {
    // Load this account's persisted favorites and keep them in sync.
    // The doc arrives asynchronously and this app runs without zone.js, so
    // repaint once the view exists — otherwise a fresh visit renders the
    // empty state even though favorites are saved.
    this.docSub = this.userData.doc$.subscribe(doc => {
      this.favorites = doc.favorites;
      if (this.viewReady) this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
  }

  ngOnDestroy() {
    this.docSub?.unsubscribe();
  }

  async removeFavorite(item: FavoriteItem, event: Event) {
    event.stopPropagation();
    // Persists the removal in the user's saved data.
    await this.userData.toggleFavorite(item);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  viewItem(item: FavoriteItem) {
    this.router.navigate(['/restaurant-detail'], { queryParams: { vendor: item.vendorKey } });
  }

  goToRestaurant(vendorKey: string, event: Event) {
    event.stopPropagation(); // Prevents parent card click trigger if any
    this.router.navigate(['/restaurant-detail'], { queryParams: { vendor: vendorKey } });
  }
}