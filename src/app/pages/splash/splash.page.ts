import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class SplashPage implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    // Give the brand animation its moment, then route by session state:
    // a returning user lands straight on their dashboard.
    setTimeout(async () => {
      await this.auth.whenReady();
      if (this.auth.isAuthenticated) {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      } else {
        this.router.navigate(['/walkthrough'], { replaceUrl: true });
      }
    }, 3500); // 3.5 seconds immersive show
  }
}