import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { receiptOutline, searchOutline } from 'ionicons/icons';
import { OrderService } from '../../../../core/services/order.service';
import {
  OrderStatus,
  PlatformOrder,
  STATUS_LABEL,
  pesos,
} from '../../../../core/models/platform.model';

interface StatusFilter {
  key: string;
  label: string;
  match: (o: PlatformOrder) => boolean;
}

/**
 * Admin · Orders — the full ledger.
 *
 * Read-only by design: the admin can see and investigate everything but
 * cannot rewrite somebody else's workflow step. Disputes are resolved by
 * talking to the vendor or rider, not by editing history.
 */
@Component({
  selector: 'app-admin-orders',
  template: `
    <div class="admin-card">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px">
        <div style="position: relative; flex: 1; min-width: 220px">
          <input
            type="search"
            placeholder="Search order code, customer, store..."
            [(ngModel)]="query"
            style="width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px 10px 34px; font-size: 0.82rem"
          />
          <ion-icon
            name="search-outline"
            style="position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8"
          ></ion-icon>
        </div>
        <select
          [(ngModel)]="statusKey"
          style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 0.82rem"
        >
          <option *ngFor="let f of filters" [value]="f.key">{{ f.label }}</option>
        </select>
      </div>

      <div *ngIf="!visible.length" class="empty-state">
        <h4>No matching orders</h4>
        <p>Adjust the filter or clear the search box.</p>
      </div>

      <table class="admin-table" *ngIf="visible.length">
        <thead>
          <tr>
            <th>Order</th>
            <th>Store</th>
            <th>Customer</th>
            <th>Rider</th>
            <th>Status</th>
            <th>Placed</th>
            <th class="num">Subtotal</th>
            <th class="num">Fee</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of visible">
            <td>
              <strong>{{ o.code }}</strong>
              <div class="kpi-hint">{{ o.paymentMethod === 'cod' ? 'Cash' : 'Online' }} · {{ o.paid ? 'paid' : 'unpaid' }}</div>
            </td>
            <td>{{ o.vendorName }}<div class="kpi-hint">{{ o.pickupSpot }}</div></td>
            <td>{{ o.customerName }}<div class="kpi-hint">{{ o.dropoffBuilding }}</div></td>
            <td>{{ o.riderName ?? '—' }}</td>
            <td><span class="pill" [ngClass]="'pill--' + o.status">{{ label(o.status) }}</span></td>
            <td>{{ date(o.placedAt) }}</td>
            <td class="num">{{ peso(o.subtotal) }}</td>
            <td class="num">{{ peso(o.commission) }}</td>
            <td class="num">{{ peso(o.total) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="kpi-hint" style="margin-top: 12px; text-align: right">
        Showing {{ visible.length }} of {{ orders.length }} orders ·
        total value {{ peso(visibleValue) }}
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AdminOrdersPage implements OnInit {
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }
  query = '';
  statusKey = 'all';

  readonly filters: StatusFilter[] = [
    { key: 'all', label: 'All statuses', match: () => true },
    { key: 'live', label: 'Live', match: o => !['delivered', 'declined', 'cancelled'].includes(o.status) },
    { key: 'placed', label: STATUS_LABEL.placed, match: o => o.status === 'placed' },
    { key: 'preparing', label: STATUS_LABEL.preparing, match: o => o.status === 'preparing' },
    { key: 'ready', label: STATUS_LABEL.ready, match: o => o.status === 'ready' },
    { key: 'delivering', label: STATUS_LABEL.delivering, match: o => o.status === 'delivering' },
    { key: 'delivered', label: STATUS_LABEL.delivered, match: o => o.status === 'delivered' },
    { key: 'cancelled', label: 'Cancelled / declined', match: o => o.status === 'cancelled' || o.status === 'declined' },
  ];

  constructor(private ledger: OrderService) {
    addIcons({ receiptOutline, searchOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    this.ledger.ledger$.subscribe(orders => (this.ordersState.set( orders)));
  }

  get visible(): PlatformOrder[] {
    const filter = this.filters.find(f => f.key === this.statusKey) ?? this.filters[0];
    const q = this.query.trim().toLowerCase();

    return this.orders.filter(o => {
      if (!filter.match(o)) return false;
      if (!q) return true;
      return (
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q) ||
        (o.riderName ?? '').toLowerCase().includes(q)
      );
    });
  }

  get visibleValue(): number {
    return round(this.visible.reduce((sum, o) => sum + o.total, 0));
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
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