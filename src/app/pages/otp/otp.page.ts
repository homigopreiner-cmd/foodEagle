import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle 
} from '@ionic/angular';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.page.html',
  styleUrls: ['./otp.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonTitle
  ]
})
export class OtpPage implements OnInit, OnDestroy {
  otpDigits: string[] = ['', '', '', ''];
  currentIndex: number = 0;
  
  resendSeconds: number = 59;
  private timerInterval: any;

  constructor(
    private router: Router,
    private zone: NgZone,
    private userData: UserDataService
  ) { }

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startTimer() {
    this.clearTimer();
    this.resendSeconds = 59;
    
    // Use NgZone to ensure UI updates immediately on every tick
    this.timerInterval = setInterval(() => {
      this.zone.run(() => {
        if (this.resendSeconds > 0) {
          this.resendSeconds--;
        } else {
          this.clearTimer();
        }
      });
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resendCode() {
    if (this.resendSeconds === 0) {
      this.startTimer();
    }
  }

  isComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }

  appendNumber(num: string) {
    if (this.currentIndex < 4) {
      this.otpDigits[this.currentIndex] = num;
      this.currentIndex++;
      
      // Enforce rule: Automatically proceed only when all 4 digits are filled
      if (this.isComplete()) {
        setTimeout(() => {
          this.completeVerification();
        }, 300);
      }
    }
  }

  deleteNumber() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.otpDigits[this.currentIndex] = '';
    }
  }

  onDone() {
    // Enforce rule: Block navigation if PIN is incomplete
    if (this.isComplete()) {
      this.completeVerification();
    }
  }

  /**
   * Verification complete: new users go to pin their delivery spot,
   * returning users go straight to their dashboard.
   */
  private completeVerification() {
    const hasLocation = !!this.userData.current.location;
    this.router.navigate([hasLocation ? '/dashboard' : '/location-setup'], { replaceUrl: true });
  }
}