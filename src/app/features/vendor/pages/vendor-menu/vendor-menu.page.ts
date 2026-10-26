import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  restaurantOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { MenuService } from '../../../../core/services/menu.service';
import {
  FoodCategory,
  MenuItem,
  VendorProfile,
  pesos,
} from '../../../../core/models/platform.model';

interface DraftItem {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  category: FoodCategory[];
  imageUrl: string;
}

const EMPTY_DRAFT: DraftItem = {
  title: '',
  subtitle: '',
  description: '',
  price: 0,
  category: ['meals'],
  imageUrl: '',
};

/**
 * Vendor · Menu — the catalogue editor.
 *
 * Writes go straight to the shared MenuService, which is the same array the
 * customer dashboard reads. Add an item here and it shows up on the shop
 * side on the next refresh: one catalogue, two audiences.
 */
@Component({
  selector: 'app-vendor-menu',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Menu</h1>
          <p>{{ store ? store.name : 'No store selected' }} · {{ items.length }} items</p>
        </div>
        <button class="btn btn--sm" (click)="startCreate()">
          <ion-icon name="add-outline"></ion-icon> Add item
        </button>
      </div>

      <!-- Inline editor: no modal needed, and it keeps the flow on one screen -->
      <div class="card" *ngIf="editorOpen">
        <h3>{{ draft.id ? 'Edit item' : 'New item' }}</h3>

        <label class="field">
          <span>Name</span>
          <input type="text" [(ngModel)]="draft.title" placeholder="e.g. Chicken Adobo Rice Bowl" />
        </label>

        <label class="field">
          <span>Short description</span>
          <input type="text" [(ngModel)]="draft.subtitle" placeholder="e.g. Garlic rice + egg" />
        </label>

        <label class="field">
          <span>Full description</span>
          <textarea [(ngModel)]="draft.description" rows="2" placeholder="What makes it good?"></textarea>
        </label>

        <div class="field-row">
          <label class="field">
            <span>Price (₱)</span>
            <input type="number" min="0" [(ngModel)]="draft.price" />
          </label>
          <label class="field">
            <span>Image path</span>
            <input type="text" [(ngModel)]="draft.imageUrl" placeholder="assets/images/....jpg" />
          </label>
        </div>

        <div class="field">
          <span>Categories</span>
          <div class="chip-row">
            <button
              *ngFor="let c of categories"
              class="chip"
              [class.active]="draft.category.includes(c)"
              (click)="toggleCategory(c)"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn--sm" (click)="save()">{{ draft.id ? 'Save changes' : 'Add to menu' }}</button>
          <button class="btn btn--muted btn--sm" (click)="closeEditor()">Cancel</button>
        </div>
      </div>

      <div class="empty-state" *ngIf="!items.length && !editorOpen">
        <ion-icon name="restaurant-outline"></ion-icon>
        <h4>Your menu is empty</h4>
        <p>Add your first dish so customers can start ordering.</p>
      </div>

      <div class="card" *ngFor="let item of items">
        <div class="list-row" style="padding-top: 0">
          <img class="thumb" [src]="item.imageUrl" alt="" (error)="fallback($event)" />
          <div class="list-main">
            <div class="list-title">{{ item.title }}</div>
            <div class="list-sub">{{ item.subtitle || item.description || '—' }}</div>
            <div class="list-sub">{{ peso(item.price) }} · {{ item.category.join(', ') }}</div>
          </div>
          <div class="list-end">
            <span class="pill" [ngClass]="item.available ? 'pill--delivered' : 'pill--declined'">
              {{ item.available ? 'Available' : 'Sold out' }}
            </span>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn--ghost btn--sm" (click)="startEdit(item)">
            <ion-icon name="create-outline"></ion-icon> Edit
          </button>
          <button class="btn btn--sm" [class.btn--muted]="item.available" (click)="toggleAvailable(item)">
            {{ item.available ? 'Mark sold out' : 'Mark available' }}
          </button>
          <button class="btn btn--danger btn--sm" (click)="remove(item)">
            <ion-icon name="trash-outline"></ion-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class VendorMenuPage implements OnInit, OnDestroy {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }
  private readonly itemsState = signal<MenuItem[]>([]);
  get items(): MenuItem[] { return this.itemsState(); }

  editorOpen = false;
  draft: DraftItem = { ...EMPTY_DRAFT };

  readonly categories: FoodCategory[] = ['meals', 'snacks', 'drinks', 'desserts', 'popular'];

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private menu: MenuService,
    private toast: ToastController
  ) {
    addIcons({ addOutline, createOutline, trashOutline, restaurantOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.menu.ready();
    this.subs.push(this.vendors.stores$.subscribe(() => void this.resolveStore()));
    await this.resolveStore();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private async resolveStore(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const owned = await this.vendors.ownedBy(user.identifier);
    this.storeState.set( owned.find(s => s.id === this.vendors.activeStoreId) ?? owned[0] ?? null);
    if (this.store) this.vendors.setActiveStore(this.store.id);
    this.itemsState.set( this.store ? await this.menu.byVendor(this.store.id) : []);
  }

  peso = (value: number) => pesos(value);

  startCreate(): void {
    this.draft = { ...EMPTY_DRAFT, category: ['meals'] };
    this.editorOpen = true;
  }

  startEdit(item: MenuItem): void {
    this.draft = {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      price: item.price,
      category: [...item.category],
      imageUrl: item.imageUrl,
    };
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
  }

  toggleCategory(category: FoodCategory): void {
    this.draft.category = this.draft.category.includes(category)
      ? this.draft.category.filter(c => c !== category)
      : [...this.draft.category, category];
  }

  async save(): Promise<void> {
    if (!this.store) return;
    const title = this.draft.title.trim();
    if (!title) {
      await this.notify('Give the item a name first.');
      return;
    }
    if (!(this.draft.price > 0)) {
      await this.notify('Set a price greater than zero.');
      return;
    }

    if (this.draft.id) {
      await this.menu.update(this.draft.id, {
        title,
        subtitle: this.draft.subtitle.trim(),
        description: this.draft.description.trim(),
        price: Number(this.draft.price),
        category: this.draft.category.length ? this.draft.category : ['meals'],
        imageUrl: this.draft.imageUrl.trim(),
      });
      await this.notify(`${title} updated.`);
    } else {
      await this.menu.add(this.store.id, {
        title,
        subtitle: this.draft.subtitle,
        description: this.draft.description,
        price: Number(this.draft.price),
        category: this.draft.category,
        imageUrl: this.draft.imageUrl,
      });
      await this.notify(`${title} added to the menu.`);
    }

    this.closeEditor();
    await this.resolveStore();
  }

  async toggleAvailable(item: MenuItem): Promise<void> {
    await this.menu.toggleAvailable(item.id);
    this.itemsState.set( this.store ? await this.menu.byVendor(this.store.id) : []);
  }

  async remove(item: MenuItem): Promise<void> {
    if (!window.confirm(`Remove "${item.title}" from the menu?`)) return;
    await this.menu.remove(item.id);
    this.itemsState.set( this.store ? await this.menu.byVendor(this.store.id) : []);
    await this.notify(`${item.title} removed.`);
  }

  fallback(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/street food.jpg';
  }

  private async notify(message: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1800 });
    await toast.present();
  }
}