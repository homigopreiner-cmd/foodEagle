import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { UserDataService, FavoriteItem } from '../../services/user-data.service';

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
export class FavoritesPage implements OnInit, OnDestroy {

  favorites: FavoriteItem[] = [];

  private docSub?: Subscription;

  constructor(
    private router: Router,
    private userData: UserDataService
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
    this.docSub = this.userData.doc$.subscribe(doc => {
      this.favorites = doc.favorites;
    });
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