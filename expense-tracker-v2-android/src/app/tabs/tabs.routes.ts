import { Routes } from '@angular/router';
import { TabsComponent } from './tabs.component';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsComponent,
    children: [
      {
        path: 'transactions',
        loadComponent: () =>
          import('./transactions-tab/transactions-tab.component').then((m) => m.TransactionsTabComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard-tab/dashboard-tab.component').then((m) => m.DashboardTabComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings-tab/settings-tab.component').then((m) => m.SettingsTabComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/transactions',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/transactions',
    pathMatch: 'full',
  },
];
