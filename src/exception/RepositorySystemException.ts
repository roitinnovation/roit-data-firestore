import { Constraints, ErrorType, RepositoryException } from "./RepositoryException";

export class RepositorySystemException extends RepositoryException {

    constructor(message: string, constraints?: Array<Constraints>) {
        super(message, ErrorType.SYSTEM, constraints)
    }
}