import { ValidationError, validate, ValidatorOptions } from "class-validator"
import { QueryPredicateFunctionTransform } from "../../query/QueryPredicateFunctionTransform"
import { RepositorySystemException } from "../RepositorySystemException"
import { RepositoryValidationException } from "../RepositoryValidationException"

export class ValidatorDataHandle {

    async validateModel(modelName: string, item: any, validatorOptions?: ValidatorOptions) {

        const prototypeRegister = QueryPredicateFunctionTransform.prototypeRegister

        if(!prototypeRegister.has(modelName)) {
            throw new RepositorySystemException(`Model validator ${modelName} is not resister in map`)
        }

        const instance = Object.create(prototypeRegister.get(modelName) as any)

        const objectToValidate = Object.assign(instance, item)

        await validate(objectToValidate, validatorOptions).then((errors: any) => {
            if (errors.length > 0) {
                throw new RepositoryValidationException(`Model validation failed, model ref ${modelName}, look at the list of constraints.`, this.getConstraints(errors))
            }
        })
    }

    getConstraints(errors: ValidationError[]) {
        const constraintsList: Array<any> = new Array()
        errors.forEach((err) => {
            this.extractConstraints(err, err.property, constraintsList)
        })
        return constraintsList
    }

    extractConstraints(error: ValidationError, ancestor: string, constraintsList: Array<any>) {
        if(!error?.children?.length) {
            const constraints = error.constraints as any
            constraintsList.push(
                {
                    field: ancestor,
                    validations: Object.keys(constraints).map((key) => constraints[key])
                }
            )
        } else {
            error?.children?.forEach(err => {
                this.extractConstraints(err, `${ancestor}.${err.property}`, constraintsList)
            })
        }
    }
}
