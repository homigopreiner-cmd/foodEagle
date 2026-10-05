import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { CurvedBottomNavComponent } from './pages/curved-bottom-nav/curved-bottom-nav.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <app-curved-bottom-nav></app-curved-bottom-nav>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CurvedBottomNavComponent],
})
export class AppComponent {
  // Bootstraps the database and restores any saved session at startup.
  constructor(auth: AuthService) {
    void auth.whenReady();
  }
}