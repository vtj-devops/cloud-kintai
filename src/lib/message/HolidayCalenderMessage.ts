import { Message } from "./Message";

export class HolidayCalenderMessage extends Message {
  private categoryName: string = "休日カレンダー";

  constructor() {
    super();
  }

  getCategoryName(): string {
    return this.categoryName;
  }
}
