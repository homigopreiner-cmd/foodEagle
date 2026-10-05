import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonButtons, IonBackButton, IonButton, IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline, starHalf, locationOutline, timeOutline, cartOutline, addOutline } from 'ionicons/icons';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.page.html',
  styleUrls: ['./restaurant-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, 
    IonContent, IonButtons, IonBackButton, IonButton, IonIcon
  ]
})
export class RestaurantDetailPage implements OnInit {
  vendorId: string = 'red-eagle-nook';
  vendor: any = {};
  menuCategories: string[] = [];
  selectedCategory = 'All Items';
  menuItems: any[] = [];

  // Database of all 3 restaurants and their menus
  private restaurantsData: { [key: string]: any } = {
    'red-eagle-nook': {
      name: 'Red Eagle Nook',
      category: 'Café • Milk Tea • Breakfast',
      description: 'Serving refreshing drinks and hearty breakfast meals to start your campus day right.',
      location: 'CSU Carig Gymnasium',
      rating: 4.9,
      reviews: '75+ reviews',
      eta: '10-20 mins',
      banner: 'assets/images/nook.jpe',
      categories: ['All Items', 'Milk Tea', 'Coffee', 'Breakfast'],
      items: [
        { 
          id: 101, 
          name: 'Okinawa Pearl Milk Tea', 
          desc: 'Rich brown sugar black milk tea with chewy tapioca pearls', 
          price: 85.00, 
          rating: 4.9,
          category: 'Milk Tea',
          image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 102, 
          name: 'Wintermelon Cheese Cream', 
          desc: 'Sweet wintermelon milk tea topped with salted cream cheese foam', 
          price: 95.00, 
          rating: 4.8,
          category: 'Milk Tea',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 103, 
          name: 'Caramel Macchiato', 
          desc: 'Espresso combined with vanilla-flavored syrup, milk, and caramel drizzle', 
          price: 110.00, 
          rating: 4.9,
          category: 'Coffee',
          image: 'https://images.unsplash.com/photo-1485808191679-edf8637cb6a6?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 104, 
          name: 'Spanish Latte', 
          desc: 'Smooth espresso layered with sweet condensed milk and fresh milk', 
          price: 100.00, 
          rating: 4.7,
          category: 'Coffee',
          image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 105, 
          name: 'Classic Beef Tapsilog', 
          desc: 'Cured beef slices served with garlic fried rice and sunny-side-up egg', 
          price: 105.00, 
          rating: 4.8,
          category: 'Breakfast',
          image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 106, 
          name: 'Crispy Pork Tocilog', 
          desc: 'Sweet marinated pork slices with garlic rice and fried egg', 
          price: 95.00, 
          rating: 4.6,
          category: 'Breakfast',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80' 
        }
      ]
    },
    'yanfayes': {
      name: 'yanfayes',
      category: 'Lunch • Lutong Bahay • Filipino Meals',
      description: 'Craving authentic home-cooked Filipino comfort food? Enjoy our freshly prepared lunch specials.',
      location: 'Near CSU Gate 2',
      rating: 4.8,
      reviews: '60+ reviews',
      eta: '15-25 mins',
      banner: 'assets/images/yanfayes.jpg',
      categories: ['All Items', 'Lunch Specials'],
      items: [
        { 
          id: 201, 
          name: 'Chicken Curry', 
          desc: 'Tender chicken pieces simmered in rich coconut milk, curry powder, potatoes, and carrots', 
          price: 95.00, 
          rating: 4.8,
          category: 'Lunch Specials',
          image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 202, 
          name: 'Pork Adobo', 
          desc: 'Classic Filipino adobo slow-cooked in soy sauce, vinegar, garlic, and bay leaves', 
          price: 90.00, 
          rating: 4.9,
          category: 'Lunch Specials',
          image: 'https://images.unsplash.com/photo-1626500155161-5c219cd6969a?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 203, 
          name: 'Dinakdakan', 
          desc: 'Grilled pork parts chopped and tossed with onions, chili peppers, and creamy mayonnaise', 
          price: 110.00, 
          rating: 4.9,
          category: 'Lunch Specials',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 204, 
          name: 'Pinakbet', 
          desc: 'Fresh local vegetables sautéed in shrimp paste topped with crispy pork bits', 
          price: 80.00, 
          rating: 4.7,
          category: 'Lunch Specials',
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' 
        }
      ]
    },
    'ddk-corner': {
      name: 'ddk Corner',
      category: 'Snacks • Fried & Street Food',
      description: 'Your favorite budget-friendly quick bites, crispy fried chicken, and street food classics!',
      location: 'Student Center Food Hub',
      rating: 4.7,
      reviews: '50+ reviews',
      eta: '10-15 mins',
      banner: 'assets/images/ddk-corner.jpg',
      categories: ['All Items', 'Fried Meals', 'Street Food & Snacks'],
      items: [
        { 
          id: 301, 
          name: 'Crispy Fried Chicken', 
          desc: 'Golden brown, extra crunchy fried chicken served with steamed rice or gravy', 
          price: 85.00, 
          rating: 4.8,
          category: 'Fried Meals',
          image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 302, 
          name: 'Savory Sausages Meal', 
          desc: 'Juicy grilled sausages served with egg and garlic rice', 
          price: 75.00, 
          rating: 4.6,
          category: 'Fried Meals',
          image: 'https://images.unsplash.com/photo-1594998893017-36147ccfffd0?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 303, 
          name: 'Crispy Pork Lumpia', 
          desc: 'Golden fried spring rolls stuffed with seasoned minced meat and vegetables', 
          price: 50.00, 
          rating: 4.9,
          category: 'Street Food & Snacks',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 304, 
          name: 'Sweet Bananaque', 
          desc: 'Deep-fried saba bananas coated in caramelized brown sugar on skewers', 
          price: 25.00, 
          rating: 4.8,
          category: 'Street Food & Snacks',
          image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80' 
        },
        { 
          id: 305, 
          name: 'Steamed Siomai (5 pcs)', 
          desc: 'Flavorful pork and shrimp dumplings served with chili garlic soy sauce', 
          price: 45.00, 
          rating: 4.7,
          category: 'Street Food & Snacks',
          image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80' 
        }
      ]
    }
  };

