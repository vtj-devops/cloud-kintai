import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { sendMail } from "@shared/api/graphql/documents/queries";

type SendMailParams = {
  to: string[];
  subject: string;
  body: string;
};

export const sendMailNotification = async ({
  to,
  subject,
  body,
}: SendMailParams): Promise<void> => {
  await graphqlClient.graphql({
    query: sendMail,
    variables: {
      data: { to, subject, body },
    },
  });
};
