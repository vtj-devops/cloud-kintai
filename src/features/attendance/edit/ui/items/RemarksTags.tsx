type RemarksTagsProps = {
  tags: string[];
};

export function RemarksTags({ tags }: RemarksTagsProps) {
  return (
    <>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center rounded-[10px] border border-emerald-500/45 px-[10px] py-0.5 text-xs font-semibold leading-snug text-emerald-800">
          {tag}
        </span>
      ))}
    </>
  );
}
