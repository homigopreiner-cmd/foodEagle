import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { walletOutline, cashOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  PlatformOrder,
  PLATFORM_COMMISSION_RATE,
  VendorProfile,
  pesos,
} from '../../../../core/models/platform.model';

/**
 * Vendor · Earnings — what the platform actually owes the store.
 *
 * Payouts are only counted on delivered orders, and the platform commission
 * is shown line by line instead of being hidden in a rounding difference.
 */
@Component({
  selector: 'app-vendor-earnings',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Earnings</h1>
          <p>{{ store ? store.name : 'No store selected' }}</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat is-accent">
          <div class="stat-label">Net payout</div>
          <div class="stat-value">{{ peso(netPayout) }}</div>
          <div class="stat-hint">after {{ commissionPercent }}% platform fee</div>
        </div>
        <div class="stat">
          <div class="stat-label">Gross sales</div>
          <div class="stat-value">{{ peso(grossSales) }}</div>
          <div class="stat-hint">delivered orders</div>
        </div>
        <div class="stat">
          <div class="stat-label">Platform fees</div>
          <div class="stat-value">{{ peso(totalCommission) }}</div>
          <div class="stat-hint">Food Eagle commission</div>
        </div>
        <div class="stat">
          <div class="stat-label">Orders paid</div>
          <div class="stat-value">{{ settled.length }}</div>
          <div class="stat-hint">successfully delivered</div>
        </div>
      </div>

      <div class="card">
        <h3>How the split works</h3>
        <div class="list-row">
          <div class="list-main"><div class="list-title">You keep</div><div class="list-sub">Item subtotal, less the platform fee</div></div>
          <div class="list-end">100% − {{ commissionPercent }}%</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Delivery fee</div><div class="list-sub">Collected by the platform, paid to the rider</div></div>
          <div class="list-end">—</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Payout schedule</div><div class="list-sub">Settled every Friday for the week's deliveries</div></div>
          <div class="list-end">Weekly</div>
        </div>
      </div>

      <div class="card">
        <h3>Settled orders</h3>

        <div class="empty-state" *ngIf="!settled.length">
          <ion-icon name="wallet-outline"></ion-icon>
          <h4>Nothing settled yet</h4>
          <p>Delivered orders show up here with the payout breakdown.</p>
        </div>

        <div class="list-row" *ngFor="let o of settled">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.customerName }}</div>
            <div class="list-sub">{{ date(o.updatedAt) }} · {{ o.items.length }} item(s)</div>
          </div>
          <div class="list-end">
            {{ peso(payoutOf(o)) }}
            <div class="list-sub" style="font-weight: 500">
              of {{ peso(o.subtotal) }}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Payout summary</h3>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Total sales</div></div>
          <div class="list-end">{{ peso(grossSales) }}</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Platform commission</div></div>
          <div class="list-end">− {{ peso(totalCommission) }}</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title" style="font-weight: 800">Net payout</div></div>
          <div class="list-end" style="font-size: 1rem">{{ peso(netPayout) }}</div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class VendorEarningsPage implements OnInit {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }
  private readonly settledState = signal<PlatformOrder[]>([]);
  get settled(): PlatformOrder[] { return this.settledState(); }

  readonly commissionPercent = Math.round(PLATFORM_COMMISSION_RATE * 100);

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private ledger: OrderService
  ) {
    addIcons({ walletOutline, cashOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    const user = this.auth.currentUser;
    if (!user) return;

    const owned = await this.vendors.ownedBy(user.identifier);
    this.storeState.set( owned.find(s => s.id === this.vendors.activeStoreId) ?? owned[0] ?? null);
    if (this.store) this.vendors.setActiveStore(this.store.id);

    this.settledState.set( this.store
      ? this.ledger.forVendor(this.store.id).filter(o => o.status === 'delivered')
      : []);
  }

  get grossSales(): number {
    return round(this.settled.reduce((sum, o) => sum + o.subtotal, 0));
  }

  get totalCommission(): number {
    return round(this.settled.reduce((sum, o) => sum + o.commission, 0));
  }

  get netPayout(): number {
    return round(this.grossSales - this.totalCommission);
  }

  payoutOf(order: PlatformOrder): number {
    return round(order.subtotal - order.commission);
  }

  peso = (value: number) => pesos(value);

  date(iso: string): string {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}