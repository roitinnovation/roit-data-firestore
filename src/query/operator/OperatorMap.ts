const ATTR = 'ATRIBUTE'
const VALUE = 'VALUE'


export const operatorMap: Map<string, string> = new Map([
    ['Iqual', `.where('${ATTR}', '==', ${VALUE})`],
    ['LessThan', `.where('${ATTR}', '<', ${VALUE})`],
    ['LessThanEqual', `.where('${ATTR}', '<=', ${VALUE})`],
    ['GreaterThan', `.where('${ATTR}', '>', ${VALUE})`],
    ['GreaterThanEqual', `.where('${ATTR}', '>=', ${VALUE})`],
    ['Different', `.where('${ATTR}', '!=', ${VALUE})`],
    ['ArrayContains', `.where('${ATTR}', 'array-contains', ${VALUE})`],
    ['ArrayContainsAny', `.where('${ATTR}', 'array-contains-any', ${VALUE})`],
    ['In', `.where('${ATTR}', 'in', ${VALUE})`],
    ['NotIn', `.where('${ATTR}', 'not-in', ${VALUE})`],
    ['OrderByDesc', `.orderBy('${ATTR}', 'desc')`],
    ['OrderByAsc', `.orderBy('${ATTR}')`],
    ['Limit', `.limit(${ATTR})`],
])