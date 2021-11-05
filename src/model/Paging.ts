
export class Paging {

    orderBy?: string = 'id'

    orderByDirection?: Direction = 'asc'

    cursor?: string | null = null

    limit: number = 1000
}

export type Direction = 'desc' | 'asc'