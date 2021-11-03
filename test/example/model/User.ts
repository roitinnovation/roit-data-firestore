import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class User {

    @IsString()
    id: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    age: number
}

// const schemaName = `userSchema`
// const properties = JSON.parse(JSON.stringify(targetConstructorToSchema(new User().constructor).properties))

// let schem: any = {}

// Object.keys(properties).map(pro => {
//     schem[pro] = [properties[pro]]
// })

// const schema: any = {
//     name: schemaName,
//     properties: schem
// }

// getMetadataStorage()['validationMetadatas'].forEach((vali: any) => {
//     console.log(vali.target)
// })

// const classIntance = getMetadataStorage()['validationMetadatas'][0].target

// console.log(User.toString())

// var newInstance = Object.create(User.prototype);
// newInstance.constructor.apply(newInstance);

// console.log(classIntance.constructor)

// registerSchema(schema)

// validate(newInstance, { whitelist: true }).then((errors: any) => {
//     // errors is an array of validation errors
//     if (errors?.length > 0) {
//         console.log('validation failed. errors: ', errors);
//     } else {
//         console.log('validation succeed');
//     }
// })