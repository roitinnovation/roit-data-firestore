
export class RepositoryException extends Error {
    
    constructor(public message: string, public errorType: ErrorType, public constraints?: Array<Constraints>) {
        super()
    }
}

export class Constraints {
    field: string
    validations: Array<string> = new Array
}

export enum ErrorType {
    SYSTEM = "system",
    BUSINESS = "business"
}