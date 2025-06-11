import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { SafeUrl } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-bank-img',
  imports: [CommonModule],
  templateUrl: './bank-img.component.html',
  styleUrl: './bank-img.component.scss',
})
export class BankImgComponent implements OnDestroy, OnInit{

  destroy$ = new Subject<void>();
  private _picName = "";
  @Input() set picName(value: string) {
    if (value) {
      this._picName = value;
      this.loadImage();  // Call this method when picName changes
    }
  }
  get picName(): string {
    return this._picName;
  }

  private _size = "normal";
  @Input() set size(value: string) {
    if (value) {
      this._size = value;
    }
  }
  get size(): string {
    return this._size;
  }

  picUrl = signal<string|SafeUrl>("");

  constructor(private bankService : BankService) { 
    addIcons({imageOutline});
    this.bankService.bankPictures$
      .pipe(
        debounceTime(50),
        takeUntil(this.destroy$)
      )
      .subscribe((bankPicMap)=>{

          const newUrl = bankPicMap.get(this.picName)?? "";

          if(newUrl && newUrl !== this.picUrl()){
            this.picUrl.set(newUrl);
          }
      })
  }
  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }

  }

  async ngOnInit(): Promise<void> {
    if (this.picName) {
      await this.loadImage();
    }
  }

  private async loadImage(): Promise<void> {
    const url = this.bankService.bankPictures.get(this.picName) ?? "";

    if(!url){
      await this.bankService.getBankPicUrl(this.picName);
    }else{
      this.picUrl.set(url);
    }

  }
}
