
export class MQuery {

    field: string

    operator: FirebaseFirestore.WhereFilterOp = '=='

    value: any
}

export class MQuerySimple {
    [key: string]: string | number;
}