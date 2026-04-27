/**
 * Builds an RTK Query tag array containing a LIST sentinel tag plus
 * one tag per item in `result`.
 *
 * Typical use in `providesTags` / `invalidatesTags`:
 *
 * ```ts
 * providesTags: (result) =>
 *   buildListAndItemTags("Staff", result, (s) => s.id ?? "unknown")
 * ```
 *
 * When `result` is `null` / `undefined`, only the LIST tag is returned.
 */
export function buildListAndItemTags<T, TagType extends string>(
  tagType: TagType,
  result: T[] | null | undefined,
  idExtractor: (item: T) => string,
): Array<{ type: TagType; id: string }> {
  const listTag = { type: tagType, id: "LIST" };
  if (!result) {
    return [listTag];
  }
  return [listTag, ...result.map((item) => ({ type: tagType, id: idExtractor(item) }))];
}
