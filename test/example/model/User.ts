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