export class MessageGenerator {
  familyName?: string;
  givenName?: string;

  constructor() {}

  setStaffName(familyName: string, givenName: string) {
    this.familyName = familyName;
    this.givenName = givenName;
  }

  private getStaffName() {
    if (!this.familyName && !this.givenName) return "こんにちは。";

    return this.familyName && this.givenName
      ? `こんにちは、${this.familyName} ${this.givenName} さん`
      : `こんにちは、${this.familyName || this.givenName} さん`;
  }

  generate() {
    return "";
  }
}
