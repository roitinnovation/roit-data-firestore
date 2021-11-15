import * as fs from "fs"

export class TemplateLoading {

    private static readonly DIR = 'template'

    static read(templateName: string): string {
        return fs.readFileSync(`${process.cwd()}/${this.DIR}/${templateName}`).toString()
    }

}