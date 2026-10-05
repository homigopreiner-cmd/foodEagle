import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonButton, 
  IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-walkthrough',
  templateUrl: './walkthrough.page.html',
  styleUrls: ['./walkthrough.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    IonContent, 
    IonButton, 
    IonIcon
  ]
})
export class WalkthroughPage implements OnInit {
  currentSlideIndex = 0;

  walkthroughSlides = [
    {
      badge: 'Campus Fast',
      image: 'assets/images/food-eagle-logo.png',
      title: 'Welcome to food<span class="eagle-glow">Eagle</span>',
      description: 'Order delicious campus meals, track your delivery in real-time, and get your food delivered straight to your exact location anywhere you are around the Campus.'
    },
    {
      badge: 'Hot & Fresh',
      image: 'assets/images/food-eagle-logo.png',
      title: 'Canteen Favorites<br>at Your Door',
      description: 'Explore popular campus hotspots like the School Canteen, Student Center, and CICS Building without leaving your seat.'
    },
    {
      badge: 'Exact Pinpoint',
      image: 'assets/images/food-eagle-logo.png',
      title: 'Never Get Lost<br>on Campus',
      description: 'Use our interactive campus map, tap your precise location, and add descriptive details so riders find you instantly.'
    }
  ];

  constructor() {
    addIcons({ arrowForward });
  }

  ngOnInit() {}

  nextSlide() {
    if (this.currentSlideIndex < this.walkthroughSlides.length - 1) {
      this.currentSlideIndex++;
    } else {
      this.currentSlideIndex = 0;
    }
  }

  setSlide(index: number) {
    this.currentSlideIndex = index;
  }
}