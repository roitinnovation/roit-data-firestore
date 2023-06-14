
export class Paging {

    orderBy?: string | string[] = 'id'

    orderByDirection?: Direction = 'asc'

    cursor?: string | string[] | null = null

    limit: number = 1000

    showCount?: boolean = false
}

export type Direction = 'desc' | 'asc'