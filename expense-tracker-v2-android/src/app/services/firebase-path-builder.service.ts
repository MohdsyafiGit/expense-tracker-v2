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

    userExpensesDocPath(expenseId:string){
      return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.expensesCollRef}/${expenseId}`;
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

    userReceiptFolderPath(){
      return `${FsPathEnum.receiptsStorageFolder}/${this.userId}`
    }

    userReceiptPath(receiptName:string){
      return `${FsPathEnum.receiptsStorageFolder}/${this.userId}/${receiptName}`
    }

    userFilterCollectionPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.filterCollRef}`;
    }

    userFilterDocPath(filterId:string){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.filterCollRef}/${filterId}`;
    }

    userTemplateCollectionPath(){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.templateCollRef}`;
    }

    userTemplateDocPath(templateId:string){
        return `${FsPathEnum.userCollRef}/${this.userId}/${FsPathEnum.templateCollRef}/${templateId}`;
    }


}