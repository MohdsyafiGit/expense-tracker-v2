import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class CategoryTrendComponent implements OnDestroy, OnInit{

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

      this.lineChartdata = new ChartData();
      if(expenses.length > 0){
        this.lineChartdata.datasets = [];
        this.lineChartdata.labels = [];
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
        this.lineChartdata.labels = expenses[0].totalExpenseByMonthList.map((item)=> {return this.dashboardService.getMonthName(item.month)});
        this.updateChart();

      }else{
        this.lineChartdata = new ChartData();
        this.categoryChart?.reset();
        this.updateChart();
      }
    })
  }

  ngOnInit(): void {
    this.createChart();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createChart(
  ) {
    this.removeChartIfExist();

    this.categoryChart = new Chart(this.chartId, {
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

  updateChart(){
    const chartExist = Chart.getChart(this.chartId);
    if(chartExist && this.categoryChart){
      this.categoryChart.reset();
      this.categoryChart.data = this.lineChartdata;
      this.categoryChart.update();
    }else{
      this.createChart();
    }
  }

  removeChartIfExist(){
    const chartExist = Chart.getChart(this.chartId);
    if (chartExist != undefined) chartExist.destroy();
  }
}
