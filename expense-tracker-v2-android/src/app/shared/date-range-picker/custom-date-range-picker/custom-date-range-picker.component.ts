import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonList, IonLabel, IonItem, IonDatetimeButton, IonModal, IonDatetime } from "@ionic/angular/standalone";
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-date-range-picker',
  imports: [IonDatetime, IonModal, IonDatetimeButton, IonItem, IonLabel, IonList, IonCardHeader, IonCard, CommonModule,ReactiveFormsModule],
  templateUrl: './custom-date-range-picker.component.html',
  styleUrl: './custom-date-range-picker.component.scss',
})
export class CustomDateRangePickerComponent implements OnInit {

  dateTimePresentation = "date";
  @Input() startDate! : FormControl<string>;
  @Input() endDate! : FormControl<string>;

  ngOnInit(): void {
    if(this.startDate.value)
      this.startDate.setValue(this.getISODate(this.startDate.value) ?? this.getCurrentTime());
    else
      this.startDate.setValue(this.getCurrentTime());

    if(this.endDate.value)
      this.endDate.setValue(this.getISODate(this.endDate.value) ?? this.getCurrentTime());
    else
      this.endDate.setValue(this.getCurrentTime());
  }

  getISODate(inputDate:string):string{
    try{
      const localDate = new Date(inputDate);
      return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }catch(err){
      console.log("Failed to parse date in getISODate");
      console.error(err);
      return ""
    }

  }

  getCurrentTime(){
    try{
      return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }catch(err){
      console.log("Failed to parse date in getCurrentTime");
      console.error(err);
      return ""
    }

  }
}
