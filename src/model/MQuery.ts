import { OrderByDirection } from "@google-cloud/firestore";

export class MQuery {

    field: string

    operator: FirebaseFirestore.WhereFilterOp = '=='

    value: any
}

export class MQuerySimple {
    [key: string]: string | number;
}

export class Config {

    orderBy?: OrderBy

    query?: Array<MQuery | MQuerySimple>
}

export class OrderBy {

    field: string

    direction: OrderByDirection = 'asc'
}