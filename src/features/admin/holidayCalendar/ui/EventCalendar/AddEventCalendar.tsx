import { AddCalendarItem } from "@features/admin/holidayCalendar/ui/components/AddCalendarItem";
import { TextField } from "@mui/material";
import { CreateEventCalendarInput, EventCalendar } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";

type CreateEventCalendarHandler = (input: CreateEventCalendarInput) => Promise<void | EventCalendar>;
type BulkCreateEventCalendarHandler = (inputs: CreateEventCalendarInput[]) => Promise<void | EventCalendar[]>;

export function AddEventCalendar({
  createEventCalendar,
  bulkCreateEventCalendar,
}: {
  createEventCalendar: CreateEventCalendarHandler;
  bulkCreateEventCalendar: BulkCreateEventCalendarHandler;
}) {
  return (
    <AddCalendarItem<CreateEventCalendarInput>
      addButtonLabel="イベントを追加"
      addButtonProps={{ variant: "outline" }}
      dialogTitle="イベントを追加"
      dialogDescription="イベント日と名前、詳細（任意）を入力してください。"
      nameLabel="イベント名"
      messageFactory={EventCalendarMessage()}
      buildSingleInput={(eventDate, name, description) => ({
        eventDate,
        name,
        description: description || undefined,
      })}
      buildBulkInputs={(range, name, description) =>
        range.map((eventDate) => ({
          eventDate,
          name,
          description: description || undefined,
        }))
      }
      createItem={createEventCalendar}
      bulkCreateItems={bulkCreateEventCalendar}
      renderExtraFields={(register) => (
        <TextField label="詳細 (任意)" multiline rows={3} {...register("description")} />
      )}
    />
  );
}

