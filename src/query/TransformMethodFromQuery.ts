import { QueryOptions } from "../decorators/Query"
import { QueryPredicate } from "../model/QueryPredicate"
import { operatorMap } from "./operator/OperatorMap"

export class TransformMethodFromQuery {


    static extractQuery(methodSignature: string, queryOptions?: QueryOptions): Array<QueryPredicate> {

        methodSignature = methodSignature.replace('findBy', '')

        const seperadorArray = methodSignature.split('And')

        const queryOperator: Array<QueryPredicate> = seperadorArray.map((part, index) => {

            const operators = Array.from(operatorMap.keys()).filter(ope => part.includes(ope))

            const opertorMaxLength = Math.max(...operators.map(opt => opt.length))
            const operator = operators.find(opt => opt.length == opertorMaxLength) || 'Iqual'

            const operatorConfig = operatorMap.get(operator)

            const predicate = new QueryPredicate
            const attribute = this.lowerCamelCase(operatorConfig?.extractOperator ? operatorConfig?.extractOperator(part) : part.replace(operator, ''))
            predicate.attribute = attribute
            predicate.operator = operatorConfig?.predicate(part)
            predicate.operatorKey = operator
            predicate.paramContent = `${attribute}${index}`

            return predicate
        })

        if (queryOptions && queryOptions.select) {
            const selectOperator = `.select(${queryOptions.select.map(itm => `'${itm}'`).join(',')})`
            queryOperator.push({
                attribute: 'non',
                operator: selectOperator,
                operatorKey: 'Select',
                paramContent: selectOperator
            })
        }

        return queryOperator
    }

    private static lowerCamelCase(str: string) {
        return str.charAt(0).toLowerCase() + str.slice(1)
    }
}