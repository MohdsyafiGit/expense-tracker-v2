import { SelectAccountId } from "./select-account-id.model";
import { SelectCategoryId } from "./select-category-id.model";

export class Filter{
  public id = "";
  public selectedCategoryIds : SelectCategoryId[] = []
  public selectedBankAccIds : SelectAccountId[] = []
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




