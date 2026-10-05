import { Injectable } from '@angular/core';

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
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private items: ProductItem[] = [
    {
      id: '1',
      title: 'Bananaque',
      subtitle: 'Sweet Fried Bananas',
      category: ['snacks', 'popular'],
      description: 'Classic Filipino street snack made with caramelized Saba bananas skewered on bamboo sticks.',
      price: 20.00,
      rating: 4.9,
      reviews: 140,
      distance: '0.5 km',
      imageUrl: 'assets/images/bananaque.jpg'
    },
    {
      id: '2',
      title: 'Black Gulaman',
      subtitle: 'Jelly & Grass Drink',
      category: ['drinks', 'popular'],
      description: 'Refreshing cold sweet beverage made with gelatin, grass jelly cubes, and brown sugar syrup.',
      price: 10.00,
      rating: 4.9,
      reviews: 98,
      distance: '0.8 km',
      imageUrl: 'assets/images/black gulaman.jpg'
    },
    {
      id: '3',
      title: 'Pinoy Sorbetes Buns',
      subtitle: 'Soft Buns (Pack of 6)',
      category: ['desserts'],
      description: 'Freshly baked soft bread rolls, perfect for pairing with hot coffee or ice cream.',
      price: 25.00,
      rating: 4.9,
      reviews: 54,
      distance: '1.2 km',
      imageUrl: 'assets/images/bread.jpg'
    },
    {
      id: '4',
      title: 'Cheese Stick',
      subtitle: 'Cheese stick',
      category: ['snacks'],
      description: 'Crispy fried spring roll wrappers seasoned generously with savory cheese flavor powder.',
      price: 5.00,
      rating: 4.9,
      reviews: 112,
      distance: '0.4 km',
      imageUrl: 'assets/images/cheese stick.jpg'
    },
    {
      id: '5',
      title: 'Cheese Balls',
      subtitle: 'Cheese Balls',
      category: ['snacks'],
      description: 'Golden-fried breaded bite-sized cheese balls with sweet sauces.',
      price: 5.00,
      rating: 4.9,
      reviews: 87,
      distance: '0.4 km',
      imageUrl: 'assets/images/Cheese ball.jpg'
    },
    {
      id: '6',
      title: 'Chicken Thigh Plate',
      subtitle: 'Chicken, Rice, Egg',
      category: ['meals', 'popular'],
      description: 'Sizzling hot plate meal served with fried chicken thigh, savory gravy, yellow garlic rice, and a fried egg.',
      price: 70.00,
      rating: 4.9,
      reviews: 210,
      distance: '1.5 km',
      imageUrl: 'assets/images/chicken_thigh.jpg'
    },
    {
      id: '7',
      title: 'Fried Siomai',
      subtitle: 'Fried Siomai',
      category: ['snacks'],
      description: 'Fried Siomai served with chili garlic dip and calamansi.',
      price: 5.00,
      rating: 4.8,
      reviews: 165,
      distance: '0.6 km',
      imageUrl: 'assets/images/Fried siomai.jpg'
    },
    {
      id: '8',
      title: 'Corndog',
      subtitle: 'Corndog',
      category: ['snacks', 'popular'],
      description: 'Crispy golden corn batter wrapped around a juicy hotdog and melted mozzarella cheese.',
      price: 10.00,
      rating: 4.9,
      reviews: 190,
      distance: '0.7 km',
      imageUrl: 'assets/images/corndog.jpg'
    },
    {
      id: '9',
      title: 'Coffee Jelly',
      subtitle: 'Iced Coffee Jelly',
      category: ['drinks'],
      description: 'Iced coffee beverage mixed with rich coffee gelatin cubes.',
      price: 10.00,
      rating: 4.9,
      reviews: 76,
      distance: '1.0 km',
      imageUrl: 'assets/images/coffee_jelly.jpg'
    },
    {
      id: '10',
      title: 'Sizzling Pork Sisig',
      subtitle: 'Sisig, Rice, Egg',
      category: ['meals', 'popular'],
      description: 'Sizzling pork sisig served with garlic rice, topped with a fresh egg and calamansi slice.',
      price: 60.00,
      rating: 4.9,
      reviews: 320,
      distance: '1.1 km',
      imageUrl: 'assets/images/sisig.jpg'
    },
    {
      id: '11',
      title: 'Taho',
      subtitle: 'Taho',
      category: ['desserts', 'popular'],
      description: 'Taho served in a cup with sweet brown sugar syrup (arnibal) and chewy sago pearls.',
      price: 20.00,
      rating: 5.0,
      reviews: 280,
      distance: '0.3 km',
      imageUrl: 'assets/images/Taho.jpg'
    },
    {
      id: '12',
      title: 'Turon',
      subtitle: 'Crispy Banana Rolls',
      category: ['snacks', 'desserts'],
      description: 'Crispy deep-fried spring rolls filled with sweet Saba banana slices and caramelized brown sugar coating.',
      price: 7.00,
      rating: 4.8,
      reviews: 155,
      distance: '0.5 km',
      imageUrl: 'assets/images/turon.jpg'
    },
    {
      id: '13',
      title: 'Yakult',
      subtitle: 'Probiotic Milk Drink',
      category: ['drinks'],
      description: 'Chilled refreshing probiotic cultured milk drink straight from the ice chest.',
      price: 10.00,
      rating: 4.9,
      reviews: 105,
      distance: '0.2 km',
      imageUrl: 'assets/images/yakult.jpg'
    }
  ];

  getAllItems(): ProductItem[] {
    return this.items;
  }

  searchItems(query: string = '', selectedCategory: string = 'All'): ProductItem[] {
    const q = query.toLowerCase().trim();
    const cat = selectedCategory.toLowerCase().trim();

    return this.items.filter(item => {
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