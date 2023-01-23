export type PersistFirestoreReadProps = {
    collection: string,
    repositoryClassName: string,
    functionSignature: string,
    params?: string,
    queryResult: any | any[]
}