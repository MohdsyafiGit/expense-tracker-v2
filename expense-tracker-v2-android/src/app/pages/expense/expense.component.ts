import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonToggle, ToggleCustomEvent, ModalController } from "@ionic/angular/standalone";
import { Filter } from '../../models/filter.model';
import { FilterService } from '../../services/filter.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { addIcons } from 'ionicons';
import { addOutline, filterOutline } from 'ionicons/icons';
import { ExpenseListComponent } from './expense-list/expense-list.component';
import { GroupExpense } from '../../models/group-expense.model';
import { ExpenseService } from '../../services/expense.service';
import { AccountWithTotal } from '../../models/account-with-total.model';
import { CategoryWithTotal } from '../../models/category-with-total.model';
import { CategoryService } from '../../services/category.service';
import  Chart from 'chart.js/auto';
import { BankService } from '../../services/bank.service';
import { CategoryIconComponent } from '../../shared/category-icon/category-icon.component';
import { AccountDetailComponent } from '../../shared/account-detail/account-detail.component';
import { GradientBackgroundDirective } from '../../shared/gradient-background.directive';
import { ExpenseFormComponent } from './expense-form/expense-form.component';

@Component({
  selector: 'app-expense',
  imports: [
    IonToggle, IonLabel, IonItem, IonAccordion, IonAccordionGroup, 
    IonCard, ExpenseListComponent, IonIcon, IonButton, CommonModule , 
    CategoryIconComponent, AccountDetailComponent, GradientBackgroundDirective],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss',
})
export class ExpenseComponent implements OnDestroy{
  destroy$ = new Subject<void>();
  currentFilter = new Filter("Please Select");
  currentFilterTotal = signal(0);
  displayStartDate = "";
  displayEndDate = "";
  currentFilterExpenses$ = new Observable<GroupExpense[]>;
  totalPerAccountList$ = new Observable<AccountWithTotal[]>;
  totalPerCatList$ = new Observable<CategoryWithTotal[]>;
  totalPerAccountList: AccountWithTotal[] = [];
  totalPerCatList: CategoryWithTotal[] = [];
  isViewCatChart = false;
  isViewAccChart = false;
  totalPerAccChart: Chart<"pie", number[], string> | null = null;
  totalPerCatChart: Chart<"pie", number[], string> | null = null;
  pieChartColors = ['#274690', '#464D77', '#C0C0C0', '#94B0DA', '#36827F'];

  constructor(
    private filterService : FilterService,
    private expenseService : ExpenseService,
    private categoryService : CategoryService,
    private bankService :BankService,
    private modalCtrl : ModalController
  ){
    this.filterService.currentFilter$
    .pipe(takeUntil(this.destroy$))
    .subscribe((filter)=>{
      if(filter){
        this.currentFilter = filter;
        this.setObservables();
      }
    })
    addIcons({filterOutline,addOutline})
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async setObservables(){

    this.currentFilterExpenses$ = this.expenseService.getFilteredExpensesObservable(this.currentFilter).pipe(
      tap(async (collections: GroupExpense[]) => {
        if (collections && collections.length > 0) {
          const totalExpense = collections.reduce((prev, curr) => prev + curr.total, 0);
          this.currentFilterTotal.set(totalExpense);
          this.displayStartDate = collections[collections.length - 1].dateTime;
          this.displayEndDate = collections[0].dateTime;
        }else{
          const totalExpense = 0;
          this.currentFilterTotal.set(totalExpense);
          this.displayStartDate = "";
          this.displayEndDate = "";
        }
      })
    );

    this.totalPerAccountList$ = this.expenseService.getTotalPerAccountListObservable(this.currentFilter)
    .pipe(
      tap(async (list)=>{
        this.totalPerAccountList = list;

        if(this.isViewAccChart && this.totalPerAccountList)
          await this.loadAccChart(); 
    }));


    this.totalPerCatList$ = this.expenseService.getTotalPerCategoryListObservable(this.currentFilter)
    .pipe(
      tap(async (list)=>{
        this.totalPerCatList = list;

        if(this.isViewCatChart && this.totalPerCatList)
          await this.LoadCatChart();
      }));
  }

  async handleCatChartToggleChange(toggle: ToggleCustomEvent) {
    this.isViewCatChart = toggle.detail.checked;
    if(this.isViewCatChart)
      await this.LoadCatChart(); 
  }

  async handleAccChartToggleChange(toggle: ToggleCustomEvent) {
    this.isViewAccChart = toggle.detail.checked;
    if(this.isViewAccChart)
      await this.loadAccChart();
  }

  async loadAccChart(){
    const res = await this.createAccChartData(this.totalPerAccountList);
    this.totalPerAccChart = this.createChart('total-per-account', res);   
  }

  async LoadCatChart(){
    const res = await this.createCatChartData(this.totalPerCatList);
    this.totalPerCatChart = this.createChart('total-per-cat', res);
  }

  async createAccChartData(totalPerAccList: AccountWithTotal[]) {
    const data: { totalSpent: number; label: string; color: string }[] = [];
    for (let i = 0; i < totalPerAccList.length; i++) {
      const res = await this.bankService.getBankAccountDetail(
        totalPerAccList[i].bankId,
        totalPerAccList[i].accId
      );
      if (res && i <= 3) {
        data.push({
          totalSpent: totalPerAccList[i].total,
          label: res.accName + '-' + res.bankName,
          color: this.pieChartColors[i],
        });
      } else {
        const others = data.find((item) => item.label === 'Others');
        if (others) {
          data[4].totalSpent += totalPerAccList[i].total;
        } else
          data.push({
            totalSpent: totalPerAccList[i].total,
            label: 'Others',
            color: this.pieChartColors[4],
          });
      }
    }
    return data;
  }

  async createCatChartData(totalPerAccList: CategoryWithTotal[]) {
    const data: { totalSpent: number; label: string; color: string }[] = [];
    for (let i = 0; i < totalPerAccList.length; i++) {
      const res = await this.categoryService.getCategoryDetail(
        totalPerAccList[i].catId
      );
      if (res && i <= 3) {
        data.push({
          totalSpent: totalPerAccList[i].total,
          label: res.name,
          color: this.pieChartColors[i],
        });
      } else {
        const others = data.find((item) => item.label === 'Others');
        if (others) {
          data[4].totalSpent += totalPerAccList[i].total;
        } else
          data.push({
            totalSpent: totalPerAccList[i].total,
            label: 'Others',
            color: this.pieChartColors[4],
          });
      }
    }
    return data;
  }

  createChart(
    chartId: string,
    data: { totalSpent: number; label: string; color: string }[]
  ) {
    const chartExist = Chart.getChart(chartId);
    if (chartExist != undefined) chartExist.destroy();

    return new Chart(chartId, {
      type: 'pie',

      data: {
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: 'Total Spent in MYR',
            data: data.map((item) => item.totalSpent),
            backgroundColor: data.map((item) => item.color),
            hoverOffset: 4,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
        },
        borderColor: '#8DA9C4',
        aspectRatio: 1.5,
      },
    });
  }

  async openNewExpenseModal(){
    const modal  = await this.modalCtrl.create({
      component : ExpenseFormComponent
    })
    modal.present();
  }
}
