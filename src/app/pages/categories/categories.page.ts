import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  NavController, 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol, IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  fastFoodOutline, pizzaOutline, beerOutline, iceCreamOutline, 
  fishOutline, nutritionOutline, restaurantOutline, flameOutline,
  gridOutline, homeOutline, searchOutline, receiptOutline, heartOutline, 
  personOutline, cartOutline, wineOutline 
} from 'ionicons/icons';
import { ItemsService } from '../../services/items.service';

export interface CategoryItem {
  id: string;
  name: string;
  itemCount: number;
  icon: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol, IonIcon
  ]
})
export class CategoriesPage implements OnInit {

  searchQuery: string = '';
  activeTab: number = 0;

  allCategories: CategoryItem[] = [
    { id: 'snacks', name: 'Snacks', itemCount: 0, icon: 'fast-food-outline' },
    { id: 'viand', name: 'Viand', itemCount: 0, icon: 'pizza-outline' },
    { id: 'drinks', name: 'Drinks & Beverages', itemCount: 0, icon: 'beer-outline' },
    { id: 'desserts', name: 'Desserts & Sweets', itemCount: 0, icon: 'ice-cream-outline' },
    { id: 'meals', name: 'Meals', itemCount: 0, icon: 'fish-outline' },
    { id: 'healthy', name: 'Healthy & Salad', itemCount: 0, icon: 'nutrition-outline' },
    { id: 'popular', name: 'Popular Deals', itemCount: 0, icon: 'flame-outline' }
  ];

  filteredCategories: CategoryItem[] = [];

  constructor(
    private itemsService: ItemsService,
    private router: Router,
    private navCtrl: NavController
  ) {
    addIcons({
      iceCreamOutline, cartOutline, wineOutline, fastFoodOutline, 
      homeOutline, searchOutline, receiptOutline, heartOutline, 
      personOutline, pizzaOutline, beerOutline, fishOutline, 
      nutritionOutline, restaurantOutline, flameOutline, gridOutline
    });
  }

  ngOnInit() {
    this.updateCategoryCounts();
    this.filterCategories();
  }

  ionViewWillEnter() {
    this.updateCategoryCounts();
    this.filterCategories();
  }

  private updateCategoryCounts() {
    const allItems = this.itemsService.getAllItems();
    this.allCategories.forEach(cat => {
      const catKey = cat.id.toLowerCase();
      const count = allItems.filter((item: any) => {
        const catField = item.category;
        if (Array.isArray(catField)) {
          return catField.some((c: any) => String(c).toLowerCase().includes(catKey));
        }
        return catField ? String(catField).toLowerCase().includes(catKey) : false;
      }).length;
      
      cat.itemCount = count;
    });
  }

  filterCategories() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredCategories = [...this.allCategories];
    } else {
      this.filteredCategories = this.allCategories.filter(cat => 
        cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q)
      );
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/dashboard');
  }

  openCategory(category: CategoryItem) {
    this.router.navigate(['/items'], { 
      queryParams: { 
        category: category.id, 
        name: category.name 
      } 
    });
  }

  onTabChange(event: any) {
    if (event && typeof event.index === 'number') {
      this.activeTab = event.index;
      const id = event.item?.id;
      if (id === 'home') {
        this.navCtrl.navigateRoot('/dashboard');
      } else if (id === 'search') {
        this.navCtrl.navigateRoot('/search');
      } else if (id === 'orders') {
        this.router.navigate(['/orders']);
      } else if (id === 'favorites') {
        this.router.navigate(['/favorites']);
      } else if (id === 'profile') {
        this.router.navigate(['/profile-hub']);
      }
    }
  }
}