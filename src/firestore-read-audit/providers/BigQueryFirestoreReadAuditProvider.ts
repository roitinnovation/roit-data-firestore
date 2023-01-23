import { Env, Environment } from 'roit-environment'
import { RepositorySystemException } from "../../exception/RepositorySystemException";
import { PersistFirestoreReadProps } from '../../model/PersistFirestoreReadProps';
import { PlatformTools } from '../../platform/PlatformTools';

const dataset = 'firestore_read_audit'
const table = `${dataset}_table`

export class BigQueryFirestoreReadAuditProvider {

    /**
     * Big Query module instance loaded dynamically
     */
    private bigQuery: any

    private tableIsCreated: boolean = false

    constructor() {
        if (Environment.acceptedEnv(Env.TEST)) return

        if (!this.bigQuery) {
            const projectId = Environment.getProperty("firestore.projectId")
    
            if (!projectId) {
                throw new RepositorySystemException(`projectId is required in env.yaml {firestore.projectId}`)
            }
    
            try {
                const { BigQuery } = this.loadBigQuery()
                this.bigQuery = new BigQuery({
                    projectId
                })
            } catch (err) {
                console.error(err)
                throw new RepositorySystemException(`Error in initializeApp: ${err}`)
            }
        }

    }

    private async createFirestoreAuditDatasetAndTableIfNecessary() {
        const TWO_DAYS_IN_MS = '172800000'

        const schema = [
            { name: 'collection', type: 'STRING' },
            { name: 'service', type: 'STRING' },
            { name: 'env', type: 'STRING' },
            { name: 'repositoryClassName', type: 'STRING' },
            { name: 'functionSignature', type: 'STRING' },
            { name: 'params', type: 'STRING' },
            { name: 'queryResult', type: 'STRING' },
            { name: 'queryResultLength', type: 'INTEGER' },
            { name: 'insertAt', type: 'DATETIME' },
        ]

        const options = {
            schema,
            location: 'US',
            timePartitioning: {
                type: 'DAY',
                expirationMS: TWO_DAYS_IN_MS,
                field: 'insertAt'
            }
        }

        const handleBigQueryError = (e: any) => {
            if (!JSON.stringify(e.errors).includes('Exists')) {
                console.log('Error [createFirestoreAuditDatasetAndTableIfNecessary]', e)
            }
        }

        try {
            await this.bigQuery.createDataset(dataset)
        } catch (e) {
            handleBigQueryError(e)
        }

        try {
            await this.bigQuery
                .dataset(dataset)
                .createTable(table, options)
        } catch (e) {
            handleBigQueryError(e)
        }
    }

    async persistFirestoreRead({
        collection,
        repositoryClassName,
        functionSignature,
        params,
        queryResult
    }: PersistFirestoreReadProps) {
        try {
            if (!this.tableIsCreated) {
                await this.createFirestoreAuditDatasetAndTableIfNecessary()
            }

            let queryResultLength = 1

            if (Array.isArray(queryResult)) {
                queryResultLength = queryResult.length
            }

            this.tableIsCreated = true
        
            await this.bigQuery
                .dataset(dataset)
                .table(table)
                .insert([{
                    collection,
                    repositoryClassName,
                    functionSignature,
                    params, 
                    env: Environment.currentEnv(),
                    insertAt: this.bigQuery.datetime(new Date().toISOString()),
                    service: Environment.getProperty('service'),
                    queryResult: JSON.stringify(queryResult),
                    queryResultLength: queryResultLength
                }])
        } catch (error) {
            console.log(JSON.stringify(error.errors))
        }
    }

    private loadBigQuery(): any {
        try {
            return PlatformTools.load("bigquery")
        } catch (e) {
            console.log(e)
            throw new Error(
                `Cannot use Firestore Read Audit because BigQuery is not installed. Please run "npm i @google-cloud/bigquery@6.0.3 --save-exact".`,
            )
        }
    }

}