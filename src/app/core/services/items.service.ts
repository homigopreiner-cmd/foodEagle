import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuService } from './menu.service';
import { MenuItem } from '../models/platform.model';

/**
 * ProductItem — the shape the customer screens already render.
 *
 * It is structurally a subset of the shared MenuItem (plus the owning
 * store), so the shopper UI never has to know about vendors, commissions
 * or availability rules — it just gets dishes.
 */
export interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  rating: number;
  imageUrl: string;
  description: string;
  category: Array<'snacks' | 'drinks' | 'meals' | 'desserts' | 'popular'>;
  distance?: string;
  reviews?: number;
  /** Owning store — needed so checkout can split a mixed basket. */
  vendorId?: string;
  vendorName?: string;
}

/**
 * ItemsService — the customer's read view of the catalogue.
 *
 * This used to hold a hard-coded array of dishes, which meant the vendor
 * app could never change what shoppers saw. It is now a thin adapter over
 * the shared MenuService: one catalogue, several audiences.
 *
 * It keeps a synchronous cache (so existing pages keep working) AND an
 * observable `items$` so pages can refresh the moment a vendor publishes
 * a change.
 */
@Injectable({ providedIn: 'root' })
export class ItemsService {
  private cache: ProductItem[] = [];
  private storeNames: Record<string, string> = {};

  private readonly subject = new BehaviorSubject<ProductItem[]>([]);
  /** Emits the purchasable catalogue. */
  readonly items$ = this.subject.asObservable();

  constructor(private menu: MenuService) {
    void this.refresh();
    // A vendor edit (new dish, sold out, price change) flows through here.
    this.menu.changes$.subscribe(() => void this.refresh());
  }

  /** Re-reads the shared catalogue and pushes it to subscribers. */
  async refresh(): Promise<ProductItem[]> {
    this.storeNames = await this.menu.vendorNames();
    const all = await this.menu.all();
    this.cache = all
      .filter(item => item.available)
      .map(item => ItemsService.toProduct(item, this.storeNames[item.vendorId]));
    this.subject.next(this.cache);
    return this.cache;
  }

  private static toProduct(item: MenuItem, vendorName?: string): ProductItem {
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      price: item.price,
      rating: item.rating,
      imageUrl: item.imageUrl,
      description: item.description,
      category: item.category,
      distance: item.distance,
      reviews: item.reviews,
      vendorId: item.vendorId,
      vendorName,
    };
  }

  getAllItems(): ProductItem[] {
    return this.cache;
  }

  searchItems(query: string = '', selectedCategory: string = 'All'): ProductItem[] {
    const q = query.toLowerCase().trim();
    const cat = selectedCategory.toLowerCase().trim();

    return this.cache.filter(item => {
      const matchesCategory = cat === 'all' || cat.includes('all items') || item.category.some(c => {
        const itemCat = c.toLowerCase();
        return itemCat === cat || itemCat.startsWith(cat) || cat.startsWith(itemCat);
      });

      const matchesQuery = !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }
}