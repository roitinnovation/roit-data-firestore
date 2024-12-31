import { PersistFirestoreReadEnrichedProps } from '../../model/PersistFirestoreReadProps';
import { PlatformTools } from '../../platform/PlatformTools';
import { FirestoreReadAuditProvider } from './FirestoreReadAuditProvider';

const dataset = 'firestore_read_audit'
const table = `${dataset}_table`

export class BigQueryFirestoreReadAuditProvider implements FirestoreReadAuditProvider {

    /**
     * Big Query module instance loaded dynamically
     */
    private bigQuery: any

    private isTableCreated: boolean = false

    constructor() {
        if (process.env.ENV === 'test') return

        if (!this.bigQuery) {
            const projectId = process.env.FIRESTORE_PROJECTID
    
            if (!projectId) {
                throw new Error(`projectId is required in env.yaml {firestore.projectId}`)
            }
    
            try {
                const { BigQuery } = this.loadBigQuery()
                this.bigQuery = new BigQuery({
                    projectId
                })
            } catch (err) {
                console.error(err)
                throw new Error(`Error in initializeApp: ${err}`)
            }
        }

    }

    private async createFirestoreAuditDatasetAndTableIfNecessary() {
        const TWO_DAYS_IN_MS = '172800000'

        const schema = [
            { name: 'collection', type: 'STRING' },
            { name: 'service', type: 'STRING' },
            { name: 'projectId', type: 'STRING' },
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

    async persistFirestoreRead(props: PersistFirestoreReadEnrichedProps) {
        try {
            if (!this.isTableCreated) {
                await this.createFirestoreAuditDatasetAndTableIfNecessary()
            }

            this.isTableCreated = true
        
            await this.bigQuery
                .dataset(dataset)
                .table(table)
                .insert([props])
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