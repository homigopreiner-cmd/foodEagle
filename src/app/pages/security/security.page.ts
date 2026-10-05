import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonCard, IonCardContent, 
  IonLabel, IonIcon, IonText, IonList, IonItem, IonToggle, IonButton, IonInput 
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  keyOutline, 
  shieldCheckmarkOutline, 
  phonePortraitOutline, 
  fingerPrintOutline, 
  chevronForwardOutline,
  arrowBackOutline,
  shieldCheckmark,
  trashOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  saveOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-security',
  templateUrl: './security.page.html',
  styleUrls: ['./security.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButtons, IonBackButton, IonCard, IonCardContent, 
    IonLabel, IonIcon, IonText, IonList, IonItem, IonToggle, IonButton, IonInput
  ]
})
export class SecurityPage implements OnInit {

  selectedOption: string | null = null;

  // Form states & feedback animation flags
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  biometricEnabled = true;
  passSuccess = false;
  passwordError = '';
  isUpdating = false;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    addIcons({
      'key-outline': keyOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'finger-print-outline': fingerPrintOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'arrow-back-outline': arrowBackOutline,
      'shield-checkmark': shieldCheckmark,
      'trash-outline': trashOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'lock-closed-outline': lockClosedOutline,
      'save-outline': saveOutline
    });
  }

  ngOnInit() {}

  selectOption(option: string) {
    this.selectedOption = option;
  }

  goBack() {
    if (this.selectedOption) {
      this.selectedOption = null;
    } else {
      this.router.navigate(['/profile-hub']);
    }
  }

  async updatePassword() {
    if (this.isUpdating) return;
    this.passwordError = '';

    if (!this.currentPassword && !this.auth.currentUser?.hasPassword) {
      // Migrated account without a stored password — nothing to verify.
    } else if (!this.currentPassword) {
      this.passwordError = 'Enter your current password.';
      return;
    }
    if (!this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Fill in the new password fields.';
      return;
    }

    this.isUpdating = true;
    try {
      const result = await this.auth.changePassword(this.currentPassword, this.newPassword, this.confirmPassword);
      if (!result.ok) {
        this.passwordError = result.error;
        return;
      }

      this.passSuccess = true;
      setTimeout(() => {
        this.passSuccess = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.selectedOption = null;
      }, 1500);
    } finally {
      this.isUpdating = false;
    }
  }

  revokeSession(deviceName: string) {
    // Single-device local database: only the current session exists.
    console.log(`Revoked session for: ${deviceName}`);
  }
}