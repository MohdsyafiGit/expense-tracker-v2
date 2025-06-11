import { Injectable } from "@angular/core";
import { FsPathEnum } from "../models/firebase-path.enum";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class FirebasePathBuilderService {

   userId = "";
    constructor(private authService : AuthService){
        this.authService.user$
        .subscribe((user)=>{
        this.userId = user?.uid ?? "";
        })
    }
    userDocumentPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}`;
    }

    userCollectionPath(){
        return FsPathEnum.userCollRef;
    }

    userCategoryCollectionPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.categoryCollRef}`;
    }

    userCategoryDocPath(categoryId:string){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.categoryCollRef}/${categoryId}`;
    }

    userExpensesCollectionPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.expensesCollRef}`;
    }

    userBankCollectionPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.banksCollRef}`;
    }

    userBankDocPath(bankId:string){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.banksCollRef}/${bankId}`;
    }

    userImagesFolderPath(){
      return `${FsPathEnum.imagesStorageFolder}/${this.userId}`;
    }

    userBankImagePath(picName:string){
      return `${FsPathEnum.imagesStorageFolder}/${this.userId}/${picName}`
    }
}