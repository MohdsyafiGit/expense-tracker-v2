import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { LoadingComponent } from '../shared/loading/loading.component';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  modal : HTMLIonModalElement | null = null
  constructor(private modalCtrl:ModalController) {}

  async beginLoading() {
    if(!this.modal){
    this.modal = await this.modalCtrl.create({
          component: LoadingComponent,
          cssClass: 'modal-transparency'
      });
      await this.modal.present();
    }
  }

  async endLoading() {
    await this.modal?.dismiss();
    this.modal = null;
  }

}