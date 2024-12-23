import { Message } from "./Message";

export class CompanyHolidayCalenderMessage extends Message {
  private categoryName: string = "会社休日カレンダー";

  constructor() {
    super();
  }

  getCategoryName(): string {
    return this.categoryName;
  }
}
