import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonTitle, IonToolbar, IonContent, IonButtons, IonButton, IonIcon } from "@ionic/angular/standalone";
import { AuthService } from '../../services/auth.service';
import { logOutOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-dashboard-tab',
  imports: [IonIcon, IonButton, IonButtons, IonContent, IonToolbar, IonTitle, IonHeader, CommonModule],
  templateUrl: './dashboard-tab.component.html',
  styleUrl: './dashboard-tab.component.scss',
})
export class DashboardTabComponent {
  constructor(private authService :AuthService){
    addIcons({logOutOutline})
  }

  onLogout(){
    this.authService.logout();
  }
}
