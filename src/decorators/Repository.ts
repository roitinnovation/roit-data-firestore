import { ClassMethodQueryMap } from "../config/ClassMethodQueryMap"
import { RepositoryOptions } from "../model/RepositoryOptions"
import { QueryPredicateFunctionTransform } from "../query/QueryPredicateFunctionTransform"
import { TransformMethodFromQuery } from "../query/TransformMethodFromQuery"

export function Repository(options: RepositoryOptions) {
    return function (constructor: Function) {

        const className = constructor.prototype.constructor.name

        let methods: Array<string> = new Array

        const classMethods = ClassMethodQueryMap.getInstance().get(className)
        const baseRepository = ClassMethodQueryMap.getInstance().get('BaseRepository')

        if(classMethods) {
            methods = methods.concat(classMethods)
        }

        if(baseRepository) {
            methods = methods.concat(baseRepository)
        }

        methods.forEach(propertyKey => {
            const queryOperator = TransformMethodFromQuery.extractQuery(propertyKey)
            constructor.prototype[propertyKey] = QueryPredicateFunctionTransform.createFunction(queryOperator, propertyKey, className, options)
        })
    }
}