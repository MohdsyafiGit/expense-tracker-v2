import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class FireStorePath {
    private readonly userCollRef = "users";
    private readonly categoryCollRef = "categories";
    private readonly expensesCollRef = "expenses";
    userDocumentPath(userId:string){
        return `${this.userCollRef}/${userId}`;
    }

    userCollectionPath(){
        return this.userCollRef;
    }

    userCategoryCollectionPath(userId:string){
        return `${this.userCollRef}/${userId}/${this.categoryCollRef}`;
    }

    userCategoryDocPath(userId:string,categoryId:string){
        return `${this.userCollRef}/${userId}/${this.categoryCollRef}/${categoryId}`;
    }

    userExpensesCollectionPath(userId:string){
        return `${this.userCollRef}/${userId}/${this.expensesCollRef}`;
    }
}