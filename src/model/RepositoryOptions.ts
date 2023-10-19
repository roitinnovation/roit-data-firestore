import { ValidatorOptions } from "class-validator"

export class RepositoryOptions {

    collection: string

    validateModel: Function

    validatorOptions?: ValidatorOptions

    ttl?: TtlOption
}

export type UnitType = "second" | "minute" | "hour" | "days" | "week" | "month" | "year" 

export class TtlOption {

    expirationIn: number

    unit: UnitType

    ttlUpdate?: boolean = false
}