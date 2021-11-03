import { QueryPredicate } from "../model/QueryPredicate"
import { operatorMap } from "./operator/OperatorMap"

export class TransformMethodFromQuery {


    static extractQuery(methodSignature: string): Array<QueryPredicate> {

        methodSignature = methodSignature.replace('findBy', '')

        const seperadorArray = methodSignature.split('And')

        const queryOperator: Array<QueryPredicate> = seperadorArray.map(part => {

            const operators = Array.from(operatorMap.keys()).filter(ope => part.includes(ope))
            
            const opertorMaxLength = Math.max(...operators.map(opt => opt.length))
            const operator = operators.find(opt => opt.length == opertorMaxLength) || 'Iqual'

            const operatorConfig = operatorMap.get(operator)

            const predicate = new QueryPredicate
            predicate.attribute = this.lowerCamelCase(operatorConfig?.extractOperator ? operatorConfig?.extractOperator(part) : part.replace(operator, ''))
            predicate.operator = operatorConfig?.predicate(part)
            predicate.operatorKey = operator

            return predicate
        })

        return queryOperator
    }

    private static lowerCamelCase(str: string) {
        return str.charAt(0).toLowerCase() + str.slice(1)
    }
}