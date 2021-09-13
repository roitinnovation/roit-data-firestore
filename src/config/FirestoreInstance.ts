import { Firestore } from "@google-cloud/firestore";
import { Environment } from 'roit-environment';

export class FirestoreInstance {

    private static instance: FirestoreInstance = new FirestoreInstance()

    private firestore: Firestore;

    constructor() {

        const projectId = Environment.getProperty("firestore.projectId")

        try {
          this.firestore = new Firestore({
              projectId
          })
        } catch (err) {
            console.error(err)
            throw new Error(`Error in initializeApp: ${err}`)
        }
    }

    public static getInstance(): Firestore {
        return this.instance.firestore;
    }

}