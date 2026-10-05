import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-order-success',
  template: `
    <ion-content [fullscreen]="true" style="--background: #791717;">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 24px; text-align: center; color: white;">
        
        <div style="background: rgba(255,255,255,0.15); width: 90px; height: 90px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <ion-icon name="checkmark-circle-outline" style="font-size: 4rem; color: #ffb300;"></ion-icon>
        </div>

        <h1 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 8px;">Thank You For Your Order!</h1>
        <p style="font-size: 0.9rem; color: #f2e3db; margin-bottom: 30px; max-width: 280px;">Your foodEagle delivery is being prepared and will be on its way shortly.</p>

        <div class="divine-glow-container">
          <ion-button expand="block" (click)="goHome()" class="glow-button">
            BACK TO HOME
          </ion-button>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    @keyframes divineGlow {
      0% {
        box-shadow: 0 0 5px rgba(255, 179, 0, 0.4), 0 0 15px rgba(255, 179, 0, 0.3), 0 0 25px rgba(255, 179, 0, 0.2);
      }
      50% {
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 179, 0, 0.6), 0 0 45px rgba(255, 179, 0, 0.4);
      }
      100% {
        box-shadow: 0 0 5px rgba(255, 179, 0, 0.4), 0 0 15px rgba(255, 179, 0, 0.3), 0 0 25px rgba(255, 179, 0, 0.2);
      }
    }

    .divine-glow-container {
      width: 100%;
      max-width: 240px;
      border-radius: 14px;
      animation: divineGlow 2.5s infinite ease-in-out;
    }

    .glow-button {
      --background: #ffb300;
      --color: #222222;
      --border-radius: 14px;
      width: 100%;
      font-weight: 800;
      height: 48px;
      margin: 0;
      letter-spacing: 0.5px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon]
})
export class OrderSuccessPage implements OnInit, OnDestroy {
  constructor(private router: Router) {
    addIcons({ checkmarkCircleOutline });
  }

  ngOnInit() {
    // Hide global bottom navigation bar on success screen
    const navBar = document.querySelector('app-curved-bottom-nav') as HTMLElement;
    if (navBar) {
      navBar.style.display = 'none';
    }
  }

  ngOnDestroy() {
    // Restore global bottom navigation bar when leaving
    const navBar = document.querySelector('app-curved-bottom-nav') as HTMLElement;
    if (navBar) {
      navBar.style.display = '';
    }
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }
}