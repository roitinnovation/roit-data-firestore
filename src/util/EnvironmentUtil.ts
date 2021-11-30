
export class EnvironmentUtil {

    areWeTesting(): boolean {
        // Jest WORKER
        return process.env.JEST_WORKER_ID !== undefined
    }
}