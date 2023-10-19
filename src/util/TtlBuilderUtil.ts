import { newDate } from "@roit/roit-date";
import { addDays, addHours, addMinutes, addMonths, addSeconds, addWeeks, addYears, parseISO } from "date-fns";

export class TtlBuilderUtil {

    static getTtlTimestamp(expirationIn: number, unit: string): number {

        const functionMap: { [key: string]: (date: Date | number, amount: number) => Date } = {
            "second": addSeconds,
            "minute": addMinutes,
            "hour": addHours,
            "days": addDays,
            "week": addWeeks,
            "month": addMonths,
            "year": addYears
        }

        const now = parseISO(newDate())

        return functionMap[unit](now, expirationIn).getTime()
    }
}