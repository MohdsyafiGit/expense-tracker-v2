import { Component, Input, OnInit, } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";
import * as icons from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-icon',
  templateUrl: './category-icon.component.html',
  styleUrls: ['./category-icon.component.scss'],  
  imports:[IonIcon,CommonModule]
})
export class CategoryIconComponent implements OnInit {
  private _categoryId  = ""
  @Input() set categoryId(value: string) {
    if(value){
      this._categoryId = value;
      this.loadIconName();
    }
  }
  get categoryId():string{
    return this._categoryId;
  }
  
  iconName = "";

  constructor(private categoryService:CategoryService) { 
    addIcons(icons);
  }
  async ngOnInit(): Promise<void> {
    await this.loadIconName();
  }

  async loadIconName(){

    if(this.categoryId){
      this.iconName = await this.categoryService.getCategoryIconName(this.categoryId);
    }
  }

}
