import { Firestore } from "@google-cloud/firestore";
import { FirestoreInstance } from '../config/FirestoreInstance';
import { QueryPredicateFunctionTransform } from './QueryPredicateFunctionTransform';
import { RepositoryOptions } from '../model/RepositoryOptions';
import { MQuery, MQuerySimple, Config, Options } from '../model/MQuery';
import { CacheResolver } from "../cache/CacheResolver";
import { FirestoreReadAuditResolver } from "../firestore-read-audit/FirestoreReadAuditResolver";
import { QueryCreatorConfig } from "./QueryCreatorConfig";
import { QueryResult } from "../model";
import { ArchiveService } from '../archive/ArchiveService';
// import { ArchiveConfig } from "../config/ArchiveConfig";

export class ManualQueryHelper {

    static async executeQueryManual(className: string, config: Config): Promise<Array<any>> {
        const { data } = await this.handleExecuteQueryManual(className, config, { showCount: false })
        return data
    }
    
    static async executeQueryManualPaginated(className: string, config: Config): Promise<QueryResult> {
        return this.handleExecuteQueryManual(className, config, { showCount: true })
    }

    /**
     * Processa documentos arquivados, recuperando seus dados completos do Cloud Storage
     */
    private static async processArchivedDocuments(docs: any[], collectionName: string): Promise<any[]> {
        const archiveService = await ArchiveService.getInstance();

        // Verifica se o arquivamento está habilitado
        if (!archiveService.isEnabled()) {
            return docs;
        }

        const docsMap = new Map<string, any>();

        const recoveryPromises = docs.map(async (doc) => {

            docsMap.set(doc.id, doc)

            if (!archiveService.isDocumentArchived(doc)) {
                return null
            }

            try {
                // O ArchiveService agora gerencia o cache internamente baseado na configuração
                const archivedData = await archiveService.getArchivedDocument(collectionName, doc);
                if (archivedData) {
                    // Remove o flag de arquivamento e mescla os dados
                    // const { fbArchivedAt, ...archivedDataWithoutFlag } = archivedData;
                    return { ...doc, ...archivedData };
                }
                return doc;
            } catch (error) {
                console.warn(`Erro ao recuperar documento arquivado ${doc.id}:`, error);
                return doc;
            }
        });

        const recoveredDocs = await Promise.all(recoveryPromises);

        recoveredDocs.forEach(doc => {
            if (doc) {
                docsMap.set(doc.id, doc)
            }
        })

        return Array.from(docsMap.values())
    }

    static async handleExecuteQueryManual(className: string, config: Config, options: Options): Promise<QueryResult> {
        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver
        const result = await cacheResolver.getCacheResult(className, 'any', JSON.stringify({ ...config, options }))

        if (result) {
            return result
        }

        const repositoryOptions: RepositoryOptions | undefined = QueryPredicateFunctionTransform.classConfig.get(className)

        if (repositoryOptions) {
            const firestoreInstance: Firestore = FirestoreInstance.getInstance()

            const collection = firestoreInstance.collection(repositoryOptions.collection)

            let queryList: Array<MQuery>

            let queryExecute: any = collection

            if (config?.query && config?.query?.length > 0) {

                queryList = config.query.map(query => {
                    if (Object.keys(query).length === 1) {
                        return this.convertToMQuery(query as MQuerySimple)
                    }
                    return query;
                }) as Array<MQuery>

                const queryInit = queryList[0]

                queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)

                queryList.shift()

                queryList.forEach(que => {
                    queryExecute = queryExecute!.where(que.field, que.operator, que.value)
                })
            }

            if (config && config?.select) {
                if (queryExecute) {
                    queryExecute = queryExecute.select(...config.select)
                } else {
                    queryExecute = collection.select(...config.select)
                }
            }


            if (config && config?.orderBy) {
                if (queryExecute) {
                    queryExecute = queryExecute.orderBy(config.orderBy.field, config.orderBy.direction)
                } else {
                    queryExecute = collection.orderBy(config.orderBy.field, config.orderBy.direction)
                }
            }

            if (queryExecute) {
                let count: number | null = null;

                if (config?.paging) {
                    const { documentRef, totalItens } = await new QueryCreatorConfig().buildPaging(queryExecute, config.paging, options)
                    queryExecute = documentRef
                    count = totalItens
                }

                const snapshot = await queryExecute.get()
                const rawData = this.getData(snapshot);

                // PROCESSAR DOCUMENTOS ARQUIVADOS
                const processedData = await this.processArchivedDocuments(rawData, repositoryOptions.collection);

                await cacheResolver.cacheResult(className, 'any', { data: processedData, count }, JSON.stringify({ ...config, options }))

                const firestoreReadAuditResolver: FirestoreReadAuditResolver = (global as any).instances.firestoreReadAuditResolver

                await firestoreReadAuditResolver.persistFirestoreRead({
                    collection: repositoryOptions.collection,
                    repositoryClassName: className,
                    functionSignature: 'manual-query',
                    params: JSON.stringify(config),
                    queryResult: processedData
                })

                return {
                    data: processedData, 
                    totalItens: count
                }
                
            }
        }

        return   {
            data: [], 
            totalItens: 0
        }
    }

    static convertToMQuery(query: MQuerySimple): MQuery {
        let mQueryBuilder: MQuery = new MQuery
        Object.keys(query).forEach(itmKey => {
            mQueryBuilder.field = itmKey
            mQueryBuilder.operator = '=='
            mQueryBuilder.value = query[itmKey]
        })
        return mQueryBuilder
    }

    private static getData<T = any>(snapshot: any) {
        let items: Array<T> = []

        try {
            snapshot.forEach((doc: any) => {
                let element = { ...doc.data() }
                element.id = doc.id
                items.push(element)
            })

        } catch (err) {
            throw new Error(err.response)
        }

        return items
    }
}