  constructor(private router: Router, private route: ActivatedRoute, private cartService: CartService) {
    addIcons({ star, starOutline, starHalf, locationOutline, timeOutline, cartOutline, addOutline });
  }

  ngOnInit() {
    // Listen to query parameters and handle string names, IDs, or numbers gracefully
    this.route.queryParams.subscribe(params => {
      const vendorParam = params['vendor'] || params['id'] || '';
      const storeNameParam = (params['name'] || '').toLowerCase();
      
      if (vendorParam === '2' || vendorParam === 'yanfayes' || storeNameParam.includes('yanfaye')) {
        this.vendorId = 'yanfayes';
      } else if (vendorParam === '3' || vendorParam === 'ddk-corner' || storeNameParam.includes('ddk')) {
        this.vendorId = 'ddk-corner';
      } else {
        this.vendorId = 'red-eagle-nook';
      }

      this.loadVendorData();
    });
  }

  loadVendorData() {
    const data = this.restaurantsData[this.vendorId] || this.restaurantsData['red-eagle-nook'];
    this.vendor = {
      name: data.name,
      category: data.category,
      description: data.description,
      location: data.location,
      rating: data.rating,
      reviews: data.reviews,
      eta: data.eta,
      banner: data.banner
    };
    this.menuCategories = data.categories;
    this.selectedCategory = 'All Items';
    this.menuItems = data.items;
  }

  get filteredItems() {
    if (this.selectedCategory === 'All Items') {
      return this.menuItems;
    }
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  getVendorStars() {
    return this.calculateStars(this.vendor.rating);
  }

  getItemStars(rating: number) {
    return this.calculateStars(rating);
  }

  private calculateStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('star');
      } else if (rating >= i - 0.5) {
        stars.push('star-half');
      } else {
        stars.push('star-outline');
      }
    }
    return stars;
  }

  addToCart(item: any) {
    this.cartService.addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image
    });
  }
}