import { SelectState } from "./select-state.enum";

export class Filter{
  public id = "";
  public selectedCategoryIds : {catId:string,state:SelectState}[] = []
  public selectedBankAccIds : {bankId:string,accId:string,state:SelectState}[] = []
  constructor(
    public title = "",
    public startDate  = "",
    public endDate  = "",
    public dateMode = "",
    public customMonthStart  = 0,
    public customMonthEnd  = 0,
    public isDefaultFilter  = false,
    public customMonthStartModifier  = "",
    public customMonthEndModifier  = "",
  ){}
}




