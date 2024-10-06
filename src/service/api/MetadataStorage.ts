import { ExposeGroup } from '$/model/ExposeGroup.js';
import { replaceRecursive } from '$/utils/replaceRecursive.js';
import type { ActionDefinition, ClassConstructor } from './def.js';


type Definitions<T> = Map<
    any,
    Record<
        PropertyKey,
        T
    >
>;

export class MetadataStorage
{
    
    protected static __singleton : MetadataStorage;
    
    public static getSingleton () : MetadataStorage
    {
        if (!this.__singleton) {
            this.__singleton = new MetadataStorage();
        }
        return this.__singleton;
    }
    
    
    protected _actions : Definitions<ActionDefinition> = new Map();
    
    
    public registerAction (
        targetClass : any,
        propKey : PropertyKey,
        definition : Partial<ActionDefinition>
    )
    {
        let classDefinition = this._actions.get(targetClass);
        if (!classDefinition) {
            classDefinition = {};
            this._actions.set(targetClass, classDefinition);
        }
        
        if (!classDefinition[propKey]) {
            classDefinition[propKey] = {
                propertyKey: propKey,
                method: undefined,
                route: undefined,
                requestFn: undefined,
                options: {
                    groups: {
                        request: [ ExposeGroup.Public ],
                        response: [ ExposeGroup.Public ],
                    },
                }
            };
        }
        
        replaceRecursive(
            classDefinition[propKey],
            definition
        );
    }
    
    public getAllActions (
        targetClass : any
    ) : Record<PropertyKey, ActionDefinition>
    {
        return this._actions.get(targetClass) ?? {};
    }
    
    public getAllControllers () : ClassConstructor[]
    {
        return [ ...this._actions.keys() ];
    }
    
}
