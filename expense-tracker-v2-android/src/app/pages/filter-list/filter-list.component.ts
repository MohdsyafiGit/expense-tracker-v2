import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonLabel, IonIcon, IonButton, IonModal,ModalController } from "@ionic/angular/standalone";
import { FilterService } from '../../services/filter.service';
import { Observable } from 'rxjs';
import { Filter } from '../../models/filter.model';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';
import { AddFilterComponent } from "./add-filter/add-filter.component";
import { EditFilterComponent } from './edit-filter/edit-filter.component';

@Component({
  selector: 'app-filter-list',
  imports: [ IonModal, IonButton, IonIcon, IonLabel, IonCol, IonRow, IonGrid, CommonModule, AddFilterComponent],
  templateUrl: './filter-list.component.html',
  styleUrl: './filter-list.component.scss',
})
export class FilterListComponent {
  @ViewChild(IonModal) modal: IonModal | undefined;
  editModal : HTMLIonModalElement | null = null
  filterList$ = new Observable<Filter[]>();

  constructor(private filterService: FilterService,private modalCtrl:ModalController) {
    this.filterList$ = this.filterService.filters$;
    addIcons({trash,pencil});

    this.filterService.dismissEditFilterModal$.subscribe(()=>{
      if(this.editModal){
        this.editModal.dismiss();
        this.editModal = null
      }
    })
  }

  async handleFilterClick(filterId : string){

    this.filterService.filterIdToEdit = filterId;
    if(!this.editModal){
      this.editModal = await this.modalCtrl.create({
          component: EditFilterComponent,
      });
      await this.editModal.present();
    }
  }

  async handleDeleteFilter(filterId:string){
    await this.filterService.deleteFilter(filterId);
  }

  closeModal(){
    if(this.modal)
      this.modal?.dismiss();
  }
}
