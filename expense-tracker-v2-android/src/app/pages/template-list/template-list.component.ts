import { EditTemplateComponent } from './edit-template/edit-template.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonLabel, IonIcon, IonGrid, IonRow, IonCol, ModalController } from "@ionic/angular/standalone";
import { Observable } from 'rxjs';
import { Template } from '../../models/template.model';
import { TemplateService } from '../../services/template.service';
import { pencil, trash } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AddTemplateComponent } from './add-template/add-template.component';

@Component({
  selector: 'app-template-list',
  imports: [IonCol, IonRow, IonGrid, IonIcon, IonLabel, IonButton, CommonModule],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss',
})
export class TemplateListComponent {
  templateList$ = new Observable<Template[]>();

  constructor(
    private templateService:TemplateService,
    private modalCtrl : ModalController,
  ){
    this.templateList$ = this.templateService.templates$;
    addIcons({trash,pencil});
  }

  async handleEditTemplateClick(templateId : string){

    const template = await this.templateService.getTemplateDetail(templateId);

    const editModal = await this.modalCtrl.create({
        component: EditTemplateComponent,
        componentProps : {
          templateToEdit : template
        }
    });
    await editModal.present();
  }

  async handleDeleteTemplate(templateId:string){
    await this.templateService.deleteTemplate(templateId);
  }

  async handleAddTemplateClick(){

    const addModal = await this.modalCtrl.create({
        component: AddTemplateComponent
    });
    await addModal.present();
  }
}
