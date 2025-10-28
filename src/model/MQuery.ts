import { OrderByDirection } from "@google-cloud/firestore";
import { Paging } from "./Paging";

export class MQuery {

    field: string

    operator: FirebaseFirestore.WhereFilterOp = '=='

    value: any
}

export class MQueryOr {
    or: Array<MQuery | MQuerySimple>
}

export class MQuerySimple {
    [key: string]: string | number;
}

export class Config {

    orderBy?: OrderBy

    query?: Array<MQuery | MQuerySimple | MQueryOr>

    select?: Array<string> = []

    paging?: Paging
}

export class OrderBy {

    field: string

    direction: OrderByDirection = 'asc'
}

export class Options {
    showCount: boolean
}