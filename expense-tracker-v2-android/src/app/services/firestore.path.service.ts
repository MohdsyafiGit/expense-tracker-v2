import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class FireStorePath {
    private readonly userCollRef = "users";

    userDocumentPath(userId:string){
        return `${this.userCollRef}/${userId}`;
    }

    userCollectionPath(){
        return this.userCollRef;
    }

}