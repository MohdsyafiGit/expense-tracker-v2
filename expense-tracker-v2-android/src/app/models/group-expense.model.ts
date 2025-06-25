import { Expense } from "./expense.model";

export class GroupExpense{

  constructor(
    public dateTime: string,
    public total:number,
    public expenses: Expense[],
  ){}
}