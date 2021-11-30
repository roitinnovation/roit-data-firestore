import { ValidatorOptions } from "class-validator"

export class RepositoryOptions {

    collection: string

    validateModel: Function

    validatorOptions?: ValidatorOptions
}