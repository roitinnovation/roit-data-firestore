import { Firestore, Filter } from "@google-cloud/firestore";
import { CacheResolver } from "../cache/CacheResolver";
import { FirestoreInstance } from '../config/FirestoreInstance';
import { FirestoreReadAuditResolver } from "../firestore-read-audit/FirestoreReadAuditResolver";
import { QueryResult } from "../model";
import { Config, MQuery, MQueryOr, MQuerySimple, Options } from '../model/MQuery';
import { RepositoryOptions } from '../model/RepositoryOptions';
import { QueryCreatorConfig } from "./QueryCreatorConfig";
import { QueryPredicateFunctionTransform } from './QueryPredicateFunctionTransform';
import { ArchiveService } from '../archive/ArchiveService';

export class ManualQueryHelper {

    static async executeQueryManual(className: string, config: Config, queryRef = false): Promise<any> {
        const result = await this.handleExecuteQueryManual(className, config, { showCount: false }, queryRef)
        
        if(queryRef) {
            return result
        }

        const { data } = result

        return data
    }
    
    static async executeQueryManualPaginated(className: string, config: Config): Promise<QueryResult> {
        return this.handleExecuteQueryManual(className, config, { showCount: true })
    }

    /**
     * Processes archived documents, retrieving their complete data from Cloud Storage
     */
    private static async processArchivedDocuments(docs: any[], collectionName: string): Promise<any[]> {
        const archiveService = await ArchiveService.getInstance();

        // Checks if the archive is enabled
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
                // The ArchiveService now manages the cache internally based on the configuration
                const archivedData = await archiveService.getArchivedDocument(collectionName, doc);
                if (archivedData) {
                    // Merges the stub data with the archived data (the stub keeps _rfa)
                    return { ...doc, ...archivedData };
                }
                return doc;
            } catch (error) {
                console.warn(`Error retrieving archived document ${doc.id}:`, error);
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

    static async handleExecuteQueryManual(className: string, config: Config, options: Options, queryRef = false): Promise<QueryResult> {
        return await (global as any).instances.startTracer('firestore.query', async (span: any) => {
            try {
                const cacheResolver: CacheResolver = (global as any).instances.cacheResolver
                const result = await cacheResolver.getCacheResult(className, 'any', JSON.stringify({ ...config, options }))
        
                if (result) {
                    return result
                }
        
                const repositoryOptions: RepositoryOptions | undefined = QueryPredicateFunctionTransform.classConfig.get(className)

                const traceQuery: Array<any> = []
                const pushTraceQuery = (query: any) => {
                    traceQuery.push({ field: query.field, operator: query.operator, value: '?' })
                }
        
                if (repositoryOptions) {
                    const firestoreInstance: Firestore = FirestoreInstance.getInstance()
        
                    const collection = firestoreInstance.collection(repositoryOptions.collection)
        
                    let queryList: Array<MQuery | MQuerySimple | MQueryOr>
        
                    let queryExecute: any = collection
        
                    if (config?.query && config?.query?.length > 0) {

                        queryList = config.query.map(query => {
                            return query;
                        });

                        for (const queryItem of queryList) {

                            if (queryItem && typeof queryItem === 'object' && 'or' in queryItem && Array.isArray(queryItem.or)) {
                                const orFilters = queryItem.or.map((orCondition: any) => {
                                    const mQuery = Object.keys(orCondition).length === 1
                                        ? this.convertToMQuery(orCondition as MQuerySimple)
                                        : orCondition as MQuery;

                                    pushTraceQuery(mQuery);

                                    return Filter.where(mQuery.field, mQuery.operator, mQuery.value);
                                });

                                if (orFilters.length > 0) {
                                    const orFilter = Filter.or(...orFilters);
                                    
                                    if (queryExecute === collection) {
                                        queryExecute = collection.where(orFilter);
                                    } else {
                                        queryExecute = queryExecute.where(orFilter);
                                    }
                                }
                                
                            } else {
                                const mQuery = Object.keys(queryItem).length === 1
                                    ? this.convertToMQuery(queryItem as unknown as MQuerySimple)
                                    : queryItem as MQuery;
                                
                                if (queryExecute === collection) {
                                    queryExecute = collection.where(mQuery.field, mQuery.operator as any, mQuery.value);
                                } else {
                                    queryExecute = queryExecute.where(mQuery.field, mQuery.operator as any, mQuery.value);
                                }
                                
                                pushTraceQuery(mQuery);
                            }
                        }
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
        
                        if(queryRef) {
                            return queryExecute
                        }
        
                        const snapshot = await queryExecute.get()
        
                        const data = this.getData(snapshot);

                        // PROCESSAR DOCUMENTOS ARQUIVADOS
                        const processedData = await this.processArchivedDocuments(data, repositoryOptions.collection);
        
                        await cacheResolver.cacheResult(className, 'any', { data: processedData, count }, JSON.stringify({ ...config, options }))
        
                        const firestoreReadAuditResolver: FirestoreReadAuditResolver = (global as any).instances.firestoreReadAuditResolver
        
                        await firestoreReadAuditResolver.persistFirestoreRead({
                            collection: repositoryOptions.collection,
                            repositoryClassName: className,
                            functionSignature: 'manual-query',
                            params: JSON.stringify(config),
                            queryResult: data
                        })

                        span.setAttributes({
                            'firestore.operation.name': 'query',
                            'firestore.operation.query': JSON.stringify(traceQuery),
                            'firestore.collection.name': repositoryOptions.collection,
                            'firestore.operation.size': data.length,
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
                
            } catch (error) {
                span.setStatus({
                    code: 2,
                    message: error.message
                })
                span.recordException(error)
                throw error
            }
        })
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
