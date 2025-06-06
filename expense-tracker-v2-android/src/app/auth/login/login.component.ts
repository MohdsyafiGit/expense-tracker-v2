import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonCard, IonCardHeader,
  IonTitle, IonIcon, IonButton, IonAlert } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { logoGoogle, mailOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    IonAlert, IonIcon,
    IonButton, IonIcon, IonTitle, 
    IonCardHeader, IonCard, IonContent, 
    CommonModule, FormsModule],
})
export class LoginComponent {
  email = "";
  password = "";
  buttonLabel = "SIGN-IN";
  isAlertOpen = false;
  public alertButtons = [
    {
      text: 'OK',
      role: 'confirm',
    },
  ];
  alertMsg = "";

  constructor(private authService : AuthService,private route:Router) {

    this.authService.user$.subscribe((user)=>{
      if(user){
        this.route.navigate(["/tabs/transactions"]);
      }
    })
    addIcons({mailOutline,logoGoogle});
  }


  async handleGoogleClick(){
    let res = "";
    res = await this.authService.handleGoogleSignIn();

    if(res){
      this.alertMsg = res;
      this.isAlertOpen = true;
    }
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }
}
