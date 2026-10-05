import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonIcon, IonToggle,
  IonRippleEffect
} from '@ionic/angular';
import { UserDataService, NotificationPrefs } from '../../services/user-data.service';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, 
  mailOutline, 
  chatbubbleOutline,
  chevronForwardOutline,
  chevronBackOutline,
  volumeHighOutline,
  timeOutline,
  sparkles,
  optionsOutline,
  megaphoneOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.page.html',
  styleUrls: ['./notification-center.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButtons, IonBackButton, IonIcon, IonToggle,
    IonRippleEffect
  ]
})
export class NotificationCenterPage implements OnInit {

  // Channel Toggles
  pushEnabled = true;
  emailEnabled = false;
  smsEnabled = true;

  // Preference Toggles
  orderUpdates = true;
  promosEnabled = false;
  quietHours = false;

  constructor(
    private router: Router,
    private userData: UserDataService
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'mail-outline': mailOutline,
      'chatbubble-outline': chatbubbleOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'chevron-back-outline': chevronBackOutline,
      'volume-high-outline': volumeHighOutline,
      'time-outline': timeOutline,
      'sparkles': sparkles,
      'options-outline': optionsOutline,
      'megaphone-outline': megaphoneOutline
    });
  }

  ngOnInit() {
    // Restore the user's saved notification preferences.
    const prefs = this.userData.current.notificationPrefs;
    this.pushEnabled = prefs.push;
    this.emailEnabled = prefs.email;
    this.smsEnabled = prefs.sms;
    this.orderUpdates = prefs.orderUpdates;
    this.promosEnabled = prefs.promos;
    this.quietHours = prefs.quietHours;
  }

  get activeChannelsCount(): number {
    return [this.pushEnabled, this.emailEnabled, this.smsEnabled].filter(Boolean).length;
  }

  openNotificationDetail(type: string) {
    console.log(`Clicked notification setting: ${type}`);
  }

  /** Reads the new value straight from the toggle event and persists it. */
  onPrefToggle(event: CustomEvent, key: keyof NotificationPrefs) {
    const checked = !!(event?.detail && event.detail.checked);
    void this.userData.setNotificationPrefs({ [key]: checked } as Partial<NotificationPrefs>);
  }

  goBack() {
    this.router.navigate(['/profile-hub']);
  }
}