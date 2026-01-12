import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { CacheResolver } from '../cache/CacheResolver';
import { ValidatorDataHandle } from '../exception/handle/ValidatorDataHandle';
import { FirestoreReadAuditResolver } from '../firestore-read-audit/FirestoreReadAuditResolver';
import { QueryPredicate } from "../model/QueryPredicate";
import { RepositoryOptions } from "../model/RepositoryOptions";
import { EnvironmentUtil } from '../util/EnvironmentUtil';
import { QueryCreatorConfig } from './QueryCreatorConfig';
import { QueryOptions } from '../decorators/Query';
import { AggregateField, FieldValue } from '@google-cloud/firestore';
import { TtlBuilderUtil } from '../util/TtlBuilderUtil';
import { ManualQueryHelper } from './ManualQueryHelper';
import * as firestore from '../config/FirestoreInstance'
import * as dateRef from '@roit/roit-date'
import classValidator from 'class-validator'
import * as uuid from 'uuid'
import fs  from 'fs'
import path  from 'path'
import { startTracer } from '../tracer/Tracer';
import { ArchiveService } from '../archive/ArchiveService';
import { ARCHIVE_METADATA_FIELDS } from '../archive';

const functionQueryTemplate = fs.readFileSync(path.resolve(__dirname, '../template/FunctionQueryTemplate.txt'), 'utf8')

const methodList = {
    'aggregation': fs.readFileSync(path.resolve(__dirname, '../template/FunctionAggregationTemplate.txt'), 'utf8'),
    'average': fs.readFileSync(path.resolve(__dirname, '../template/FunctionAverageTemplate.txt'), 'utf8'),
    'count': fs.readFileSync(path.resolve(__dirname, '../template/FunctionCountTemplate.txt'), 'utf8'),
    'createOrUpdate': fs.readFileSync(path.resolve(__dirname, '../template/FunctionCreateOrUpdateTemplate.txt'), 'utf8'),
    'create': fs.readFileSync(path.resolve(__dirname, '../template/FunctionCreateTemplate.txt'), 'utf8'),
    'delete': fs.readFileSync(path.resolve(__dirname, '../template/FunctionDeleteTemplate.txt'), 'utf8'),
    'findAll': fs.readFileSync(path.resolve(__dirname, '../template/FunctionFindAllTemplate.txt'), 'utf8'),
    'findById': fs.readFileSync(path.resolve(__dirname, '../template/FunctionFindByIdTemplate.txt'), 'utf8'),
    'incrementField': fs.readFileSync(path.resolve(__dirname, '../template/FunctionIncrementFieldTemplate.txt'), 'utf8'),
    'revokeCache': fs.readFileSync(path.resolve(__dirname, '../template/FunctionRevokeCacheTemplate.txt'), 'utf8'),
    'sum': fs.readFileSync(path.resolve(__dirname, '../template/FunctionSumTemplate.txt'), 'utf8'),
    'updatePartial': fs.readFileSync(path.resolve(__dirname, '../template/FunctionUpdatePartialTemplate.txt'), 'utf8'),
    'update': fs.readFileSync(path.resolve(__dirname, '../template/FunctionUpdateTemplate.txt'), 'utf8')
}

export class QueryPredicateFunctionTransform {

    public static prototypeRegister: Map<string, Object> = new Map
    public static schemaRegister: Map<string, any> = new Map
    public static classConfig: Map<string, RepositoryOptions> = new Map

