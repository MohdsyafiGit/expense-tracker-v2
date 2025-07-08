import { Injectable } from "@angular/core";
import { Filter } from "../models/filter.model";
import { BehaviorSubject, combineLatest, map, Observable } from "rxjs";
import { GroupExpense } from "../models/group-expense.model";
import { Expense } from "../models/expense.model";
import { SelectState } from "../models/select-state.enum";
import { FirebaseFirestore, QueryFilterConstraint } from "@capacitor-firebase/firestore";
import { Bank } from "../models/bank.model";
import { BankService } from "./bank.service";
import { AccountNormalized } from "../models/account-normalized.model";
import { Category } from "../models/category.model";
import { CategoryService } from "./category.service";
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import { AccountWithTotal } from "../models/account-with-total.model";
import { CategoryWithTotal } from "../models/category-with-total.model";
import { FirebasePathBuilderService } from "./firebase-path-builder.service";
import { Receipt } from "../models/receipt.model";
import { FirebaseStorage, UploadFileOptions } from "@capacitor-firebase/storage";

@Injectable({
    providedIn : "root"
})
export class ExpenseService{
  private banks: Bank[] = [];
  private categories: Category[] = [];
  currentMonth : string = new Date().toISOString();

  constructor(
    private bankService : BankService,
    private categoryService : CategoryService,
    private path:FirebasePathBuilderService,
  ){
    this.bankService.banks$
    .subscribe((banks)=>{
      this.banks = banks;
    })

    this.categoryService.categories$
    .subscribe((categories)=>{
      this.categories = categories;
    })
  }

  getQueryAccountConstraints(list: { bankId: string; accId: string; state: SelectState }[]): QueryFilterConstraint | undefined {
    if (!list || list.length === 0) return undefined;
  
    // Extract the exclude and include lists
    const excludeList = list.filter(item => item.state === SelectState.exclude);
    const includeList = list.filter(item => item.state === SelectState.include);
  
    let finalList: { bankId: string; accId: string; state: SelectState }[];
  
    // If there are only exclusions and banks are available, normalize and filter the list
    if (excludeList.length > 0 && includeList.length === 0 && this.banks.length > 0) {
      const normalizedList = this.banks?.flatMap(bank =>
        bank.accounts.map(acc => new AccountNormalized(bank.id, acc.id, bank.picName, bank.bankName, acc.name, SelectState.include))
      );
  
      finalList = normalizedList.filter(normalizedItem =>
        !excludeList.some(excludeItem => excludeItem.accId === normalizedItem.accId)
      );
    } else {
      finalList = includeList;
    }
  
    // Return the query constraint if the final list is not empty
    return finalList.length > 0 ? {
      type: "where",
      fieldPath: 'accId',
      opStr: "in",
      value: finalList.map(item => item.accId),
    } : undefined;
  }

  getQueryCategoryConstraints(list: {catId:string,state:SelectState}[]): QueryFilterConstraint | undefined {

    if(!list || list.length === 0) return undefined;

    const excludeList = list.filter((item)=>item.state === SelectState.exclude);
    const includeList = list.filter((item)=> item.state === SelectState.include);

    let finalList : {catId:string,state:SelectState}[] = []; 
    if(includeList.length === 0 && excludeList.length > 0 && this.categories.length > 0){
      finalList = this.categories.filter((item)=> !excludeList.some((x)=> x.catId === item.id)).map((cat)=>{return {catId: cat.id,state:SelectState.include}})
    }else
      finalList = includeList;

    const queryConstraint : QueryFilterConstraint = {
      type: "where",
      fieldPath: 'catId',
      opStr: "in",
      value: finalList.map((item)=>item.catId),
    }
      
    return queryConstraint;
  }

