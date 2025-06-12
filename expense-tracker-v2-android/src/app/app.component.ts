import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private authService: AuthService, private route:Router){
    this.authService.user$.subscribe((user)=>{
      if(user){
        this.route.navigate(["/tabs/transactions"]);
      }else{
        this.route.navigate(["/login"]);
      }
    })
  }
}
