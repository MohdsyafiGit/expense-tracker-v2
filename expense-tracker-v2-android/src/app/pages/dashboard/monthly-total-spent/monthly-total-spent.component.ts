import { DashboardService } from './../../../services/dashboard.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { ChartData } from '../../../models/line-chart-data.model';
import { Subject, takeUntil } from 'rxjs';
import { ChartDataset } from '../../../models/chart-data.model';

@Component({
  selector: 'app-monthly-total-spent',
  imports: [CommonModule],
  templateUrl: './monthly-total-spent.component.html',
  styleUrl: './monthly-total-spent.component.scss',
})
export class MonthlyTotalSpentComponent implements OnDestroy , OnInit {
  monthlyTotalSpentChart : Chart<"bar"> | null = null;
  chartId = "monthly-spent-trend";
  barChartData = new ChartData();
  destroy$ = new Subject<void>();
  constructor(
    private dashboardService : DashboardService,
  ){
    this.dashboardService.groupByMonthTotalExpenses$
    .pipe(takeUntil(this.destroy$))
    .subscribe((expenses)=>{

      this.barChartData = new ChartData();
      if(expenses.length > 0){
        this.barChartData.datasets = [];
        this.barChartData.labels = [];
        this.barChartData.labels = expenses.map((item)=> this.dashboardService.getMonthName(item.month));
        this.barChartData.datasets.push(
          new ChartDataset(
            "Total Spent",
            expenses.map(item => {return item.total}),
            this.dashboardService.chartColors[0],
            this.dashboardService.chartColors[0]));
        this.updateChart();
      }else{
        this.barChartData = new ChartData();
        this.monthlyTotalSpentChart?.reset();
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

    this.monthlyTotalSpentChart =  new Chart(this.chartId, {
      type: 'bar',
      data: this.barChartData,
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
            display: false,
          },
          title: {
            display: true,
            text: 'Monthly Total Spent In Last 6 Month',
            color : this.dashboardService.lightColorHexCode,
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
    if(chartExist && this.monthlyTotalSpentChart){
      this.monthlyTotalSpentChart.data = this.barChartData;
      this.monthlyTotalSpentChart.update();
    }else{
      this.createChart();
    }
  }

  removeChartIfExist(){
    const chartExist = Chart.getChart(this.chartId);
    if (chartExist != undefined) chartExist.destroy();
  }
}
