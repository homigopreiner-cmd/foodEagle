import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonSearchbar, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonIcon, IonLabel,
  IonAccordionGroup, IonAccordion, IonButton 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  helpCircleOutline, 
  mapOutline, 
  receiptOutline, 
  shieldCheckmarkOutline, 
  chatboxEllipsesOutline,
  searchOutline,
  headsetOutline,
  mailOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-help-center',
  templateUrl: './help-center.page.html',
  styleUrls: ['./help-center.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButtons, IonBackButton, IonSearchbar, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonList, IonItem, IonIcon, IonLabel,
    IonAccordionGroup, IonAccordion, IonButton
  ]
})
export class HelpCenterPage implements OnInit {

  searchTerm: string = '';

  faqList = [
    { id: 'q1', title: 'How do I reset my password?', category: 'Security', answer: 'Go to the security settings page or click "Forgot Password" on the login screen to receive a secure password reset link via email.', icon: 'help-circle-outline' },
    { id: 'q2', title: 'Managing saved shipping destinations', category: 'Delivery', answer: 'You can add, edit, or delete your delivery and office addresses directly from the "Saved Addresses" menu in your Profile Hub.', icon: 'map-outline' },
    { id: 'q3', title: 'Billing history & invoices', category: 'Account', answer: 'Your recent membership charges, receipts, and downloadable invoices can be viewed under your account details.', icon: 'receipt-outline' },
    { id: 'q4', title: 'Two-Factor Authentication Setup', category: 'Security', answer: 'Secure your account by enabling Two-Factor Authentication (2FA) under the Security & Privacy settings page.', icon: 'shield-checkmark-outline' },
    { id: 'q5', title: 'Contact Customer Relations', category: 'Support', answer: 'Our customer support team is available to assist you. You can reach out via email at support@example.com or use live chat.', icon: 'chatbox-ellipses-outline' }
  ];

  filteredFaqList = this.faqList;

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'help-circle-outline': helpCircleOutline,
      'map-outline': mapOutline,
      'receipt-outline': receiptOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'chatbox-ellipses-outline': chatboxEllipsesOutline,
      'search-outline': searchOutline,
      'headset-outline': headsetOutline,
      'mail-outline': mailOutline,
      'chevron-forward-outline': chevronForwardOutline
    });
  }

  ngOnInit() { }

  filterTopics(event: any) {
    const query = event.target.value ? event.target.value.toLowerCase() : '';
    this.searchTerm = query;
    if (!query) {
      this.filteredFaqList = this.faqList;
    } else {
      this.filteredFaqList = this.faqList.filter(item => 
        item.title.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
      );
    }
  }

  contactSupportEmail() {
    window.location.href = 'mailto:support@foodeagle.edu.ph';
  }
}