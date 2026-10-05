import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, Event } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  personOutline, 
  searchOutline, 
  documentTextOutline, 
  cartOutline 
} from 'ionicons/icons';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-curved-bottom-nav',
  templateUrl: './curved-bottom-nav.component.html',
  styleUrls: ['./curved-bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class CurvedBottomNavComponent implements OnInit, OnDestroy {
  activeIndex: number = 0;
  showNav: boolean = true;
  private routerSub!: Subscription;

  private hiddenRoutes: string[] = [
    '/splash',
    '/walkthrough',
    '/login',
    '/create-account',
    '/tiktok-signup',
    '/google-signup',
    '/facebook-signup',
    '/location-setup',
    '/otp',
    '/forgot-password',
    '/order-success'
  ];

  // Cart is now in the bottom navigation bar instead of Favorites
  navItems: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', label: 'Home', icon: 'home-outline' },
    { id: 'cart', path: '/cart', label: 'Cart', icon: 'cart-outline' },
    { id: 'search', path: '/search', label: 'Search', icon: 'search-outline' }, 
    { id: 'orders', path: '/orders', label: 'Orders', icon: 'document-text-outline' },
    { id: 'profile', path: '/profile-hub', label: 'Profile', icon: 'person-outline' }
  ];

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    addIcons({ homeOutline, personOutline, searchOutline, documentTextOutline, cartOutline });
  }

  ngOnInit() {
    this.syncWithCurrentUrl(this.router.url);

    this.routerSub = this.router.events.subscribe((event: Event) => {
      this.ngZone.run(() => {
        this.syncWithCurrentUrl(this.router.url);
      });
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  get navbarPath(): string {
    const cx = this.activeIndex * 100 + 50; 
    const x1 = cx - 40;
    const x2 = cx + 40;

    return `M 0,20 ` +
           `L ${x1},20 ` +
           `C ${cx - 22},20 ${cx - 24},58 ${cx},58 ` +
           `C ${cx + 24},58 ${cx + 22},20 ${x2},20 ` +
           `L 500,20 ` +
           `L 500,80 L 0,80 Z`;
  }

  private syncWithCurrentUrl(rawUrl: string) {
    if (!rawUrl) return;
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];

    const isHiddenRoute = this.hiddenRoutes.some(route => 
      cleanUrl === route || cleanUrl.startsWith(route + '/')
    );

    if (isHiddenRoute) {
      this.showNav = false;
      this.cdRef.detectChanges();
      return;
    }

    this.showNav = true;

    const matchedIndex = this.navItems.findIndex(item => {
      if (item.id === 'dashboard') {
        return cleanUrl === '/dashboard' || cleanUrl === '/' || cleanUrl.includes('dashboard');
      }
      return cleanUrl.includes(item.path);
    });

    if (matchedIndex !== -1 && matchedIndex !== this.activeIndex) {
      this.activeIndex = matchedIndex;
    }
    this.cdRef.detectChanges();
  }

  selectTab(index: number, item: NavItem) {
    if (this.activeIndex !== index) {
      this.activeIndex = index;
      this.cdRef.detectChanges();
    }

    this.router.navigate([item.path]).catch(err => {
      console.error(`[Navigation Failed] Check app.routes.ts for path: ${item.path}`, err);
    });
  }
}