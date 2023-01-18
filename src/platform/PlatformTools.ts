import * as path from "path"

export class PlatformTools {
    static load(name: string): any {
        try {
            switch (name) {
                case "redis":
                    return require("redis")
                case "bigquery":
                    return require("@google-cloud/bigquery")                    
            }
        } catch (err) {
            return require(path.resolve(
                process.cwd() + "/node_modules/" + name,
            ))
        }

        // If nothing above matched and we get here, the package was not listed within PlatformTools
        // and is an Invalid Package.  To make it explicit that this is NOT the intended use case for
        // PlatformTools.load - it's not just a way to replace `require` all willy-nilly - let's throw
        // an error.
        throw new Error(`Invalid Package for PlatformTools.load: ${name}`)
    }
}