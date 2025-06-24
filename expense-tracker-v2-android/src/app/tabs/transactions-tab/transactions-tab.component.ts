import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTitle, IonToolbar, IonContent, IonHeader, IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-transactions-tab',
  imports: [IonIcon, IonButtons, IonButton, IonHeader, IonContent, IonToolbar, IonTitle, CommonModule],
  templateUrl: './transactions-tab.component.html',
  styleUrl: './transactions-tab.component.scss',
})
export class TransactionsTabComponent {
  constructor(private authService :AuthService){
    addIcons({logOutOutline})
  }

  async onLogout(){
   await this.authService.logout();
  }
}
