import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { CurvedBottomNavComponent } from './shared/components/curved-bottom-nav/curved-bottom-nav.component';
import { AuthService } from './core/services/auth.service';
import { SeedService } from './core/services/seed.service';

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
  // Bootstraps the database, restores any saved session and loads the
  // first-run catalogue at startup.
  constructor(auth: AuthService, seed: SeedService, router: Router) {
    void auth.whenReady();
    void seed.ready();

    // The Admin console is a full-width desktop dashboard, so it opts out of
    // the centered phone-frame simulation that wraps every other screen.
    const syncFrame = () =>
      document.documentElement.classList.toggle(
        'app-admin',
        router.url.split('?')[0].startsWith('/admin')
      );
    syncFrame();
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(syncFrame);
  }
}