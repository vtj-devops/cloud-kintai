export type DocumentInputs = {
  title: string | null | undefined;
  content: string | null | undefined;
  targetRole: string[];
};

export const defaultValues: DocumentInputs = {
  title: undefined,
  content: undefined,
  targetRole: [],
};
