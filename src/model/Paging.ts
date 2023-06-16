
export class Paging {

    orderBy?: string | string[] = 'id'

    orderByDirection?: Direction = 'asc'

    cursor?: string | string[] | null = null

    limit: number = 1000

    page?: number = 0
}

export type Direction = 'desc' | 'asc'