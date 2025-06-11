import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonItem, IonInput, IonIcon, IonGrid, IonRow, IonCol, IonSpinner } from "@ionic/angular/standalone";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import * as iconList from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CategoryService } from '../../../services/category.service';
import { AddCategoryForm } from '../../../models/category.model';
import { Dialog } from '@capacitor/dialog';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-add-category',
  imports: [IonCol, IonRow, IonGrid, IonIcon, IonInput, IonItem, IonContent, IonButton, IonButtons, IonToolbar, IonHeader, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
})
export class AddCategoryComponent {

  confirmClick = output();
  cancelClick = output();
  iconNames: string[] = Object.keys(iconList);
  selectedIconName$ = new BehaviorSubject<string>("") ;
  $searchTermEvent = new Subject<string>();
  $iconSearchResult = new BehaviorSubject<string[]>([]);
  searchTerm  = "";
  addCategoryForm = new AddCategoryForm();
  allIcons = Object.keys(iconList).reduce((acc, iconName) => {
    acc[iconName] = iconList[iconName as keyof typeof iconList];
    return acc;
  }, {} as { [key: string]: string });

  constructor(private categoryService: CategoryService,private loadingService:LoadingService){
    addIcons(this.allIcons);
    this.addCategoryForm = this.categoryService.addCategoryForm;

    this.selectedIconName$.subscribe((val)=>{
      this.addCategoryForm.iconNameFc?.patchValue(val);
    })

    this.$searchTermEvent.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        if(value)
          this.handleSearch();
        else
          this.$iconSearchResult.next([]);
    });
  }

  getIcon(name: string) {
    return iconList[name as keyof typeof iconList];
  }

  cancel() {
    this.$iconSearchResult.next([]);
    this.cancelClick.emit();
  }

  async confirm() {

    if(this.addCategoryForm && this.addCategoryForm.nameFc?.value && this.addCategoryForm.iconNameFc?.value){
      this.categoryService.addCategory();
    }else{
      await Dialog.alert({
        title: 'Error',
        message: 'Missing input value',
      });
    }

    this.$iconSearchResult.next([]);
    this.confirmClick.emit();
  }

  handleIconClick(iconName:string){
    this.selectedIconName$.next(iconName)
  }

  async handleClickShowAll(){
    await this.loadingService.beginLoading();

    setTimeout(async () => {
      this.$iconSearchResult.next(this.iconNames);
      await this.loadingService.endLoading();
    }, 500);

  }

  handleSearch(){
    const res = this.iconNames.filter((iconName)=> iconName.toLowerCase().includes(this.searchTerm.toLowerCase().trim()))
    this.$iconSearchResult.next(res);
  }
}

