import { filter, Observable, Subject, timestamp } from "rxjs";
import GameContext from "../game/ctx";

/**
 * Class that provides easy access to entities from arbitrary places.
 */
export default class EntitySystem {
    /**
     * Construct a new entity system.
     * @param {GameContext} ctx 
     */
    constructor(ctx) {
        this._ents = [];
        this._toRemove = new WeakSet();
        this._ctx = ctx;
        this._services = new Map();

        this._entAdded = new Subject();
        this._entRemoved = new Subject();
    }

    /**
     * Instantiate an entity, automatically adding it to the registry.
     * @template T
     * @param {new() => T} type Entity type to instantiate.
     * @param {...any} v Var args.
     * @returns {T}
     */
    instantiate(type, ...v) {
        const ent = new type(this._ctx, this, ...v);
        this._ents.push(ent);
        this._entAdded.next(ent);
        return ent;
    }

    /**
     * Remove an entity from the simulation.
     * @param {Object} ent Entity to remove.
     */
    remove(ent) {
        this._entRemoved.next(ent);
        this._toRemove.add(ent);
    }


    /**
     * Get all entities of given type.
     * @template T
     * @param {new() => T} type Entity type / class.
     * @returns {Array.<T>}
     */
    getEntities(type) {
        return this._ents.filter(ent => ent instanceof type);
    }

    /**
     * Update all entities.
     */
    updateAll() {
        // Call update on each.
        // Respond to new entities being added!
        // https://stackoverflow.com/a/8452333
        for (let i = 0; i < this._ents.length; i++) {
            const ent = this._ents[i];
            if (this._toRemove.has(ent)) continue;
            if (ent.update) ent.update();
        }

        // Remove any entities that we don't want...
        const rebuiltEnts = [];

        for (let i = this._ents.length - 1; i >= 0; i--) {
            const ent = this._ents[i];
            if (this._toRemove.has(ent)) {
                this._toRemove.delete(ent);

                // Cleanup function?
                if (ent.destroy)
                    ent.destroy();
            } else {
                rebuiltEnts.push(ent);
            }
        }

        // We want to keep the original order, for Z sorting.
        rebuiltEnts.reverse();

        this._ents = rebuiltEnts;
    }

    /**
     * draw all entities.
     */
    drawAll() {
        // Call draw on each.
        // Note that we don't support entities being removed in this stage!
        this._ents.forEach(ent => {
            if (ent.draw) ent.draw();
        })
    }

    /**
     * Instantiate a service, automatically adding it to the registry.
     * @template T
     * @param {new() => T} type Service type to instantiate.
     * @param {...any} v Var args.
     */
    instantiateService(type, ...v) {
        const service = new type(this._ctx, this, ...v);
        this._services.set(type, service);
        return service;
    }

    /**
     * Get a service.
     * @template T
     * @param {new() => T} type Service type to get.
     * @returns {T}
     */
    getService(type) {
        return this._services.get(type);
    }

    /**
     * Observe all entities of the given type.
     * @template T
     * @param {new() => T} type Type of entity to observe.
     * @returns {Observable.<T>}
     */
    observeEntitiesOfType(type) {
        return new Observable(subscriber => {
            // Call for all existing entities.
            this.getEntities(type).forEach(ent => {
                subscriber.next(ent);
            })

            // Call for all added entities of the desired type.
            this._entAdded.pipe(
                filter(ent => ent instanceof type)
            ).subscribe(ent => subscriber.next(ent));
        });
    }
}