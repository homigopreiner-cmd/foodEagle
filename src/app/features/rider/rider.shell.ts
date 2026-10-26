import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  listOutline,
  cashOutline,
  personOutline,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { RiderService } from '../../core/services/rider.service';
import { RiderProfile } from '../../core/models/platform.model';

export interface RiderNavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Shared chrome for the Delivery Rider app.
 *
 * The top bar carries the one state that matters outdoors: whether the
 * rider is online. When they go offline they stop being offered deliveries,
 * which is what makes the dispatch pool honest.
 */
@Component({
  selector: 'app-rider-shell',
  template: `
    <div class="shell app-shell--rider">
      <header class="shell-topbar">
        <div class="brand">
          <img *ngIf="rider?.photo" class="brand-avatar" [src]="rider?.photo" alt="" />
          <div *ngIf="!rider?.photo" class="brand-badge">R</div>
          <div class="brand-text">
            <div class="brand-title">{{ rider ? rider.name : 'Rider' }}</div>
            <div class="brand-sub">
              {{ rider?.vehicle }}<span *ngIf="rider?.plateNo"> · {{ rider.plateNo }}</span>
            </div>
          </div>
        </div>

        <div class="topbar-actions">
          <span
            class="pill"
            [ngClass]="rider?.online ? 'pill--delivered' : 'pill--declined'"
            style="cursor: pointer"
            (click)="toggleOnline()"
          >
            {{ rider?.online ? 'Online' : 'Offline' }}
          </span>
          <button class="icon-btn" title="Sign out" (click)="signOut()">
            <ion-icon name="log-out-outline"></ion-icon>
          </button>
        </div>
      </header>

      <router-outlet></router-outlet>

      <nav class="shell-tabs">
        <button
          *ngFor="let item of navItems"
          [class.active]="isActive(item.path)"
          (click)="go(item.path)"
        >
          <ion-icon [name]="item.icon"></ion-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonIcon],
})
export class RiderShellComponent implements OnInit, OnDestroy {
  private readonly riderState = signal<RiderProfile | null>(null);
  get rider(): RiderProfile | null { return this.riderState(); }

  readonly navItems: RiderNavItem[] = [
    { path: '/rider', label: 'Today', icon: 'home-outline' },
    { path: '/rider/deliveries', label: 'Deliveries', icon: 'list-outline' },
    { path: '/rider/earnings', label: 'Earnings', icon: 'cash-outline' },
    { path: '/rider/profile', label: 'Profile', icon: 'person-outline' },
  ];

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private auth: AuthService,
    private riders: RiderService,
    private toast: ToastController
  ) {
    addIcons({ homeOutline, listOutline, cashOutline, personOutline, logOutOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.ensureProfile();
    // The tab highlight reads straight from the router on every change
    // detection pass, so there is nothing to sync on navigation events.
    this.subs.push(this.riders.riders$.subscribe(() => void this.refresh()));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  /** A rider account always has a courier record to attach deliveries to. */
  private async ensureProfile(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    this.riderState.set( (await this.riders.ownedBy(user.identifier)) ?? null);
    if (!this.rider) {
      this.riderState.set( await this.riders.ensureFor(user.identifier, user.name));
    }
  }

  private async refresh(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    this.riderState.set( await this.riders.ownedBy(user.identifier));
  }

  async toggleOnline(): Promise<void> {
    if (!this.rider) return;
    const next = !this.rider.online;
    await this.riders.setOnline(this.rider.id, next);
    this.riderState.set( await this.riders.findById(this.rider.id));

    const toast = await this.toast.create({
      message: next
        ? 'You are online — new deliveries will come in.'
        : 'You are offline. No new deliveries will be offered.',
      duration: 1800,
    });
    await toast.present();
  }

  isActive(path: string): boolean {
    const url = this.router.url.split('?')[0];
    return path === '/rider' ? url === '/rider' : url.startsWith(path);
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