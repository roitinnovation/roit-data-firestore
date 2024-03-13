
export class Paging {

    orderBy?: string | string[] = 'id'

    orderByDirection?: Direction = 'asc'

    cursor?: string | string[] | null = null

    limit: number = 1000

    startAt?: string | number

    endAt?: string | number
}

export type Direction = 'desc' | 'asc'