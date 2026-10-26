import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bicycleOutline, bagHandleOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { RiderService } from '../../../../core/services/rider.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  OrderStatus,
  PlatformOrder,
  RiderProfile,
  STATUS_LABEL,
  DEFAULT_DELIVERY_FEE,
  pesos,
} from '../../../../core/models/platform.model';

interface DeliveryTab {
  key: string;
  label: string;
  match: (o: PlatformOrder) => boolean;
}

/**
 * Rider · Deliveries — the shift log.
 *
 * Open offers, the run in progress, and everything already handed over.
 * Read-only except for the one button per row that moves a job forward.
 */
@Component({
  selector: 'app-rider-deliveries',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Deliveries</h1>
          <p>{{ rider ? rider.name : 'No rider profile' }}</p>
        </div>
      </div>

      <div class="seg-bar">
        <button
          *ngFor="let t of tabs"
          [class.active]="tabKey === t.key"
          (click)="tabKey = t.key"
        >
          {{ t.label }}<span class="count">{{ countFor(t) }}</span>
        </button>
      </div>

      <div class="empty-state" *ngIf="!visible.length">
        <ion-icon name="bicycle-outline"></ion-icon>
        <h4>Nothing here yet</h4>
        <p>Claim a pickup from the Today tab and it will appear in this list.</p>
      </div>

      <div class="card" *ngFor="let o of visible">
        <div class="list-row" style="padding-top: 0">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.vendorName }}</div>
            <div class="list-sub">{{ o.pickupSpot }} → {{ o.dropoffBuilding }}</div>
            <div class="list-sub">{{ o.customerName }} · {{ o.customerContact }}</div>
            <div class="list-sub" *ngIf="collectFrom(o)">Collect {{ peso(o.total) }} on delivery</div>
          </div>
          <div class="list-end">
            <span class="pill" [ngClass]="'pill--' + o.status">{{ label(o.status) }}</span>
            <div class="list-sub" style="margin-top: 4px">{{ peso(fee) }} fee</div>
          </div>
        </div>

        <div class="btn-row" *ngIf="o.status === 'picked_up' || o.status === 'delivering'">
          <button class="btn btn--sm" (click)="advance(o)">
            {{ o.status === 'picked_up' ? 'Start delivery' : 'Complete delivery' }}
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class RiderDeliveriesPage implements OnInit {
  private readonly riderState = signal<RiderProfile | null>(null);
  get rider(): RiderProfile | null { return this.riderState(); }
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }
  tabKey = 'open';

  readonly fee = DEFAULT_DELIVERY_FEE;

  readonly tabs: DeliveryTab[] = [
    { key: 'open', label: 'Open', match: o => !o.riderId },
    { key: 'active', label: 'Active', match: o => o.status === 'picked_up' || o.status === 'delivering' },
    { key: 'done', label: 'Completed', match: o => o.status === 'delivered' },
  ];

  constructor(
    private auth: AuthService,
    private riders: RiderService,
    private ledger: OrderService
  ) {
    addIcons({ bicycleOutline, bagHandleOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    const user = this.auth.currentUser;
    if (user) {
      this.riderState.set( await this.riders.ownedBy(user.identifier));
    }
    this.ledger.ledger$.subscribe(() => this.reload());
    this.reload();
  }

  private reload(): void {
    const mine = this.rider ? this.ledger.forRider(this.rider.id) : [];
    const open = this.ledger.availableOffers();
    this.ordersState.set( [...open, ...mine]);
  }

  countFor(tab: DeliveryTab): number {
    return this.orders.filter(tab.match).length;
  }

  get visible(): PlatformOrder[] {
    const tab = this.tabs.find(t => t.key === this.tabKey);
    return tab ? this.orders.filter(tab.match) : [];
  }

  async advance(order: PlatformOrder): Promise<void> {
    const next: OrderStatus = order.status === 'picked_up' ? 'delivering' : 'delivered';
    await this.ledger.transition(order.id, next, 'rider');
    if (next === 'delivered' && this.rider) {
      await this.riders.recordDelivery(this.rider.id, DEFAULT_DELIVERY_FEE);
    }
  }

  collectFrom(order: PlatformOrder): boolean {
    return order.paymentMethod === 'cod';
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
  peso = (value: number) => pesos(value);
}