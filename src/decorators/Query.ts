import "reflect-metadata";
import { ClassMethodQueryMap } from "../config/ClassMethodQueryMap";

export class QueryOptions {
  select?: Array<string> = []
}

export function Query(options?: QueryOptions) {
  return function (target: Object, propertyKey: string) {
    const className = target.constructor.prototype.constructor.name
    ClassMethodQueryMap.getInstance().register(className, propertyKey, options)
  }
}