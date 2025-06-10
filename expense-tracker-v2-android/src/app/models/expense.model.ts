import { Receipt } from "./receipt.model";

export class Expense {
  public id = "";
  constructor(
    public title: string,
    public price: number,
    public catId: string,
    public bankId : string,
    public accId: string,
    public dateTime: string,
    public receipts: Receipt[] = [],
  ) {}
  
}