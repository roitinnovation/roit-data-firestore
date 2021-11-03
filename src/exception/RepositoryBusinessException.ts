import { Constraints, ErrorType, RepositoryException } from "./RepositoryException";

export class RepositoryBusinessException extends RepositoryException {

    constructor(message: string, constraints: Array<Constraints>) {
        super(message, ErrorType.BUSINESS, constraints)
    }
}