import { Injectable, NgZone } from '@angular/core';
import { FirebaseAuthentication, SignInResult, User } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { FsPathEnum } from '../models/firebase-path.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user : User| null = null;
  user$ = new BehaviorSubject<User|null>(null);

  constructor(
    private readonly ngZone: NgZone
  ){

    FirebaseAuthentication.removeAllListeners().then(() => {
      FirebaseAuthentication.addListener('authStateChange', (change) => {
        this.ngZone.run(() => {
          this.user$.next(change.user);
          this.user = change.user;
        });
      });
    });

    FirebaseAuthentication.getCurrentUser().then((result) => {
      if (result) {
        this.user$.next(result.user);
        this.user = result.user;
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
      //not using fspathbuilder to avoid circular dependency
      reference: `${FsPathEnum.userCollRef}/${userId}`, 
    });

    const userEmail = email ? email : "";

    if (!snapshot.data) {
      await FirebaseFirestore.setDocument({
        //not using fspathbuilder to avoid circular dependency
        reference: `${FsPathEnum.userCollRef}/${userId}`,
        data: { 
          email: userEmail
        },
      });
    }
  }

  async logout(){
    await FirebaseAuthentication.signOut();
  }
}
