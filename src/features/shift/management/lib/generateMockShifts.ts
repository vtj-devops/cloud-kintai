import type { ShiftState } from "@entities/shift/lib/statusMapping";
import dayjs from "dayjs";

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export type { ShiftState };

const getOffState = (seed: number): ShiftState =>
  seed % 2 === 0 ? "fixedOff" : "requestedOff";

/**
 * シミュレーション向けのモックシフトデータを生成する
 * scenarios:
 * - patterned: 平日出勤・土日休みを基本に一部 auto を混ぜる
 * - balanced: 日ごとにおおよそ 60% のスタッフが出勤するようローテーションで割当
 * - sparse: 出勤が少ないパターン
 * - random: ランダムだが staff.id によって決定的に生成される
 */
export default function generateMockShifts(
  shiftStaffs: { id: string }[],
  days: dayjs.Dayjs[],
  scenario: string = "patterned"
): Map<string, Record<string, ShiftState>> {
  const map = new Map<string, Record<string, ShiftState>>();
  const total = shiftStaffs.length;

  shiftStaffs.forEach((s, idx) => {
    const per: Record<string, ShiftState> = {};
    const h = hashString(s.id || String(idx));
    days.forEach((d, di) => {
      const key = d.format("YYYY-MM-DD");
      const wd = d.day();

      if (scenario === "patterned") {
        // 平日出勤、土日休み。まれに auto を入れる
        if (wd >= 1 && wd <= 5) {
          per[key] = "work";
        } else {
          per[key] = getOffState(h + di + wd);
        }
        if ((h + di) % 11 === 0) per[key] = "auto";
      } else if (scenario === "balanced") {
        // 日ごとに必要人数を満たすためにローテーションで work を割り当てる
        const need = Math.max(1, Math.floor(total * 0.6));
        // 順序をずらして毎日異なるスタッフが選ばれるようにする
        const chosen = (di + idx) % total < need;
        per[key] = chosen ? "work" : getOffState(h + di);
        if (!chosen && (h + di) % 7 === 0) per[key] = "auto";
      } else if (scenario === "sparse") {
        // 出勤が少ない
        const r = (h + di * 37) % 100;
        if (r < 20) per[key] = "work";
        else if (r < 30) per[key] = "auto";
        else per[key] = getOffState(r + di);
      } else {
        // random（決定的）
        const r = (h + di * 97) % 100;
        if (r < 60) per[key] = "work";
        else if (r < 75) per[key] = "auto";
        else per[key] = getOffState(r + di * 2);
      }
    });
    map.set(s.id, per);
  });

  return map;
}
