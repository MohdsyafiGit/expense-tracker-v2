import { Injectable } from "@angular/core";
import { Expense } from "../models/expense.model";
import { FirebasePathBuilderService } from "./firebase-path-builder.service";
import { FirebaseFirestore, QueryFilterConstraint } from "@capacitor-firebase/firestore";
import { BehaviorSubject } from "rxjs";
import { GroupCategoryExpense } from "../models/group-category-expense.model";
import { GroupMonthExpense } from "../models/group-month-expense.model";
import dayjs from "dayjs";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn : "root"
})
export class DashboardService {

  private expenses : Expense[] = []
  private expenses$  = new BehaviorSubject<Expense[]>([]);
  groupByCatExpenses$ = new BehaviorSubject<GroupCategoryExpense[]>([]);
  groupByMonthTotalExpenses$ = new BehaviorSubject<GroupMonthExpense[]>([]);
  chartColors = ['#274690', '#8686AC', '#C0C0C0', '#94B0DA', '#36827F'];
  lightColorHexCode = "#f6f8fc";
  constructor(
    private path : FirebasePathBuilderService,
    private authService : AuthService
  ){

    this.authService.user$.subscribe((user)=>{
      if(user){
        this.getExpenses();
      }else{
        this.expenses = [];
        this.expenses$.next(this.expenses);
      }
    })

    this.expenses$
    .subscribe((expenses)=>{
      if(expenses.length > 0){
        const groupByCatExpense = this.getExpensesGroupByCategories(expenses);
        if(groupByCatExpense){
          groupByCatExpense.forEach((groupExpense)=>{
            const groupByMonth = this.groupAndGetTotalByMonth(groupExpense.expenses)
            groupExpense.totalExpenseByMonthList = groupByMonth;
          })
        }
        this.groupByCatExpenses$.next(groupByCatExpense);

        const groupByMonthlyTotalExpense  = this.groupAndGetTotalByMonth(expenses);
        this.groupByMonthTotalExpenses$.next(groupByMonthlyTotalExpense);
      }else{
        this.groupByCatExpenses$.next([]);
        this.groupByMonthTotalExpenses$.next([]);
      }

    })

  }

  private getExpenses(){
    const now = new Date();
    const currentMonth = now.getMonth();

    const startDate = new Date(now.getFullYear(), currentMonth - 6, 1);
    const startOfDaylocalISODate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const endDate = new Date(now.getFullYear(), currentMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    const endOfDaylocalISODate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();

    const constraintsList : QueryFilterConstraint[] = [];
    
    constraintsList.push({
      type: 'where',
      fieldPath: 'dateTime',
      opStr: '>=',
      value: startOfDaylocalISODate,
    })

    constraintsList.push({
      type: 'where',
      fieldPath: 'dateTime',
      opStr: '<=',
      value: endOfDaylocalISODate,
    })

    FirebaseFirestore.addCollectionSnapshotListener(
    {
      reference: this.path.userExpensesCollectionPath(),
      compositeFilter: { type: "and", queryConstraints: constraintsList }
    },
    (event, error) => {
      if (error) {
        console.error(error);
        this.expenses = [];
        this.expenses$.next(this.expenses);
      } else if(event){
          const list: Expense[] = event.snapshots.map(
            (item) => ({ ...item.data, id: item.id }) as Expense
          );
          this.expenses = list;
          this.expenses$.next(this.expenses);
      }
    });
  }

  private getExpensesGroupByCategories(expenses: Expense[]): GroupCategoryExpense[]{
    if(expenses.length <= 0)
      return [];

    const expensesGrouped = expenses.reduce((groups, expense) => {

      if(!expense ||  !expense.catId){
        console.error("getExpensesGroupByCategories error : cat id is null " + " expense id : " + expense?.id);
        return groups
      }

      const catId = expense.catId;
  
      let group = groups.find((g) => g.catId === catId);
  
      if (!group) {
        group = new GroupCategoryExpense(catId, 0, []);
        groups.push(group);
      }
  
      group.expenses.push(expense);
      group.total += expense.price;
      group.averageTotalOver6Month = group.total/6;

      return groups;
    }, [] as GroupCategoryExpense[]);
  
    expensesGrouped.forEach((group) => {
      group.expenses.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    });
  
    expensesGrouped.sort((a, b) => b.averageTotalOver6Month - a.averageTotalOver6Month);
    
    return expensesGrouped;
  }

  private groupAndGetTotalByMonth(expenses: Expense[]): GroupMonthExpense[] {
    // Create groups for the past 6 months
    const groups: GroupMonthExpense[] = [];
    const currentDate = dayjs();
    
    // Generate groups for past 6 months (including current month)
    for (let i = 5; i >= 0; i--) {
      const monthDate = currentDate.subtract(i, 'month');
      const month = monthDate.get('month');
      groups.push(new GroupMonthExpense(0, month));
    }

    // If no expenses, return the empty groups
    if (expenses.length <= 0) {
      return groups;
    }

    // Add expenses to the appropriate groups
    expenses.forEach(expense => {
      const dateTime = expense.dateTime.split('T')[0];
      const day = dayjs(dateTime, "YYYY-MM-DD");
      const month = day.get("month");

      const group = groups.find(g => g.month === month);
      if (group) {
        group.total += expense.price;
      }
    });

    return groups;
  }

  public getMonthName(number: number) : string{
      switch(number){
        case 0:
          return "Jan";
        case 1:
          return "Feb";
        case 2:
          return "Mar";
        case 3:
          return "Apr";
        case 4:
          return "May";
        case 5:
          return "Jun";
        case 6:
          return "Jul";
        case 7:
          return "Aug";
        case 8:
          return "Sep";
        case 9:
          return "Oct";
        case 10:
          return "Nov";
        case 11:
          return "Dec";
        default:
          return ""
      }
  }
}