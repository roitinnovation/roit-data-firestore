const ATTR = 'ATRIBUTE'
const VALUE = 'VALUE'


export const operatorMap: Map<string, any> = new Map([
    ['Iqual', {
        predicate: () => `.where('${ATTR}', '==', ${VALUE})`,
        extractOperator: null
    }],
    ['LessThan', {
        predicate: () => `.where('${ATTR}', '<', ${VALUE})`,
        extractOperator: null
    }],
    ['LessThanEqual', {
        predicate: () => `.where('${ATTR}', '<=', ${VALUE})`,
        extractOperator: null
    }],
    ['GreaterThan', {
        predicate: () => `.where('${ATTR}', '>', ${VALUE})`,
        extractOperator: null
    }],
    ['GreaterThanEqual', {
        predicate: () => `.where('${ATTR}', '>=', ${VALUE})`,
        extractOperator: null
    }],
    ['Different', {
        predicate: () => `.where('${ATTR}', '!=', ${VALUE})`,
        extractOperator: null
    }],
    ['ArrayContains', {
        predicate: () => `.where('${ATTR}', 'array-contains', ${VALUE})`,
        extractOperator: null
    }],
    ['ArrayContainsAny', {
        predicate: () => `.where('${ATTR}', 'array-contains-any', ${VALUE})`,
        extractOperator: null
    }],
    ['In', {
        predicate: () => `.where('${ATTR}', 'in', ${VALUE})`,
        extractOperator: null
    }],
    ['NotIn', {
        predicate: () => `.where('${ATTR}', 'not-in', ${VALUE})`,
        extractOperator: null
    }],
    ['OrderBy', {
        predicate: (signature: string): string => {
            if(signature.endsWith('Desc')) {
                return `.orderBy('${ATTR}', 'desc')`
            }
            return `.orderBy('${ATTR}', 'asc')`
        },
        extractOperator: (signature: string) => {
            return signature.replace('OrderBy', '').replace('Asc', '').replace('Desc', '')
        }
    }],
    ['Limit', {
        predicate: () => `.limit(${ATTR})`,
        extractOperator: null
    }],
])