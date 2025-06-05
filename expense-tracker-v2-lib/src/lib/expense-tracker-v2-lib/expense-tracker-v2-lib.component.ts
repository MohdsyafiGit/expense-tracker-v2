import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'lib-expense-tracker-v2-lib',
  imports: [CommonModule,IonicModule],
  templateUrl: './expense-tracker-v2-lib.component.html',
  styleUrl: './expense-tracker-v2-lib.component.css',
  
})
export class ExpenseTrackerV2LibComponent {
    @Input() color = 'primary';
    @Input() fill = 'solid';
}