  getQueryDateConstraints(filter:Filter): QueryFilterConstraint[]{
    if(!filter){
      filter = new Filter("custom","","","today",0,0,false,"","",);
    }

    const constraintsList : QueryFilterConstraint[] = [];
    const now = new Date();
    let startOfDaylocalISODate = "";
    let endOfDaylocalISODate = "";
    let startDay = 0;
    let endDay = 0;
    let startMonth = new Date(this.currentMonth).getMonth();
    let endMonth = new Date(this.currentMonth).getMonth();
    
    switch(filter.dateMode){
      case "today":
        startDay = now.getDate();
        endDay = now.getDate();
        break;

      case "yesterday":
        startDay = now.getDate() - 1;
        endDay = now.getDate() - 1;
        break;

      case "currentMonth":
        startDay = 1;
        endDay = 0;
        endMonth = new Date(this.currentMonth).getMonth() + 1;
        break;

      case "customMonthRange":
        {
          startDay = filter.customMonthStart;
          endDay = filter.customMonthEnd;

          if(filter.customMonthStartModifier === "lastMonth")
            startMonth -= 1;
      
          if(filter.customMonthEndModifier === "lastMonth")
            endMonth -= 1;

            
          if(filter.customMonthStartModifier === "nextMonth")
            startMonth += 1;
      
          if(filter.customMonthEndModifier === "nextMonth")
            endMonth += 1;

          const year = dayjs().year();
          const lastDayNumber = dayjs().year(year).month(endMonth).endOf('month').date();

          if(endDay > lastDayNumber){
            endDay = lastDayNumber;
          }
        }
        break;

      case "currentWeek":{ 
        dayjs.extend(weekday);

        const currentDate = dayjs();
        const monday = currentDate.clone().weekday(1);
        const sunday = currentDate.clone().weekday(7);

        startDay = monday.date();
        endDay = sunday.date();

        startMonth = monday.month();
        endMonth = sunday.month();
        break; }
      case "customDateRange":{ 
        const customStartDate = new Date(filter.startDate.split('T')[0]);
        const customEndDate = new Date(filter.endDate.split('T')[0]);

        startDay = customStartDate.getDate();
        endDay = customEndDate.getDate();

        startMonth = customStartDate.getMonth();
        endMonth = customEndDate.getMonth();
        break; }
    }

    const startDate = new Date(now.getFullYear(), startMonth, startDay);
    startOfDaylocalISODate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const endDate = new Date(now.getFullYear(), endMonth, endDay);
    endDate.setHours(23, 59, 59, 999);
    endOfDaylocalISODate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();

    if(filter){

      if(filter.dateMode !== "all"){
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
      }
    }

    return constraintsList;
  }
  private getFilteredList<T>(
    filter: Filter,
    processListFn: (list: Expense[]) => T
  ): Observable<T> {
  
    const dateConstraints = this.getQueryDateConstraints(filter);
    const categoryConstraints = this.getQueryCategoryConstraints(filter.selectedCategoryIds);
    const accountConstraints = this.getQueryAccountConstraints(filter.selectedBankAccIds);
  
    const baseFilters = dateConstraints || [];
  
    // Create separate filters for category and account
    const catFilters = categoryConstraints ? [...baseFilters, categoryConstraints] : [...baseFilters];
    const accFilters = accountConstraints ? [...baseFilters, accountConstraints] : [...baseFilters];
  
    // Create subjects to track the results
    const accountSub = new BehaviorSubject<Expense[]>([]);
    const categorySub = new BehaviorSubject<Expense[]>([]);
  
    // Function to handle Firebase listener setup
    const setupListener = (
      filters: QueryFilterConstraint[],
      subject: BehaviorSubject<Expense[]>
    ) => {
      FirebaseFirestore.addCollectionSnapshotListener(
        {
          reference: this.path.userExpensesCollectionPath(),
          compositeFilter: { type: "and", queryConstraints: filters }
        },
        (event, error) => {
          if (error) {
            console.error(error);
          } else if(event){
              const list: Expense[] = event.snapshots.map(
                (item) => ({ ...item.data, id: item.id }) as Expense
              );
              subject.next(list);
          }
        }
      );
    };
  
    // Setup listeners for account and category filters
    setupListener(accFilters, accountSub);
    setupListener(catFilters, categorySub);
  
    // Combine account and category results and find their intersection
    return combineLatest([accountSub, categorySub]).pipe(
      map(([accList, catList]) => {
        if (!accList.length || !catList.length) {
          return processListFn([]);
        }
  
        const catIds = new Set(catList.map(item => item.id));
        const intersection = accList.filter(item => catIds.has(item.id));
  
        return processListFn(intersection);
      })
    );
  }
  
  groupByDateTime(expenses: Expense[]): GroupExpense[] {
    const expensesGrouped = expenses.reduce((groups, expense) => {
      const dateTime = expense.dateTime.split('T')[0]; // Get only the date part (yyyy-mm-dd)
  
      // Check if the dateTime already exists in the groups
      let group = groups.find((g) => g.dateTime === dateTime);
  
      if (!group) {
        // Create a new group if it doesn't exist
        group = new GroupExpense(dateTime, 0, []);
        groups.push(group);
      }
  
      // Add the expense to the existing group
      group.expenses.push(expense);
      group.total += expense.price;
  
      return groups;
    }, [] as GroupExpense[]);
  
    // Sort the expenses within each group by dateTime in descending order
    expensesGrouped.forEach((group) => {
      group.expenses.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    });
  
    // Sort the groups by dateTime in descending order
    expensesGrouped.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  
    return expensesGrouped;
  }

  getTotalPerAccountList(expenses: Expense[]): AccountWithTotal[]{
    const res = expenses.reduce((prev,curr)=>{
      const accId = curr.accId;

      const result = prev.find((item)=>{
        return item.accId === accId;
      });

      if(result)
        result.total += +curr.price
      else
      {
        const newItem = new AccountWithTotal(curr.accId,curr.bankId,+curr.price);
        prev.push(newItem)
      }

      return prev;
    },[] as AccountWithTotal[])

    res.sort((a,b)=> b.total - a.total);
    const monthTotal = expenses.reduce((prev,curr)=> prev += curr.price,0);
    res.forEach((item)=>{
      item.percentage = (+item.total/+monthTotal) * 100;
    })

    return res;
  }

