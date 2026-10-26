import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { VendorService } from '../../../../core/services/vendor.service';
import { MenuService } from '../../../../core/services/menu.service';
import { OrderService } from '../../../../core/services/order.service';
import { PlatformOrder, VendorProfile, pesos } from '../../../../core/models/platform.model';

interface StoreRow {
  store: VendorProfile;
  menuCount: number;
  orders: number;
  sales: number;
  live: number;
}

/**
 * Admin · Stores — partner moderation.
 *
 * Approval is the gate that keeps a store invisible to shoppers until the
 * platform has vetted it, and suspension is the same switch turned back
 * off. Neither deletes data, so a suspended store resumes exactly where it
 * stopped.
 */
@Component({
  selector: 'app-admin-stores',
  template: `
    <div class="admin-card">
      <h3>Partner stores</h3>

      <div *ngIf="!rows.length" class="empty-state">
        <h4>No stores yet</h4>
        <p>Stores appear here once the vendor catalogue is seeded.</p>
      </div>

      <table class="admin-table" *ngIf="rows.length">
        <thead>
          <tr>
            <th>Store</th>
            <th>Owner</th>
            <th>Menu</th>
            <th class="num">Live</th>
            <th class="num">Orders</th>
            <th class="num">Sales</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>
              <strong>{{ row.store.name }}</strong>
              <div class="kpi-hint">{{ row.store.spot }} · {{ row.store.hours }}</div>
            </td>
            <td>{{ row.store.ownerIdentifier ?? 'Unclaimed' }}</td>
            <td>{{ row.menuCount }} items</td>
            <td class="num">{{ row.live }}</td>
            <td class="num">{{ row.orders }}</td>
            <td class="num">{{ peso(row.sales) }}</td>
            <td>
              <span class="pill" [ngClass]="row.store.approved ? 'pill--delivered' : 'pill--declined'">
                {{ row.store.approved ? 'Approved' : 'Pending' }}
              </span>
              <span
                class="pill pill--preparing"
                *ngIf="!row.store.acceptingOrders"
                style="margin-left: 4px"
              >Paused</span>
            </td>
            <td>
              <button
                class="btn btn--sm"
                [class.btn--ghost]="row.store.approved"
                (click)="toggleApproval(row.store)"
              >
                {{ row.store.approved ? 'Suspend' : 'Approve' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="admin-card">
      <h3>What an admin controls</h3>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0">
        Approval only changes visibility — the store, its menu and its order
        history stay intact. Pausing a store (done by the vendor themselves)
        shows here as "Paused" but keeps the store approved.
      </p>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class AdminStoresPage implements OnInit {
  private readonly rowsState = signal<StoreRow[]>([]);
  get rows(): StoreRow[] { return this.rowsState(); }
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }

  constructor(
    private vendors: VendorService,
    private menu: MenuService,
    private ledger: OrderService,
    private toast: ToastController
  ) {}

  async ngOnInit(): Promise<void> {
    await forkJoin([this.vendors.ready(), this.menu.ready(), this.ledger.ready()]).toPromise();
    this.ledger.ledger$.subscribe(orders => {
      this.ordersState.set( orders);
      void this.refresh();
    });
    this.vendors.stores$.subscribe(() => void this.refresh());
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    const stores = await this.vendors.all();
    this.rowsState.set( await Promise.all(
      stores.map(async store => {
        const mine = this.orders.filter(o => o.vendorId === store.id);
        return {
          store,
          menuCount: (await this.menu.byVendor(store.id)).length,
          orders: mine.length,
          sales: round(
            mine
              .filter(o => o.status !== 'cancelled' && o.status !== 'declined')
              .reduce((sum, o) => sum + o.total, 0)
          ),
          live: mine.filter(o => !['delivered', 'declined', 'cancelled'].includes(o.status)).length,
        };
      })
    ));
  }

  async toggleApproval(store: VendorProfile): Promise<void> {
    const next = !store.approved;
    await this.vendors.setApproved(store.id, next);
    const toast = await this.toast.create({
      message: next
        ? `${store.name} is now visible to shoppers.`
        : `${store.name} is suspended and hidden from shoppers.`,
      duration: 2000,
    });
    await toast.present();
    await this.refresh();
  }

  peso = (value: number) => pesos(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}