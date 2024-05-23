
import { newDate } from "@roit/roit-date";
import { addDays, addHours, addMinutes, addMonths, addSeconds, addWeeks, addYears, parseISO } from "date-fns";
import Firestore from "@google-cloud/firestore";

export class TtlBuilderUtil {

    static getTtlTimestamp(expirationIn: number, unit: string): Firestore.Timestamp {

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

        const futureDate = functionMap[unit](now, expirationIn)
     
        return Firestore.Timestamp.fromDate(futureDate)
        
    }
}