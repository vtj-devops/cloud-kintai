import ReturnDirectlyFlagInputBase from "../ReturnDirectlyFlagInput";

interface ReturnDirectlyFlagInputProps {
  onHighlightEndTime?: (highlight: boolean) => void;
}

export default function ReturnDirectlyFlagInput({
  onHighlightEndTime,
}: ReturnDirectlyFlagInputProps) {
  return (
    <ReturnDirectlyFlagInputBase onHighlightEndTime={onHighlightEndTime} />
  );
}
