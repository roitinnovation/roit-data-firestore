import { Environment } from "roit-environment";
import * as shell from "shelljs";

shell.exec('lsof -ti tcp:9005 | xargs kill')
shell.exec('lsof -ti tcp:4000 | xargs kill')
shell.exec(`firebase --config ${process.cwd()}/src/emulator/firebase.json emulators:start --project ${Environment.getProperty('firestore.projectId')}`);