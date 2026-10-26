import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  peopleOutline,
  storefrontOutline,
  bicycleOutline,
  flameOutline,
  receiptOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { AuthService, PublicUser } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { RiderService } from '../../../../core/services/rider.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  OrderStatus,
  PlatformOrder,
  STATUS_LABEL,
  VendorProfile,
  isActiveStatus,
  pesos,
} from '../../../../core/models/platform.model';

/**
 * Admin · Dashboard — the operator's morning screen.
 *
 * Six numbers, one live queue and a store league table. Every figure is
 * computed from the same ledger the other three apps write to, so there is
 * no reporting copy of the data that could disagree with reality.
 */
@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-grid">
      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="cart-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Gross sales</div>
          <div class="kpi-value">{{ peso(gmv) }}</div>
          <div class="kpi-hint">{{ stats.delivered }} orders delivered</div>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="flame-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Live orders</div>
          <div class="kpi-value">{{ stats.active }}</div>
          <div class="kpi-hint">in progress right now</div>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="receipt-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Total orders</div>
          <div class="kpi-value">{{ stats.total }}</div>
          <div class="kpi-hint">{{ stats.cancelled }} cancelled / declined</div>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="people-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Customers</div>
          <div class="kpi-value">{{ userCounts().customer }}</div>
          <div class="kpi-hint">{{ totalUsers }} accounts total</div>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="storefront-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Stores</div>
          <div class="kpi-value">{{ stores().length }}</div>
          <div class="kpi-hint">{{ approvedStores }} approved</div>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="bicycle-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Riders online</div>
          <div class="kpi-value">{{ onlineRiders }}</div>
          <div class="kpi-hint">{{ riders().length }} in the pool</div>
        </div>
      </div>
    </div>

    <div class="admin-two-col">
      <div class="admin-card">
        <h3>Live order feed</h3>
        <div *ngIf="!live.length" class="empty-state">
          <h4>No live orders</h4>
          <p>Everything on the platform has been settled.</p>
        </div>
        <table class="admin-table" *ngIf="live.length">
          <thead>
            <tr>
              <th>Order</th>
              <th>Store</th>
              <th>Customer</th>
              <th>Status</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of live">
              <td><strong>{{ o.code }}</strong><div class="kpi-hint">{{ time(o.placedAt) }}</div></td>
              <td>{{ o.vendorName }}</td>
              <td>{{ o.customerName }}<div class="kpi-hint">{{ o.riderName ?? 'Unassigned' }}</div></td>
              <td><span class="pill" [ngClass]="'pill--' + o.status">{{ label(o.status) }}</span></td>
              <td class="num">{{ peso(o.total) }}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 12px">
          <a routerLink="/admin/orders" style="font-size: 0.8rem; font-weight: 700">Open the full ledger →</a>
        </div>
      </div>

      <div>
        <div class="admin-card">
          <h3>Store league table</h3>
          <table class="admin-table">
            <thead>
              <tr><th>Store</th><th class="num">Orders</th><th class="num">Sales</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of league">
                <td>
                  <strong>{{ row.name }}</strong>
                  <div class="kpi-hint">{{ row.spot }}</div>
                </td>
                <td class="num">{{ row.orders }}</td>
                <td class="num">{{ peso(row.sales) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-card">
          <h3>Needs attention</h3>
          <p *ngIf="!pendingStores.length && !waitingRiders" style="font-size: 0.8rem; color: #64748b; margin: 0">
            Nothing is waiting on you right now.
          </p>
          <p *ngIf="pendingStores.length" style="font-size: 0.8rem; margin: 0 0 8px">
            <strong>{{ pendingStores.length }}</strong> store(s) pending approval —
            <a routerLink="/admin/stores">review</a>
          </p>
          <p *ngIf="waitingRiders" style="font-size: 0.8rem; margin: 0">
            <strong>{{ waitingRiders }}</strong> order(s) ready but unclaimed by a rider —
            <a routerLink="/admin/riders">check the pool</a>
          </p>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon],
})
export class AdminDashboardPage implements OnInit {
  /** All state here is a signal so the zoneless router repaints on change. */
  readonly orders = signal<PlatformOrder[]>([]);
  readonly stores = signal<VendorProfile[]>([]);
  readonly riders = signal<Array<{ id: string; name: string; online: boolean }>>([]);
  readonly users = signal<PublicUser[]>([]);
  readonly userCounts = signal({ customer: 0, vendor: 0, rider: 0, admin: 0 });

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private riderService: RiderService,
    private ledger: OrderService
  ) {
    addIcons({
      cartOutline,
      peopleOutline,
      storefrontOutline,
      bicycleOutline,
      flameOutline,
      receiptOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await forkJoin({
      ledger: this.ledger.ready(),
      vendors: this.vendors.ready(),
      riders: this.riderService.ready(),
      users: this.auth.whenReady(),
    }).toPromise();

    this.stores.set(await this.vendors.all());
    this.riders.set(await this.riderService.all());
    const users = await this.auth.listUsers();
    this.users.set(users);
    this.userCounts.set({
      customer: users.filter(u => u.role === 'customer').length,
      vendor: users.filter(u => u.role === 'vendor').length,
      rider: users.filter(u => u.role === 'rider').length,
      admin: users.filter(u => u.role === 'admin').length,
    });

    this.ledger.ledger$.subscribe(orders => this.orders.set(orders));
  }

  get stats() {
    return this.ledger.stats(this.orders());
  }

  get gmv(): number {
    return this.stats.revenue;
  }

  get live(): PlatformOrder[] {
    return this.orders().filter(o => isActiveStatus(o.status)).slice(0, 8);
  }

  get totalUsers(): number {
    return this.users().length;
  }

  get onlineRiders(): number {
    return this.riders().filter(r => r.online).length;
  }

  get approvedStores(): number {
    return this.stores().filter(s => s.approved).length;
  }

  get pendingStores() {
    return this.stores().filter(s => !s.approved);
  }

  get waitingRiders(): number {
    return this.ledger.availableOffers().length;
  }

  get league() {
    return this.stores()
      .map(store => {
        const mine = this.orders().filter(o => o.vendorId === store.id);
        return {
          name: store.name,
          spot: store.spot,
          orders: mine.length,
          sales: round(mine.filter(o => o.status !== 'cancelled' && o.status !== 'declined')
            .reduce((sum, o) => sum + o.total, 0)),
        };
      })
      .sort((a, b) => b.sales - a.sales);
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
  peso = (value: number) => pesos(value);

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}