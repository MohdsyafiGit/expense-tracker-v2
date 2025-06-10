import { CategoryService } from './../../services/category.service';
import { Category } from './../../models/category.model';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonModal, } from "@ionic/angular/standalone";
import { Observable } from 'rxjs';
import { IonIcon, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import * as iconList from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Dialog } from '@capacitor/dialog';
import { AddCategoryComponent } from './add-category/add-category.component';

@Component({
  selector: 'app-category',
  imports: [IonList, CommonModule, IonItem, IonLabel, IonIcon, IonButton, IonModal , AddCategoryComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
})
export class CategoryComponent{
  @ViewChild(IonModal) modal: IonModal | undefined;
  categories$ : Observable<Category[]> | undefined;
  allIcons = Object.keys(iconList).reduce((acc, iconName) => {
    acc[iconName] = iconList[iconName as keyof typeof iconList];
    return acc;
  }, {} as { [key: string]: string });

  constructor(
    private categoryService : CategoryService
  ){
    addIcons(this.allIcons);
    this.categories$ = this.categoryService.getCategories();
  }

  getIcon(name: string) {
    return iconList[name as keyof typeof iconList];
  }

  async removeCategory(catId:string){
    const res = await this.categoryService.deleteCategory(catId);
    if(res){
      await Dialog.alert({
          title: 'Error',
          message: res,
      });
    }
  }

  onCancelModal() {
    if(this.modal)
      this.modal.dismiss(null, 'cancel');
  }

  onConfirmModal() {
    if(this.modal)
      this.modal.dismiss("", 'confirm');
  }

}
