import SharedReturnDirectlyFlagInput from "../ReturnDirectlyFlagInput";

export function ReturnDirectlyFlagInput() {
  return (
    <SharedReturnDirectlyFlagInput
      label="直帰ですか？"
      inputVariant="checkbox"
      layout="inline"
      successMessage="勤務終了時間が自動設定されました"
    />
  );
}
