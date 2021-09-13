import { QueryPredicate } from "../model/QueryPredicate";
import { RepositoryOptions } from "../model/RepositoryOptions";
import { CreateFunction } from "./operator/CreateFunction";

export class QueryPredicateFunctionTransform {

    static createFunction(queryPredicate: Array<QueryPredicate>, methodSignature: string, options: RepositoryOptions): Function {

        (global as any).globalDbFile = require('../config/FirestoreInstance')

        if(!options?.collection) {
            throw new Error(`Colletion is required`)
        }

        const func = new CreateFunction().createFunction(methodSignature)

        if(func) {
            const functionString = func.toString()
                .replace(methodSignature, 'async function')
                .replace('return __awaiter(this, void 0, void 0, function* () {', '')
                .replace('});', '')
                .replace(/yield/g, 'await')
                .replace('<COLLECTION_RAPLACE>', options.collection)
            return Function(`return ${functionString}`)()
        }
        
        const parameters = queryPredicate.filter(query => query.operator?.includes('.where'))

        let functionBuilder = `async function(${parameters.map(att => att.attribute).join(',')}){\n`
        functionBuilder += `if(${parameters.map(att => `!${att.attribute}`).join('||')}) throw new Error('All paramiters required, ref..: ${parameters.map(att => att.attribute).join(',')}')\n`
        functionBuilder += ` const db = global.globalDbFile.FirestoreInstance.getInstance()\n`
        functionBuilder += `const colletion = db.collection('${options.collection}')\n`
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
}