import { Body, ContactMaterial, GSSolver, Material, NaiveBroadphase, SplitSolver, World } from "cannon-es";

const WORLD_GRAVITY = 120;

export default class PhysicsService {
    /**
     * Physics service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor() {
        const world = this._world = new World();
        world.gravity.set(0, WORLD_GRAVITY, 0);
        world.broadphase = new NaiveBroadphase();

        const solver = new GSSolver();
        solver.iterations = 5;
        solver.tolerance = 0.1;
        world.solver = new SplitSolver(solver);
        world.solver.iterations = 5;

        // Tweak contact properties.
        // Contact stiffness - use to make softer/harder contacts.
        world.defaultContactMaterial.contactEquationStiffness = 1e7;

        // Stabilization time in number of timesteps.
        world.defaultContactMaterial.contactEquationRelaxation = 5;

        // Player interaction material.
        this._playerPhysMaterial = new Material("physics");
        const playerContactMaterial = new ContactMaterial(this._playerPhysMaterial, this._playerPhysMaterial, {
            friction: 1e4,
            restitution: 0,
            // contactEquationStiffness: 1e20,
            // contactEquationRelaxation: 10,
            frictionEquationRelaxation: 1e-4,
            frictionEquationStiffness: 1e1,
        });
        world.addContactMaterial(playerContactMaterial);

        // Alias.
        this.raycast = this._world.raycastClosest.bind(this._world);
    }

    get playerPhysMaterial() {
        return this._playerPhysMaterial;
    }

    /**
     * Get all contact equations between two bodies.
     * @param {Body} bdA 
     * @param {Body} bdB 
     */
    getContactsBetween(bdA, bdB) {
        return this._world.contacts.filter(cnt => {
            return (cnt.bi === bdA && cnt.bj === bdB)
                || (cnt.bj === bdA && cnt.bi === bdB)
        })
    }

    update() {
        this._world.step(1 / 60, 1 / 60, 10);
    }

    add(body) {
        this._world.addBody(body);
    }

    remove(body) {
        this._world.removeBody(body);
    }
}