    static createFunction(queryPredicate: Array<QueryPredicate>, methodSignature: string, repositoryClassName: string, options: RepositoryOptions, methodQueryOptions?: QueryOptions): Function {

        (global as any).instances = {
            globalDbFile: firestore,
            dateRef,
            classValidator,
            validatorDataHandle: new ValidatorDataHandle,
            uuid: uuid.v4,
            queryCreatorConfig: new QueryCreatorConfig,
            cacheResolver: CacheResolver.getInstance(),
            environmentUtil: new EnvironmentUtil,
            firestoreReadAuditResolver: FirestoreReadAuditResolver.getInstance(),
            fieldValueIncrement: FieldValue.increment,
            FieldValue: FieldValue,
            getTtlTimestamp: TtlBuilderUtil.getTtlTimestamp,
            convertToMQuery: ManualQueryHelper.convertToMQuery,
            aggregateAverage: AggregateField.average,
            aggregateSum: AggregateField.sum,
            aggregateCount: AggregateField.count,
            startTracer: startTracer,
            archiveService: ArchiveService.getInstance(),
            ARCHIVE_FIELDS: ARCHIVE_METADATA_FIELDS
        }

        if (!options?.collection) {
            throw new Error(`Collection is required`)
        }

        this.classConfig.set(repositoryClassName, options)

        const modelName = options.validateModel.name

        this.prototypeRegister.set(modelName, options.validateModel.prototype)

        const instance = Object.create(options.validateModel)
        this.schemaRegister.set(modelName, targetConstructorToSchema(instance))

        if (methodSignature in methodList) {
            
            const func = methodList[methodSignature as keyof typeof methodList]

            let functionString = func.toString()
                .replace(methodSignature, 'async function')
                .replace('return __awaiter(this, void 0, void 0, function* () {', '')
                .replace(/yield/g, 'await')
                .replace(/<COLLECTION_REPLACE>/g, options.collection)
                .replace("let modelName = ''", `let modelName = '${modelName}'`)
                .replace("let validatorOptions", `let validatorOptions = ${options?.validatorOptions ? JSON.stringify(options?.validatorOptions) : undefined}`)
                .replace("let repositoryClassName = ''", `let repositoryClassName = '${repositoryClassName}'`)
                .replace("let methodSignature = ''", `let methodSignature = '${methodSignature}'`)
                
                if(options?.ttl) {
                    functionString = functionString.replace("let ttlExpirationIn", `let ttlExpirationIn = ${options?.ttl.expirationIn}`)
                    functionString = functionString.replace("let ttlUnit", `let ttlUnit = '${options?.ttl.unit}'`)
                    functionString = functionString.replace("let ttlUpdate", `let ttlUpdate = ${options?.ttl.ttlUpdate}`)
                }

            functionString = this.removeLast(functionString, '});')
            return Function(`return ${functionString}`)()
        }

        let parameters = queryPredicate.filter(query => query.operator?.includes('.where'))
        parameters = parameters.concat({ attribute: 'paging' } as any)

        let functionBuilder = functionQueryTemplate

        const getAttribute = (queryPredicate: QueryPredicate) => queryPredicate.paramContent ?? queryPredicate.attribute

        functionBuilder = functionBuilder.replace(/<repositoryClassName_value>/g, repositoryClassName)
        functionBuilder = functionBuilder.replace(/<methodSignature_value>/g, methodSignature)
        functionBuilder = functionBuilder.replace(/<params_replace>/g, parameters.map(att => getAttribute(att)).join(','))
        functionBuilder = functionBuilder.replace(/<params_validator_replace>/g, parameters.filter(par => par.attribute != 'paging').map(att => `!${getAttribute(att)}`).join('||'))
        functionBuilder = functionBuilder.replace(/<collection_name_replace>/g, options.collection)
        functionBuilder = functionBuilder.replace(/<query_predicate_replace>/g, queryPredicate.map(att => `${att.operator?.replace('ATRIBUTE', att.attribute).replace('VALUE', getAttribute(att))}`).join(''))
        functionBuilder = functionBuilder.replace(/<is_one_row>/g, methodQueryOptions?.oneRow ? 'true' : 'false')


        return Function(`return ${functionBuilder}`)()
    }

    private static removeLast(value: string, repl: string) {
        const valueArr = value.split(repl)
        return valueArr.slice(0, -1).join(repl) + valueArr.pop()
    }
}