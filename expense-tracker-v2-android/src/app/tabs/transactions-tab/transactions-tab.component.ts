import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTitle, IonToolbar, IonContent, IonHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-transactions-tab',
  imports: [IonHeader, IonContent, IonToolbar, IonTitle, CommonModule],
  templateUrl: './transactions-tab.component.html',
  styleUrl: './transactions-tab.component.scss',
})
export class TransactionsTabComponent {}
