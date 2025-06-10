import { Injectable } from '@angular/core';
import { FirebaseAuthentication, SignInResult, User } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { FireStorePath } from './firestore.path.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user : User| null = null;
  user$ = new BehaviorSubject<User|null>(null);

  constructor(
    private fsPath:FireStorePath
  ){
    FirebaseAuthentication.getCurrentUser().then((result) => {
      if (result) {
        this.user$.next(result.user);
      } else {
        this.user$.next(null);
      }
    });
  }
  async handleGoogleSignIn(){

    const res : SignInResult = await FirebaseAuthentication.signInWithGoogle();
    
    if(res && res.user){
      this.user = res.user
      this.user$.next(this.user);
      this.addUserDocIfNotExist(this.user.uid,this.user.email);
      return ""
    }
    else
      return "Failed to login";
      
  }

  async addUserDocIfNotExist(userId: string, email: string | null) {
    const { snapshot } = await FirebaseFirestore.getDocument({
      reference: this.fsPath.userDocumentPath(userId),
    });

    const userEmail = email ? email : "";

    if (!snapshot.data) {
      await FirebaseFirestore.setDocument({
        reference: this.fsPath.userDocumentPath(userId),
        data: { 
          email: userEmail
        },
      });
    }
  }

  isAuthenticated(){
    if(this.user && this.user.uid)
      return true;
    else
      return false;
  }

  getUserId(){
    if(this.user)
      return this.user.uid;
    else
      return "";
  }
}
