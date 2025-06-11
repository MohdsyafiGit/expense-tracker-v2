import { Account } from "./account.model";

export class Bank {
    public id = "";
    public picUrl = "";
  constructor(
    public bankName: string,
    public picName: string,
    public accounts: Account[]
  ) {}
}