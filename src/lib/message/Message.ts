export enum MessageStatus {
  ERROR = "E",
  SUCCESS = "S",
}

export enum MessageCategory {
  HolidayCalender = "8",
}

export enum OperationCode {
  Get = "1",
  Create = "2",
  Update = "3",
  Delete = "4",
}

export class Message {
  private messageCode: string = MessageCategory.HolidayCalender;

  getCategoryName(): string {
    throw new Error("Method not implemented.");
  }

  get(status: MessageStatus) {
    return this.getMessage(
      status,
      OperationCode.Create,
      this.getCategoryName()
    );
  }

  create(status: MessageStatus) {
    return this.getMessage(
      status,
      OperationCode.Create,
      this.getCategoryName()
    );
  }

  update(status: MessageStatus) {
    return this.getMessage(
      status,
      OperationCode.Update,
      this.getCategoryName()
    );
  }

  delete(status: MessageStatus) {
    return this.getMessage(
      status,
      OperationCode.Delete,
      this.getCategoryName()
    );
  }

  private getMessage(
    status: MessageStatus,
    operation: OperationCode,
    categoryName: string
  ) {
    switch (status) {
      case MessageStatus.ERROR:
        return this.getErrorMessage(operation, status, categoryName);
      case MessageStatus.SUCCESS:
        return this.getSuccessMessage(operation, categoryName);
    }
  }

  private getSuccessMessage(operation: OperationCode, categoryName: string) {
    return `${categoryName}を${this.getOperationName(operation)}しました`;
  }

  private getErrorMessage(
    operation: OperationCode,
    status: MessageStatus,
    categoryName: string
  ) {
    return `${categoryName}の${this.getOperationName(
      operation
    )}に失敗しました(${this.getMessageCode(status, OperationCode.Create)})`;
  }

  private getOperationName(operation: OperationCode) {
    switch (operation) {
      case OperationCode.Get:
        return "取得";
      case OperationCode.Create:
        return "作成";
      case OperationCode.Update:
        return "更新";
      case OperationCode.Delete:
        return "削除";
      default:
        throw new Error("Invalid operation code");
    }
  }

  private getMessageCode(status: MessageStatus, operation: OperationCode) {
    const messageCode = [
      status,
      this.messageCode.padStart(2, "0"),
      operation.padStart(3, "0"),
    ].join("");
    return messageCode;
  }
}
