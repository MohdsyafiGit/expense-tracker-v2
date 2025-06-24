import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { FirebasePathBuilderService } from './firebase-path-builder.service';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { Expense } from '../models/expense.model';
import { AuthService } from './auth.service';
import { AddCategoryForm } from '../forms/category/add-category.form';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categories: Category[] = [];
  categories$ = new BehaviorSubject<Category[]>([]);
  private categoriesSub : Subscription | null = null;
  public addCategoryForm : AddCategoryForm = new AddCategoryForm();
  constructor(private path: FirebasePathBuilderService,private authService:AuthService) {

    this.authService.user$.subscribe((user)=>{
      if(!user){
        this.resetCategoriesSub();
        this.categories = [];
        this.categories$.next([]);
      }else{
        this.resetCategoriesSub();
        this.categoriesSub = this.getCategories().subscribe();
      }
    })
  }
  private getCategories(): Observable<Category[]> {
    return new Observable(observer => {
      let callbackId = "";

      const setupListener = async () => {
        try {
          callbackId = await FirebaseFirestore.addCollectionSnapshotListener({
            reference : this.path.userCategoryCollectionPath()
          }, (event, error) => {
            if (error) {
              console.error(error);
            } else if (event) {
              const list: Category[] = event.snapshots.map(
                (item) => ({ ...item.data, id: item.id } as Category)
              );
              this.categories = list;
              this.categories$.next(this.categories);
              observer.next(list);
            }
          });

        } catch (error) {
          observer.error(error);
        }
      };

      setupListener();

      // Cleanup function
      return async () => {
        if (callbackId) {
          try {
            await FirebaseFirestore.removeSnapshotListener({ callbackId });
          } catch (error) {
            console.error('Error removing snapshot listener:', error);
          }
        }
      };
    });
  }

	async deleteCategory(catId:string){
    const { snapshots : expensesSnapShot } = await FirebaseFirestore.getCollection<Expense>({
      reference: this.path.userExpensesCollectionPath(),
      compositeFilter: {
        type: 'and',
        queryConstraints: [
          {
            type: 'where',
            fieldPath: 'catId',
            opStr: '==',
            value: catId,
          },
        ],
      },
    });

    if(expensesSnapShot && expensesSnapShot.length > 0){
      return "Category in use, unable to delete";
    }else{
      const docRef = this.path.userCategoryDocPath(catId);
      await FirebaseFirestore.deleteDocument({reference: docRef,});
      return ""
    }
  }

  async addCategory(){
    const newCat = new Category(this.addCategoryForm.nameFc?.value,this.camelToKebab(this.addCategoryForm.iconNameFc?.value));
    
    await FirebaseFirestore.addDocument({
      reference: this.path.userCategoryCollectionPath(),
      data:  <Category>{ 
        id: "",
        name: newCat.name,
        iconName: newCat.iconName,
      },
    });
  }

  camelToKebab(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  resetCategoriesSub(){
    if(this.categoriesSub)
    {
      this.categoriesSub.unsubscribe();
      this.categoriesSub = null;
    }
  }

}
