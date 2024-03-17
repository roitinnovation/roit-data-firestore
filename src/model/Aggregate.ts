

export type AggregateType = 'count' | 'sum' | 'average'

export class Aggregate {

    type: AggregateType

    field: string
}