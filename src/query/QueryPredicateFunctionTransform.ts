import { getMetadataStorage } from 'class-validator';
import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { ValidatorDataHandle } from '../exception/handle/ValidatorDataHandle';
import { QueryPredicate } from "../model/QueryPredicate";
import { RepositoryOptions } from "../model/RepositoryOptions";
import { CreateFunction } from "./operator/CreateFunction";
const firestore = require('../config/FirestoreInstance')
const dateRef = require('@roit/roit-date')
const classValidator = require('class-validator')
const uuid = require("uuid");
const { Environment } = require('roit-environment')

export class QueryPredicateFunctionTransform {

    public static prototypeRegister: Map<string, Object> = new Map
    public static schemaRegister: Map<string, any> = new Map

    static createFunction(queryPredicate: Array<QueryPredicate>, methodSignature: string, options: RepositoryOptions): Function {

        (global as any).instances = {
            globalDbFile: firestore,
            dateRef,
            classValidator,
            validatorDataHandle: new ValidatorDataHandle,
            uuid: uuid.v4,
            Environment,
        } 

        if(!options?.collection) {
            throw new Error(`Collection is required`)
        }

        const modelName = options.validateModel.name

        this.prototypeRegister.set(modelName, options.validateModel.prototype)

        const target = getMetadataStorage()['validationMetadatas'].find((valu: any) => String(valu.target).includes(modelName))
    
        this.schemaRegister.set(modelName, targetConstructorToSchema(target))

        const func = new CreateFunction().createFunction(methodSignature)

        if(func) {
            let functionString = func.toString()
                .replace(methodSignature, 'async function')
                .replace('return __awaiter(this, void 0, void 0, function* () {', '')
                .replace(/yield/g, 'await')
                .replace('<COLLECTION_RAPLACE>', options.collection)
                .replace("let modelName = ''", `let modelName = '${modelName}'`)
            functionString = this.removeLast(functionString, '});')
            return Function(`return ${functionString}`)()
        }
        
        const parameters = queryPredicate.filter(query => query.operator?.includes('.where'))

        let functionBuilder = `async function(${parameters.map(att => att.attribute).join(',')}){\n`
        functionBuilder += `if(${parameters.map(att => `!${att.attribute}`).join('||')}) throw new Error('All parameters required, ref..: ${parameters.map(att => att.attribute).join(',')}')\n`
        functionBuilder += ` const db = global.instances.globalDbFile.FirestoreInstance.getInstance()\n`
        functionBuilder += `const colletion = db.collection('${options.collection}')\n`
        functionBuilder += `if(Number(global.instances.Environment.getProperty('firestore.debug'))) { console.debug('[DEBUG] Executing query >', "${queryPredicate.map(att => `${att.operator?.replace('ATRIBUTE', att.attribute).replace('VALUE', att.attribute)}`).join('')}") }\n`
        functionBuilder += `const snapshot = await colletion${queryPredicate.map(att => `${att.operator?.replace('ATRIBUTE', att.attribute).replace('VALUE', att.attribute)}`).join('')}.get()\n`
        functionBuilder += `let items = []\n`
        functionBuilder += `snapshot.forEach(doc => { 
            let element = { ...doc.data() }
            element.id = doc.id
            items.push(element)
         })\n`
        functionBuilder +=  ` return items\n`
        functionBuilder += '}'

        return Function(`return ${functionBuilder}`)()
    }

    private static removeLast(value: string, repl: string){
        const valueArr = value.split(repl)
        return valueArr.slice(0,-1).join(repl) + valueArr.pop()
    }      
}