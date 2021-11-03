import { RepositoryBusinessException } from "./RepositoryBusinessException";
import { Constraints } from "./RepositoryException";

export class RepositoryValidationException extends RepositoryBusinessException {

    constructor(message: string, constraints: Array<Constraints>) {
        super(message, constraints)
    }
}