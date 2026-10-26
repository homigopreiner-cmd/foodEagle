import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bagHandleOutline,
  navigateOutline,
  cashOutline,
  bicycleOutline,
  storefrontOutline,
  callOutline,
} from 'ionicons/icons';
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

/**
 * Rider · Today — the whole shift on one screen.
 *
 * Three things matter to a courier: am I online, what am I carrying right
 * now, and what is waiting to be claimed. Everything else is a click away.
 */
@Component({
  selector: 'app-rider-home',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>{{ greeting }}, {{ firstName }}</h1>
          <p>{{ today }}</p>
        </div>
        <button
          class="btn btn--sm"
          [class.btn--muted]="!rider?.online"
          (click)="toggleOnline()"
        >
          {{ rider?.online ? 'Go offline' : 'Go online' }}
        </button>
      </div>

      <div class="stat-grid">
        <div class="stat is-accent">
          <div class="stat-label">Today's earnings</div>
          <div class="stat-value">{{ peso(todayEarnings) }}</div>
          <div class="stat-hint">{{ todayDeliveries }} deliveries</div>
        </div>
        <div class="stat">
          <div class="stat-label">Active delivery</div>
          <div class="stat-value">{{ active.length }}</div>
          <div class="stat-hint">in progress</div>
        </div>
        <div class="stat">
          <div class="stat-label">Ready to claim</div>
          <div class="stat-value">{{ offers.length }}</div>
          <div class="stat-hint">waiting for a rider</div>
        </div>
        <div class="stat">
          <div class="stat-label">Fee per drop</div>
          <div class="stat-value">{{ peso(fee) }}</div>
          <div class="stat-hint">plus tips</div>
        </div>
      </div>

      <div class="card" *ngIf="current">
        <h3>Current delivery</h3>

        <div class="list-row" style="padding-top: 0">
          <div class="list-main">
            <div class="list-title">{{ current.code }} · {{ current.vendorName }}</div>
            <div class="list-sub">
              <ion-icon name="storefront-outline"></ion-icon>
              Pick up at {{ current.pickupSpot }}
            </div>
            <div class="list-sub">
              <ion-icon name="navigate-outline"></ion-icon>
              Drop off: {{ current.dropoffBuilding }} ({{ current.dropoffLandmark }})
            </div>
            <div class="list-sub">{{ current.customerName }} · {{ current.customerContact }}</div>
            <div class="list-sub" *ngIf="collectFrom(current)">
              Collect {{ peso(current.total) }} on delivery
            </div>
          </div>
          <div class="list-end">
            <span class="pill" [ngClass]="'pill--' + current.status">{{ label(current.status) }}</span>
            <div class="list-sub" style="margin-top: 4px">{{ peso(fee) }} fee</div>
          </div>
        </div>

        <div class="btn-row">
          <button
            *ngIf="current.status === 'picked_up'"
            class="btn btn--sm"
            (click)="advance(current, 'delivering')"
          >
            Start delivery
          </button>
          <button
            *ngIf="current.status === 'delivering'"
            class="btn btn--sm"
            (click)="advance(current, 'delivered')"
          >
            Complete delivery
          </button>
        </div>
      </div>

      <div class="card">
        <h3>Available pickups</h3>

        <div class="empty-state" *ngIf="!offers.length">
          <ion-icon name="bicycle-outline"></ion-icon>
          <h4>{{ rider?.online ? 'No pickups yet' : 'You are offline' }}</h4>
          <p>
            {{ rider?.online
              ? 'Orders the kitchen marks as ready will show up here.'
              : 'Go online to start receiving delivery offers.' }}
          </p>
        </div>

        <div class="list-row" *ngFor="let o of offers">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.vendorName }}</div>
            <div class="list-sub">{{ o.pickupSpot }} → {{ o.dropoffBuilding }}</div>
            <div class="list-sub">{{ o.items.length }} item(s) · {{ peso(o.total) }} order</div>
          </div>
          <div class="list-end">
            <div style="color: #0b7a4b">{{ peso(fee) }}</div>
            <button
              class="btn btn--sm"
              style="margin-top: 6px"
              [disabled]="!rider?.online"
              (click)="claim(o)"
            >
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class RiderHomePage implements OnInit {
  private readonly riderState = signal<RiderProfile | null>(null);
  get rider(): RiderProfile | null { return this.riderState(); }
  private readonly activeState = signal<PlatformOrder[]>([]);
  get active(): PlatformOrder[] { return this.activeState(); }
  private readonly offersState = signal<PlatformOrder[]>([]);
  get offers(): PlatformOrder[] { return this.offersState(); }
  private readonly firstNameState = signal<string>('Rider');
  get firstName(): string { return this.firstNameState(); }
  private readonly greetingState = signal<string>('Good day');
  get greeting(): string { return this.greetingState(); }

  readonly fee = DEFAULT_DELIVERY_FEE;

  constructor(
    private auth: AuthService,
    private riders: RiderService,
    private ledger: OrderService,
    private toast: ToastController
  ) {
    addIcons({
      bagHandleOutline,
      navigateOutline,
      cashOutline,
      bicycleOutline,
      storefrontOutline,
      callOutline,
    });
  }

  get today(): string {
    return new Date().toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  get current(): PlatformOrder | null {
    return this.active[0] ?? null;
  }

  get todayEarnings(): number {
    return this.rider?.totalEarnings ?? 0;
  }

  get todayDeliveries(): number {
    return this.rider?.completedDeliveries ?? 0;
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    const user = this.auth.currentUser;
    this.firstNameState.set( (user?.name ?? 'Rider').split(' ')[0]);
    const hour = new Date().getHours();
    this.greetingState.set( hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

    await this.refresh();
    this.ledger.ledger$.subscribe(() => this.reload());
    this.riders.riders$.subscribe(() => void this.refresh());
  }

  private async refresh(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    this.riderState.set(
      (await this.riders.ownedBy(user.identifier)) ??
      (await this.riders.ensureFor(user.identifier, user.name)));
    this.reload();
  }

  private reload(): void {
    if (!this.rider) return;
    this.activeState.set( this.ledger
      .forRider(this.rider.id)
      .filter(o => o.status === 'picked_up' || o.status === 'delivering'));
    this.offersState.set( this.ledger.availableOffers());
  }

  async toggleOnline(): Promise<void> {
    if (!this.rider) return;
    await this.riders.setOnline(this.rider.id, !this.rider.online);
    this.riderState.set( await this.riders.findById(this.rider.id));
  }

  async claim(order: PlatformOrder): Promise<void> {
    if (!this.rider?.online) {
      await this.notify('Go online before claiming a delivery.');
      return;
    }
    if (this.active.length) {
      await this.notify('Finish your current delivery first.');
      return;
    }
    const result = await this.ledger.acceptDelivery(order.id, this.rider.id, this.rider.name);
    await this.notify(result.ok ? `Picked up ${order.code}.` : (result.error ?? 'Could not claim.'));
  }

  async advance(order: PlatformOrder, next: OrderStatus): Promise<void> {
    const result = await this.ledger.transition(order.id, next, 'rider');
    if (result.ok && next === 'delivered' && this.rider) {
      await this.riders.recordDelivery(this.rider.id, DEFAULT_DELIVERY_FEE);
      this.riderState.set( await this.riders.findById(this.rider.id));
      await this.notify(`Delivery complete — ${pesos(DEFAULT_DELIVERY_FEE)} earned.`);
    } else if (!result.ok) {
      await this.notify(result.error ?? 'Could not update the delivery.');
    }
  }

  /** Cash runs are collected by the rider at the door. */
  collectFrom(order: PlatformOrder): boolean {
    return order.paymentMethod === 'cod';
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
  peso = (value: number) => pesos(value);

  private async notify(message: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 2000 });
    await toast.present();
  }
}