import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { CacheResolver } from '../cache/CacheResolver';
import { ValidatorDataHandle } from '../exception/handle/ValidatorDataHandle';
import { QueryPredicate } from "../model/QueryPredicate";
import { RepositoryOptions } from "../model/RepositoryOptions";
import { CreateFunction } from "./operator/CreateFunction";
import { QueryCreatorConfig } from './QueryCreatorConfig';
const firestore = require('../config/FirestoreInstance')
const dateRef = require('@roit/roit-date')
const classValidator = require('class-validator')
const uuid = require("uuid");
const { Environment } = require('roit-environment')
const fs = require('fs')
const path = require('path')

const templateFun = fs.readFileSync(path.resolve(__dirname, '../../template/FunctionQueryTemplate.txt'), 'utf8')

export class QueryPredicateFunctionTransform {

    public static prototypeRegister: Map<string, Object> = new Map
    public static schemaRegister: Map<string, any> = new Map

    static createFunction(queryPredicate: Array<QueryPredicate>, methodSignature: string, repositoryClassName: string, options: RepositoryOptions): Function {

        (global as any).instances = {
            globalDbFile: firestore,
            dateRef,
            classValidator,
            validatorDataHandle: new ValidatorDataHandle,
            uuid: uuid.v4,
            Environment,
            queryCreatorConfig: new QueryCreatorConfig,
            cacheResolver: CacheResolver.getInstance()
        } 

        if(!options?.collection) {
            throw new Error(`Collection is required`)
        }

        const modelName = options.validateModel.name

        this.prototypeRegister.set(modelName, options.validateModel.prototype)

        // const target = getMetadataStorage()['validationMetadatas'].find((valu: any) => String(valu.target).includes(modelName))

        // console.log(getMetadataStorage()['validationMetadatas'].map((valu: any) => String(valu.target)))
    
        const instance = Object.create(options.validateModel)
        this.schemaRegister.set(modelName, targetConstructorToSchema(instance))

        const func = new CreateFunction().createFunction(methodSignature)

        if(func) {
            let functionString = func.toString()
                .replace(methodSignature, 'async function')
                .replace('return __awaiter(this, void 0, void 0, function* () {', '')
                .replace(/yield/g, 'await')
                .replace('<COLLECTION_RAPLACE>', options.collection)
                .replace("let modelName = ''", `let modelName = '${modelName}'`)
                .replace("let repositoryClassName = ''", `let repositoryClassName = '${repositoryClassName}'`)
                .replace("let methodSignature = ''", `let methodSignature = '${methodSignature}'`)
            functionString = this.removeLast(functionString, '});')
            return Function(`return ${functionString}`)()
        }
        
        let parameters = queryPredicate.filter(query => query.operator?.includes('.where'))
        parameters = parameters.concat({ attribute: 'paging' } as any)

        let functionBuilder = templateFun

        functionBuilder = functionBuilder.replace(/<repositoryClassName_value>/g, repositoryClassName)
        functionBuilder = functionBuilder.replace(/<methodSignature_value>/g, methodSignature)
        functionBuilder = functionBuilder.replace(/<params_replace>/g, parameters.map(att => att.attribute).join(','))
        functionBuilder = functionBuilder.replace(/<params_validator_replace>/g, parameters.filter(par => par.attribute != 'paging').map(att => `!${att.attribute}`).join('||'))
        functionBuilder = functionBuilder.replace(/<collection_name_replace>/g, options.collection)
        functionBuilder = functionBuilder.replace(/<query_predicate_replace>/g, queryPredicate.map(att => `${att.operator?.replace('ATRIBUTE', att.attribute).replace('VALUE', att.attribute)}`).join(''))

        return Function(`return ${functionBuilder}`)()
    }

    private static removeLast(value: string, repl: string){
        const valueArr = value.split(repl)
        return valueArr.slice(0,-1).join(repl) + valueArr.pop()
    }      
}