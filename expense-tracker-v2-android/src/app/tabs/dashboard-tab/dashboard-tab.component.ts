import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonTitle, IonToolbar, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-dashboard-tab',
  imports: [IonContent, IonToolbar, IonTitle, IonHeader, CommonModule],
  templateUrl: './dashboard-tab.component.html',
  styleUrl: './dashboard-tab.component.scss',
})
export class DashboardTabComponent {}
