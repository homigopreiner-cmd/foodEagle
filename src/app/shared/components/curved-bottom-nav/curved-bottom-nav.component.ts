import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, Input } from '@angular/core';
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

  /**
   * Lets a shell embed this same bar as its own tab bar (the vendor console
   * passes its five tabs), so the customer and vendor apps share one
   * uniform bottom navigation — same height, curve, bubble and palette.
   */
  @Input() items: NavItem[] | null = null;
  /** Render unconditionally instead of only on customer routes. */
  @Input() alwaysShow = false;

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
    '/order-success',
    // The three other apps ship their own navigation.
    '/vendor',
    '/rider',
    '/admin'
  ];

  // Cart is now in the bottom navigation bar instead of Favorites
  private readonly defaultItems: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', label: 'Home', icon: 'home-outline' },
    { id: 'cart', path: '/cart', label: 'Cart', icon: 'cart-outline' },
    { id: 'search', path: '/search', label: 'Search', icon: 'search-outline' },
    { id: 'orders', path: '/orders', label: 'Orders', icon: 'document-text-outline' },
    { id: 'profile', path: '/profile-hub', label: 'Profile', icon: 'person-outline' }
  ];

  /** Effective tab set: the embedded shell's items, else the customer tabs. */
  get navItems(): NavItem[] {
    return this.items && this.items.length ? this.items : this.defaultItems;
  }

  /** Track width as a percentage of the 500-wide SVG viewBox. */
  get trackWidth(): number {
    return 100 / this.navItems.length;
  }

  /**
   * Sliding-bubble translate offset. CSS translate percentages are relative
   * to the element's own width (one slot), so moving n slots right means
   * n * 100% — not n * slotWidth, which left the bubble stranded near the
   * first tabs whenever a later tab was active.
   */
  get indicatorX(): number {
    return this.activeIndex * 100;
  }

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
    const slot = 500 / this.navItems.length;
    const cx = this.activeIndex * slot + slot / 2;
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

    if (this.alwaysShow) {
      this.showNav = true;
      this.syncActiveIndex(cleanUrl);
      this.cdRef.detectChanges();
      return;
    }

    const isHiddenRoute = this.hiddenRoutes.some(route => 
      cleanUrl === route || cleanUrl.startsWith(route + '/')
    );

    if (isHiddenRoute) {
      this.showNav = false;
      this.cdRef.detectChanges();
      return;
    }

    this.showNav = true;
    this.syncActiveIndex(cleanUrl);
    this.cdRef.detectChanges();
  }

  private syncActiveIndex(cleanUrl: string): void {
    // Exact path first — otherwise '/vendor' would swallow '/vendor/menu'.
    let matchedIndex = this.navItems.findIndex(item => item.path === cleanUrl);
    if (matchedIndex === -1) {
      matchedIndex = this.navItems.findIndex(
        item => item.id !== 'dashboard' && cleanUrl.startsWith(item.path + '/')
      );
    }
    if (matchedIndex === -1) {
      matchedIndex = this.navItems.findIndex(
        item => item.id === 'dashboard' && (cleanUrl === item.path || cleanUrl.includes(item.path))
      );
    }

    if (matchedIndex !== -1 && matchedIndex !== this.activeIndex) {
      this.activeIndex = matchedIndex;
    }
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