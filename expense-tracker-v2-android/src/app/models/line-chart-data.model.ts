import { ChartDataset } from "./chart-data.model";

export class ChartData{

    constructor(
      public labels: string[] = [],
      public datasets : ChartDataset[] = []
    ){}
}