export type PersistFirestoreReadProps = {
    collection: string,
    repositoryClassName: string,
    functionSignature: string,
    params?: string,
    queryResult: any | any[]
}

export type PersistFirestoreReadEnrichedProps = {
    collection: string,
    env: string,
    insertAt: string,
    service: string,
    projectId: string,
    repositoryClassName: string,
    functionSignature: string,
    params?: string,
    queryResult: any | any[]
    queryResultLength: number
}