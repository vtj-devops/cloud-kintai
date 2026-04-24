/**
 * Generic payload type for RTK Query update mutations.
 *
 * @template TInput - The update input type (e.g. UpdateStaffInput)
 * @template TCondition - The condition input type (e.g. ModelStaffConditionInput). Defaults to `never` (no condition).
 */
export type UpdatePayload<TInput, TCondition = never> = {
  input: TInput;
  condition?: TCondition | null;
};
