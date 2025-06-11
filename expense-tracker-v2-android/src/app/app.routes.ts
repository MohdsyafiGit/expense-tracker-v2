import { CanActivateFn, Router, Routes, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable, of, switchMap, take } from 'rxjs';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree>  => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        return of(router.createUrlTree(['/login']));
      }
      return of(true); // Allow navigation
    })
  );
};

export const routes: Routes = [

  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
     canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
];

