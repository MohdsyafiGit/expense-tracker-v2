import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryTrendComponent } from "./category-trend/category-trend.component";
import { MonthlyTotalSpentComponent } from "./monthly-total-spent/monthly-total-spent.component";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CategoryTrendComponent, MonthlyTotalSpentComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
