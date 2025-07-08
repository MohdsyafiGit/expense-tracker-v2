import { Expense } from "./expense.model";
import { GroupMonthExpense } from "./group-month-expense.model";

export class GroupCategoryExpense{

  public averageTotalOver6Month = 0;
  constructor(
    public catId: string,
    public total:number,
    public expenses: Expense[],
    public totalExpenseByMonthList : GroupMonthExpense[] = [],
  ){}
}