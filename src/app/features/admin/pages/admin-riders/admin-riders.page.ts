import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bicycleOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { RiderService } from '../../../../core/services/rider.service';
import { OrderService } from '../../../../core/services/order.service';
import { PlatformOrder, RiderProfile, pesos } from '../../../../core/models/platform.model';

interface RiderRow {
  rider: RiderProfile;
  active: number;
  delivered: number;
  earned: number;
  unclaimed: number;
}

/**
 * Admin · Riders — the courier pool.
 *
 * Dispatch health at a glance: who is online, who is carrying something,
 * and how many orders are sitting unclaimed because the pool is thin.
 */
@Component({
  selector: 'app-admin-riders',
  template: `
    <div class="admin-grid">
      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="bicycle-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Online now</div>
          <div class="kpi-value">{{ onlineCount }}</div>
          <div class="kpi-hint">of {{ rows.length }} riders</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="bicycle-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">On a run</div>
          <div class="kpi-value">{{ busyCount }}</div>
          <div class="kpi-hint">carrying an order</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-icon"><ion-icon name="bicycle-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">Unclaimed orders</div>
          <div class="kpi-value">{{ unclaimed }}</div>
          <div class="kpi-hint">waiting for a rider</div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <h3>Courier pool</h3>

      <div *ngIf="!rows.length" class="empty-state">
        <h4>No riders registered</h4>
        <p>Rider accounts show up here as soon as they are created.</p>
      </div>

      <table class="admin-table" *ngIf="rows.length">
        <thead>
          <tr>
            <th>Rider</th>
            <th>Vehicle</th>
            <th>Account</th>
            <th>Status</th>
            <th class="num">Active</th>
            <th class="num">Completed</th>
            <th class="num">Rating</th>
            <th class="num">Earned</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td><strong>{{ row.rider.name }}</strong><div class="kpi-hint">{{ row.rider.contact }}</div></td>
            <td>{{ row.rider.vehicle }}<div class="kpi-hint">{{ row.rider.plateNo || 'no plate' }}</div></td>
            <td>{{ row.rider.accountIdentifier ?? 'Not linked' }}</td>
            <td>
              <span class="pill" [ngClass]="row.rider.online ? 'pill--delivered' : 'pill--declined'">
                {{ row.rider.online ? 'Online' : 'Offline' }}
              </span>
            </td>
            <td class="num">{{ row.active }}</td>
            <td class="num">{{ row.rider.completedDeliveries }}</td>
            <td class="num">{{ row.rider.rating.toFixed(1) }}★</td>
            <td class="num">{{ peso(row.rider.totalEarnings) }}</td>
            <td>
              <button class="btn btn--sm btn--ghost" (click)="toggleOnline(row.rider)">
                {{ row.rider.online ? 'Force offline' : 'Bring online' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class AdminRidersPage implements OnInit {
  private readonly rowsState = signal<RiderRow[]>([]);
  get rows(): RiderRow[] { return this.rowsState(); }
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }
  private readonly unclaimedState = signal<number>(0);
  get unclaimed(): number { return this.unclaimedState(); }

  constructor(
    private riders: RiderService,
    private ledger: OrderService,
    private toast: ToastController
  ) {
    addIcons({ bicycleOutline });
  }

  async ngOnInit(): Promise<void> {
    await forkJoin([this.riders.ready(), this.ledger.ready()]).toPromise();
    this.riders.riders$.subscribe(() => void this.refresh());
    this.ledger.ledger$.subscribe(orders => {
      this.ordersState.set( orders);
      void this.refresh();
    });
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    const riders = await this.riders.all();
    this.unclaimedState.set( this.ledger.availableOffers().length);
    this.rowsState.set( riders.map(rider => ({
      rider,
      active: this.orders.filter(
        o => o.riderId === rider.id && ['picked_up', 'delivering'].includes(o.status)
      ).length,
      delivered: this.orders.filter(o => o.riderId === rider.id && o.status === 'delivered').length,
      earned: this.riderEarnings(rider),
      unclaimed: this.unclaimed,
    })));
  }

  get onlineCount(): number {
    return this.rows.filter(r => r.rider.online).length;
  }

  get busyCount(): number {
    return this.rows.filter(r => r.active > 0).length;
  }

  private riderEarnings(rider: RiderProfile): number {
    return round(
      this.orders
        .filter(o => o.riderId === rider.id && o.status === 'delivered')
        .reduce(sum => sum + 25, 0) || rider.totalEarnings
    );
  }

  async toggleOnline(rider: RiderProfile): Promise<void> {
    await this.riders.setOnline(rider.id, !rider.online);
    const toast = await this.toast.create({
      message: rider.online ? `${rider.name} taken offline.` : `${rider.name} is online.`,
      duration: 1600,
    });
    await toast.present();
    await this.refresh();
  }

  peso = (value: number) => pesos(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}