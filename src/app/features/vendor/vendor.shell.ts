import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  receiptOutline,
  restaurantOutline,
  storefrontOutline,
  walletOutline,
  logOutOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { VendorService } from '../../core/services/vendor.service';
import { VendorProfile } from '../../core/models/platform.model';
import { CurvedBottomNavComponent, NavItem } from '../../shared/components/curved-bottom-nav/curved-bottom-nav.component';

export interface AppNavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

/**
 * Shared chrome for the Restaurant / Vendor app: which store is open, who
 * is signed in, and where the five screens live. Every vendor page renders
 * inside this shell, so the outlet below is the only route matcher.
 */
@Component({
  selector: 'app-vendor-shell',
  template: `
    <div class="shell app-shell--vendor">
      <header class="shell-topbar">
        <div class="brand">
          <div class="brand-badge">V</div>
          <div class="brand-text">
            <div class="brand-title">{{ store ? store.name : 'Vendor Console' }}</div>
            <div class="brand-sub">
              {{ store ? store.spot : 'Connecting' }}
              <span *ngIf="store"> · {{ store.acceptingOrders ? 'Accepting orders' : 'Paused' }}</span>
            </div>
          </div>
        </div>

        <div class="topbar-actions">
          <button
            *ngIf="owned.length > 1"
            class="icon-btn"
            title="Switch outlet"
            (click)="switchStore()"
          >
            <ion-icon name="swap-horizontal-outline"></ion-icon>
          </button>
          <button class="icon-btn" title="Sign out" (click)="signOut()">
            <ion-icon name="log-out-outline"></ion-icon>
          </button>
        </div>
      </header>

      <router-outlet></router-outlet>

      <!-- Same curved bottom navigation as the customer app, with the
           vendor's five tabs — one uniform bar across both apps. -->
      <app-curved-bottom-nav [items]="navItems" [alwaysShow]="true"></app-curved-bottom-nav>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonIcon, CurvedBottomNavComponent],
})
export class VendorShellComponent implements OnInit, OnDestroy {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }
  private readonly ownedState = signal<VendorProfile[]>([]);
  get owned(): VendorProfile[] { return this.ownedState(); }

  readonly navItems: NavItem[] = [
    { id: 'home', path: '/vendor', label: 'Home', icon: 'grid-outline' },
    { id: 'orders', path: '/vendor/orders', label: 'Orders', icon: 'receipt-outline' },
    { id: 'menu', path: '/vendor/menu', label: 'Menu', icon: 'restaurant-outline' },
    { id: 'store', path: '/vendor/store', label: 'Store', icon: 'storefront-outline' },
    { id: 'earnings', path: '/vendor/earnings', label: 'Earnings', icon: 'wallet-outline' },
  ];

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private auth: AuthService,
    private vendors: VendorService,
    private toast: ToastController
  ) {
    addIcons({
      gridOutline,
      receiptOutline,
      restaurantOutline,
      storefrontOutline,
      walletOutline,
      logOutOutline,
      swapHorizontalOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadOwned();

    this.subs.push(
      this.vendors.stores$.subscribe(() => void this.loadOwned()),
      this.vendors.activeStoreId$.subscribe(() => {
        this.storeState.set( this.owned.find(s => s.id === this.vendors.activeStoreId) ?? null);
      })
      // The tab highlight reads straight from the router on every change
      // detection pass, so no navigation subscription is needed.
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private async loadOwned(): Promise<void> {
    const user = this.auth.currentUser;
    this.ownedState.set( user ? await this.vendors.ownedBy(user.identifier) : []);
    if (!this.store || !this.owned.some(s => s.id === this.store!.id)) {
      this.storeState.set( this.owned[0] ?? (await this.vendors.firstUnclaimed()));
      if (this.store) this.vendors.setActiveStore(this.store.id);
    } else {
      this.storeState.set( this.owned.find(s => s.id === this.store!.id) ?? this.store);
    }
  }

  /** Small shops often run several stalls — cycle through owned outlets. */
  async switchStore(): Promise<void> {
    if (this.owned.length < 2) return;
    const idx = this.owned.findIndex(s => s.id === this.store?.id);
    const next = this.owned[(idx + 1) % this.owned.length];
    this.vendors.setActiveStore(next.id);
    this.storeState.set( next);

    const toast = await this.toast.create({ message: `Switched to ${next.name}`, duration: 1600 });
    await toast.present();
  }

  isActive(path: string): boolean {
    const url = this.router.url.split('?')[0];
    return path === '/vendor' ? url === '/vendor' : url.startsWith(path);
  }

  go(path: string): void {
    if (this.router.url.split('?')[0] !== path) {
      void this.router.navigateByUrl(path);
    }
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}