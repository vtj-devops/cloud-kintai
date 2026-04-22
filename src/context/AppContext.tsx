/**
 * @deprecated このファイルは後方互換のための re-export バレルです。
 * 新規コードでは `@entities/calendar/model/CalendarContext` を直接インポートしてください。
 * AppContext は CalendarContext にリネームされました。
 */
export type { CalendarContextProps as AppContextProps } from "@entities/calendar/model/CalendarContext";
export {
  AppContext,
  CalendarContext,
} from "@entities/calendar/model/CalendarContext";
