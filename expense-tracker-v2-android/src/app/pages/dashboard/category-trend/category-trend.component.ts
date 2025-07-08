import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { ChartData } from '../../../models/line-chart-data.model';
import { ChartDataset } from '../../../models/chart-data.model';
import { CategoryService } from '../../../services/category.service';
import { Chart } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-category-trend',
  imports: [CommonModule],
  templateUrl: './category-trend.component.html',
  styleUrl: './category-trend.component.scss',
})
export class CategoryTrendComponent implements OnDestroy{

  private lineChartdata = new ChartData();
  categoryChart : Chart<"line"> | null = null;
  chartId = "category-trend";
  destroy$ = new Subject<void>();
  constructor(
    private dashboardService : DashboardService,
    private categoryService : CategoryService
  ){
    this.dashboardService.groupByCatExpenses$
    .pipe(takeUntil(this.destroy$))
    .subscribe(async (expenses)=>{

      for(let i = 0 ; i<=4;i++){
        const groupExpense  = expenses[i];
        const catDetail = await this.categoryService.getCategoryDetailOffline(groupExpense.catId);

        this.lineChartdata.datasets.push(new ChartDataset(
          catDetail?.name,
          groupExpense.totalExpenseByMonthList.map((item)=> {return item.total}),
          this.dashboardService.chartColors[i],
          this.dashboardService.chartColors[i]          
        ))
      }

      if(expenses.length > 0){
        this.lineChartdata.labels = expenses[0].totalExpenseByMonthList.map((item)=> {return this.dashboardService.getMonthName(item.month)});
        this.createChart();
      }
    })
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createChart(
  ) {
    const chartExist = Chart.getChart(this.chartId);
    if (chartExist != undefined) chartExist.destroy();

    return new Chart(this.chartId, {
      type: 'line',
      data: this.lineChartdata,
      options: {
        scales: {
          x: {
            ticks: {
              color: this.dashboardService.lightColorHexCode
            }
          },
          y: { 
            ticks: {
              color: this.dashboardService.lightColorHexCode
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels : {
              color : this.dashboardService.lightColorHexCode
            },
          },
          title: {
            position: 'top',
            display: true,
            text: 'Top 5 Spending By Category in Past 6 Month',
            color : this.dashboardService.lightColorHexCode
          },
          tooltip: {
            enabled: true,
          },
        },
        borderColor: this.dashboardService.lightColorHexCode,
        aspectRatio: 1.5,
      },
    });
  }
}
