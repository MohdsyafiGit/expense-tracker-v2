import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonLabel, IonIcon, IonButton,ModalController } from "@ionic/angular/standalone";
import { FilterService } from '../../services/filter.service';
import { Observable } from 'rxjs';
import { Filter } from '../../models/filter.model';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';
import { AddFilterComponent } from "./add-filter/add-filter.component";
import { EditFilterComponent } from './edit-filter/edit-filter.component';

@Component({
  selector: 'app-filter-list',
  imports: [ IonButton, IonIcon, IonLabel, IonCol, IonRow, IonGrid, CommonModule],
  templateUrl: './filter-list.component.html',
  styleUrl: './filter-list.component.scss',
})
export class FilterListComponent {
  filterList$ = new Observable<Filter[]>();

  constructor(private filterService: FilterService,private modalCtrl:ModalController) {
    this.filterList$ = this.filterService.filters$;
    addIcons({trash,pencil});
  }

  async handleEditFilterClick(filterId : string){

    const filter = await this.filterService.getFilterDetail(filterId);

    const editModal = await this.modalCtrl.create({
        component: EditFilterComponent,
        componentProps : {
          filterToEdit : filter
        }
    });
    await editModal.present();
  }

  async handleDeleteFilter(filterId:string){
    await this.filterService.deleteFilter(filterId);
  }

  async handleAddFilterClick(){

    const addModal = await this.modalCtrl.create({
        component: AddFilterComponent
    });
    await addModal.present();
  }
}
