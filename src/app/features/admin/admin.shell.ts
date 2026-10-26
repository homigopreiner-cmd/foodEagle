import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  speedometerOutline,
  receiptOutline,
  storefrontOutline,
  bicycleOutline,
  peopleOutline,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService, PublicUser } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Admin Panel shell — the desktop web dashboard.
 *
 * Deliberately different from the two mobile apps: a fixed sidebar with the
 * live order counter, and a fluid content column, because an operator
 * monitors rather than acts. Same router, same guards, same data — only the
 * layout changes.
 */
@Component({
  selector: 'app-admin-shell',
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <img class="brand-logo" src="assets/images/food-eagle-logo.png" alt="" />
          <div>
            <div class="brand-title">food<span class="brand-glow">Eagle</span></div>
            <div class="brand-sub">Admin Console</div>
          </div>
        </div>

        <nav>
          <button
            *ngFor="let item of navItems"
            class="nav-item"
            [class.active]="isActive(item.path)"
            (click)="go(item.path)"
          >
            <ion-icon [name]="item.icon"></ion-icon>
            <span>{{ item.label }}</span>
            <span *ngIf="item.path === '/admin' && liveOrders" class="nav-badge">
              {{ liveOrders }}
            </span>
          </button>
        </nav>

        <div class="admin-user">
          <div>
            <div class="admin-user-name">{{ user?.name ?? 'Admin' }}</div>
            <div class="admin-user-role">{{ user?.identifier }}</div>
          </div>
          <button class="icon-btn" title="Sign out" (click)="signOut()">
            <ion-icon name="log-out-outline"></ion-icon>
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div>
            <h2>{{ title }}</h2>
            <div class="admin-topbar-sub">{{ subtitle }}</div>
          </div>
          <span class="pill pill--delivered">Platform live</span>
        </div>

        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonIcon],
})
export class AdminShellComponent implements OnInit, OnDestroy {
  user: PublicUser | null = null;
  liveOrders = 0;
  title = 'Overview';
  subtitle = 'Campus food delivery at a glance';

  readonly navItems: AdminNavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: 'speedometer-outline' },
    { path: '/admin/orders', label: 'Orders', icon: 'receipt-outline' },
    { path: '/admin/stores', label: 'Stores', icon: 'storefront-outline' },
    { path: '/admin/riders', label: 'Riders', icon: 'bicycle-outline' },
    { path: '/admin/users', label: 'Users', icon: 'people-outline' },
  ];

  /** Screen heading per route, so the top bar always reads correctly. */
  private static readonly HEADINGS: Record<string, [string, string]> = {
    '/admin': ['Overview', 'Campus food delivery at a glance'],
    '/admin/orders': ['Order ledger', 'Every order across every store'],
    '/admin/stores': ['Stores', 'Approve, suspend and monitor partners'],
    '/admin/riders': ['Rider pool', 'Availability and delivery performance'],
    '/admin/users': ['Users', 'Accounts and roles on the platform'],
  };

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private auth: AuthService,
    private ledger: OrderService
  ) {
    addIcons({
      speedometerOutline,
      receiptOutline,
      storefrontOutline,
      bicycleOutline,
      peopleOutline,
      logOutOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    this.user = this.auth.currentUser;

    this.subs.push(
      this.ledger.ledger$.subscribe(orders => {
        this.liveOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'declined' && o.status !== 'cancelled').length;
      }),
      this.router.events.subscribe(e => {
        if (e instanceof NavigationEnd) this.syncRoute(this.router.url);
      })
    );
    this.syncRoute(this.router.url);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private syncRoute(url: string): void {
    const clean = url.split('?')[0];
    const heading = AdminShellComponent.HEADINGS[clean];
    if (heading) {
      this.title = heading[0];
      this.subtitle = heading[1];
    }
  }

  isActive(path: string): boolean {
    const url = this.router.url.split('?')[0];
    return path === '/admin' ? url === '/admin' : url.startsWith(path);
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