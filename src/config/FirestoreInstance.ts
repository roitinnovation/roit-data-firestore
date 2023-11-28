import { Firestore } from "@google-cloud/firestore";
import { Env, Environment } from 'roit-environment';
import { RepositorySystemException } from "../exception/RepositorySystemException";

export class FirestoreInstance {

    private static instance: FirestoreInstance = new FirestoreInstance()

    private firestore: Firestore;

    constructor() {

        if(Environment.acceptedEnv(Env.TEST)) { return }

        const projectId = Environment.getProperty("firestore.projectId") || Environment.systemProperty("PROJECT_ID")

        if(!projectId) {
            throw new RepositorySystemException(`ProjectId is required in env.yaml {firestore.projectId}`)
        }

        try {
            this.firestore = new Firestore({
                projectId
            })
        } catch (err) {
            console.error(err)
            throw new RepositorySystemException(`Error in initializeApp: ${err}`)
        }
    }

    public static getInstance(): Firestore {
        return this.instance.firestore;
    }

}