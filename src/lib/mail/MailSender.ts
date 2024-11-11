import { API } from "aws-amplify";

import * as MESSAGE_CODE from "@/errors";
import { sendMail } from "@/graphql/queries";

export abstract class MailSender {
  protected send(to: string[], subject: string, body: string) {
    const params = {
      query: sendMail,
      variables: {
        data: {
          to,
          subject,
          body,
        },
      },
    };

    try {
      void API.graphql(params);
    } catch {
      throw new Error(MESSAGE_CODE.E00001);
    }
  }

  protected abstract getWorkDate(): string;
  protected abstract getStaffName(): string;
}
