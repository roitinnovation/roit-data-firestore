import "reflect-metadata";
import { ClassMethodQueryMap } from "../config/ClassMethodQueryMap";

export function Query() {
    return function(target: Object, propertyKey: string) { 
      const className = target.constructor.prototype.constructor.name
      ClassMethodQueryMap.getInstance().register(className, propertyKey)
    }
}