  getTotalPerCategoryList(expenses: Expense[]): CategoryWithTotal[]{

    const res = expenses.reduce((prev,curr)=>{
      const catId = curr.catId;

      const result = prev.find((item)=>{
        return item.catId === catId;
      });

      if(result)
        result.total += +curr.price
      else
      {
        const newItem = new CategoryWithTotal(curr.catId,+curr.price,);
        prev.push(newItem)
      }

      return prev;
    },[] as CategoryWithTotal[])

    res.sort((a,b)=> b.total - a.total);
    const monthTotal = expenses.reduce((prev,curr)=> prev += curr.price,0);
    res.forEach((item)=>{
      item.percentage = (+item.total/+monthTotal) * 100;
    })

    return res;
  }

  getFilteredExpensesObservable(filter: Filter): Observable<GroupExpense[]> {
    return this.getFilteredList(filter, this.groupByDateTime);
  }

  getTotalPerAccountListObservable(filter: Filter): Observable<AccountWithTotal[]> {
    return this.getFilteredList(filter, this.getTotalPerAccountList);
  }

  getTotalPerCategoryListObservable(filter: Filter): Observable<CategoryWithTotal[]> {
    return this.getFilteredList(filter, this.getTotalPerCategoryList);
  }
  
  async getExpenseDetail(expenseDocId:string){
    const docRef = this.path.userExpensesDocPath(expenseDocId);
    const { snapshot } = await FirebaseFirestore.getDocument<Expense>({reference: docRef,});
    return ({...snapshot.data,id:snapshot.id} as Expense);
  }

  async getReceipts(receipts:Receipt[]) :Promise<Receipt[]>{

    const result : Receipt[] = []
    receipts.forEach(async (receipt)=>{
      const { downloadUrl } = await FirebaseStorage.getDownloadUrl({ path: this.path.userReceiptPath(receipt.fileName),});

      if(receipt.isPdf){
        const response = await fetch(downloadUrl);
        const blob = await  response.blob();
        receipt.fileBlob = blob;

      }else{
        receipt.firebaseUrl = downloadUrl;
      }

      result.push(receipt);
    })

    return result;
  }

  async updateExpense(expense: Expense,receipts:Receipt[]) {
    const docRef = this.path.userExpensesDocPath(expense.id);

    const oldReceipts = (await this.getExpenseDetail(expense.id)).receipts;
    
    if(oldReceipts && oldReceipts.length > 0){

      oldReceipts.forEach(async (x)=>{
        const res = receipts.find((y)=>y.fileName === x.fileName)
  
        if(!res){
          await FirebaseStorage.deleteFile({
            path: this.path.userReceiptPath(x.fileName),
          });
        }
      })
    }


    await FirebaseFirestore.updateDocument({
      reference: docRef,
      data: <Expense>{ 
        id: expense.id,
        title: expense.title,
        price: +expense.price,
        catId: expense.catId,
        accId: expense.accId,
        dateTime: expense.dateTime,
        bankId: expense.bankId,
        receipts: receipts.map(receipt => ({
          fileName: receipt.fileName,
          isPdf : receipt.isPdf,
        }))
      },
    });

    const { items } = await FirebaseStorage.listFiles({
      path: this.path.userReceiptFolderPath(),
    });

    const receiptLists = items.map((x)=>{
      return x.name;
    })

    receipts.forEach(async (x)=>{
      if(!receiptLists.find((y=>y === x.fileName))){
        await this.uploadReceipt(x);
      }
    })
  }

  async addExpense(expense: Expense,receipts:Receipt[]) {
    await FirebaseFirestore.addDocument({
      reference: this.path.userExpensesCollectionPath(),
      data: <Expense>{ 
        id: "",
        title: expense.title,
        price: +expense.price,
        catId: expense.catId,
        accId: expense.accId,
        dateTime: expense.dateTime,
        bankId: expense.bankId,
        receipts: receipts.map(receipt => ({
          fileName: receipt.fileName,
          isPdf : receipt.isPdf,
        }))
      },
    });

    receipts.forEach((receipt)=>{
      this.uploadReceipt(receipt);
    })
  }

  async uploadReceipt(file: Receipt): Promise<string> {
    const fileOption: UploadFileOptions = {
        path: this.path.userReceiptPath(file.fileName),
        uri: file.androidUri,
      };
  
    if (!fileOption) return "";
  
    return new Promise<string>((resolve, reject) => {
      FirebaseStorage.uploadFile(
        fileOption,
        async (event, error) => {
          if (error) {
            console.log(error);
            reject(error);
          } else if (event?.completed) {
            resolve("");
          }
        }
      );
    });
  }
}