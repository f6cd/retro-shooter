import { RaycastResult, Vec3 } from "cannon-es";
import p5, { Vector } from "p5";
import RoverCam from "../lib/cam";
import { makePlayerBody, PLAYER_RADIUS, PLAYER_UNIT_SCALE } from "../phys/playerBody";
import GameContext from "./ctx";
import SpawnPoint from "./spawnPoint";
import { Howler } from "howler";
import getRandomInArray from "../lib/getRandomInArray";
import EntitySystem from "../entsys/ents";
import PhysicsService from "../phys/physService";
import WorldMap from "./map";
import PlayerPuppet from "./puppet";
import getTimeMs from "../lib/getTimeMs";
import { Subject } from "rxjs";

const PLAYER_CAMERA_HEIGHT = PLAYER_UNIT_SCALE * 64;

const LOCAL_PLAYER_COLLISION_GROUP = 2;
const CAST_DISTANCE = 4096 * PLAYER_UNIT_SCALE;

const HEALTH_RECOVERY_RATE = 2e4;

export const TIME_TO_RESPAWN = 3000;

const FOOTSTEP_SOUND_INTERVAL = 220;

const SHOOT_RATE = 50;

export const DAMAGE_TYPES = {
    NULL: 0,
    BULLET: 1,
    BURN: 2,
}

export default class Player {
    /**
     * Local player ent.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        this._gameCtx = gameCtx;
        this._entSys = entSys;

        this._worldMap = entSys.getEntities(WorldMap)[0];
        this._camera = entSys.getEntities(RoverCam)[0];

        const physicsService = entSys.getService(PhysicsService);
        this._physicsService = physicsService;

        // Events.
        this.tookDamage = new Subject();
        this.respawned = new Subject();
        this.shotGun = new Subject();
        this.died = new Subject();
        this.healthChanged = new Subject();
        this.footstep = new Subject();
        this.jumped = new Subject();
        this.impacted = new Subject();

        const body = makePlayerBody(physicsService.playerPhysMaterial, new Vector());
        body.collisionFilterGroup = LOCAL_PLAYER_COLLISION_GROUP;
        physicsService.add(body);
        this._body = body;

        // Shooting.
        window.addEventListener('click', () => this.shoot());

        // Movement vectors, player controls.
        this._forward = new Vec3();
        this._right = new Vec3();
        this._wishVel = new Vec3();
        this._wishDir = new Vec3();
        this._headingVel = new Vec3();

        // Ready!
        this.respawn();

        // Land sounds.
        body.addEventListener("collide", event => {
            const { contact } = event;

            const vl = contact.getImpactVelocityAlongNormal();

            // Min impact velocity.
            if (vl > 47)
                this.impacted.next();
        });
    }

    set health(value) {
        this.healthChanged.next(value);
        this._health = value;
    }

    get alive() {
        return this._health > 0;
    }

    get health() {
        return this._health;
    }

    get onFloor() {
        // Loop through all contacts with this player body and the world.
        // Look for the first contact that we deem "close enough" to straight up.
        return this._physicsService.getContactsBetween(this._body, this._worldMap.body)
            .some(contact => {
                return contact.ni.dot(Vec3.UNIT_Y) > 0.6;
            });
    }

    takeDamage(damageType, amount) {
        if (!this.alive) return;

        this.health -= amount;

        // Play sound...
        if (!this.alive) {
            setTimeout(() => this.respawn(), TIME_TO_RESPAWN);
            this._body.position = new Vec3(0, -1000000, 0);
            this._body.sleep();

            this.died.next();
        }

        this.tookDamage.next([damageType, this.health]);
    }

    /**
     * Respawn this player.
     */
    respawn() {
        const spawnPos = getRandomInArray(this._entSys.getEntities(SpawnPoint)).pos;

        this.health = 1;
        this._body.position = new Vec3(spawnPos.x, spawnPos.y, spawnPos.z);
        this._body.wakeUp();

        this.respawned.next();
    }

    /**
     * Shoot a bullet.
     */
    shoot() {
        if (getTimeMs() - (this._lastShootTime || 0) <= SHOOT_RATE) return;
        this._lastShootTime = getTimeMs();

        // Shooting a bullet.
        const result = new RaycastResult();

        const camCentre = this._camera.position;
        const origin = camCentre;
        const end = camCentre.vadd(this._camera.forward.scale(CAST_DISTANCE));

        this._physicsService.raycast(origin, end, { skipBackfaces: false, collisionFilterMask: 1 }, result);

        // Send shot to server.
        const hitPoint = !result.hitPointWorld.almostZero() ? result.hitPointWorld : end;

        // Highlight hit puppet.
        const hitPuppet = this._entSys.getEntities(PlayerPuppet).find((pP) => pP.body === result.body)

        this.shotGun.next([this._camera.position, hitPoint, hitPuppet]);
    }

    /**
     * Update player movement.
     * @param {p5} p Processing instance.
     */
    _updateMovement() {
        const MAX_SPEED = 80;
        const ACCEL_VALUE = 10;

        // Compute forward vector. Only rotation about the Y axis!
        this._forward.set(Math.cos(-this._camera.yRotation), 0, Math.sin(-this._camera.yRotation));
        // Compute the right vector. Use constant up vector.
        this._forward.cross(Vec3.UNIT_Y, this._right);

        const playerVelocity = this._body.velocity;
        const wishVel = this._wishVel;
        wishVel.setZero();

        if (this.alive) {
            wishVel.addScaledVector(this._headingVel.z, this._forward, wishVel);
            wishVel.addScaledVector(this._headingVel.x, this._right, wishVel);

            if (this._jumpFlag) {
                this._jumpFlag = false;
                playerVelocity.addScaledVector(-1 * 60, Vec3.UNIT_Y, playerVelocity);
                this.jumped.next();
            }
        }

        this._wishDir.copy(wishVel).normalize();

        // Limit to max sped.
        let wishSpeed = wishVel.length();
        if (wishSpeed > MAX_SPEED) {
            wishVel.scale(MAX_SPEED / wishSpeed, wishVel);
            wishSpeed = MAX_SPEED;
        }

        // Drag?
        wishSpeed *= 0.7;

        const currentSpeed = this._wishDir.dot(playerVelocity);
        const addSpeed = wishSpeed - currentSpeed;
        if (addSpeed > 0) {
            const dt = this._gameCtx._p.deltaTime / 1000;
            let accelSpeed = ACCEL_VALUE * wishSpeed * dt;

            if (accelSpeed > addSpeed)
                accelSpeed = addSpeed;

            playerVelocity.addScaledVector(accelSpeed, this._wishDir, playerVelocity);
        }
    }

    /**
     * Velocity heading vector.
     * @param {Vec3} vel Velocity heading vector, relative to the world.
     */
    setVelocityVector(vel) {
        this._headingVel.copy(vel);
    }

    /**
     * Request that the player jumps.
     */
    jump() {
        this._jumpFlag = true;
    }

    /**
     * Update player movement.
     */
    update() {
        // Update movement.
        this._updateMovement();

        // Footstep sounds.
        if (this.onFloor && this._body.velocity.length() > 0.01 && this._wishVel.length() > 0.01) {
            if (!this._playFootstepInterval) {
                const triggerFootstep = () => this.footstep.next();
                triggerFootstep();
                this._playFootstepInterval = setInterval(triggerFootstep, FOOTSTEP_SOUND_INTERVAL);
            }
        } else {
            if (this._playFootstepInterval) {
                clearInterval(this._playFootstepInterval);
                delete this["_playFootstepInterval"];
            }
        }

        const p = this._gameCtx._p;
        if (this.alive) {
            // Update health!
            // Clamp in range 0 <= x <= 1.
            this.health = Math.min(this.health + p.deltaTime / HEALTH_RECOVERY_RATE, 1);
            this.health = Math.max(this.health, 0);

            // Update audio listener.
            Howler.pos(...this._body.position.toArray());
            const dir = this._camera.forward.vmul(new Vec3(1, 0, 1));
            dir.normalize();
            Howler.orientation(...dir.toArray(), 0, 1, 0);

            // Lava death hack.
            // TODO: Neaten this!!
            if (this._body.position.y > (32 + 8) * PLAYER_UNIT_SCALE && this.onFloor) {
                this.takeDamage(DAMAGE_TYPES.BURN, 9999);
            }

            // Stop from falling out of the world...
            if (this._body.position.y > 512 * PLAYER_UNIT_SCALE) {
                this.takeDamage(DAMAGE_TYPES.NULL, 9999);
            }
        }
    }

    /**
     * Draw the object to the screen.
     * @param {p5} p Processing instance.
     */
    draw() {
        const pos = this._body.position;
        const floorHeight = pos.y + PLAYER_RADIUS;
        this._camera.position.set(pos.x, floorHeight - PLAYER_CAMERA_HEIGHT, pos.z);
    }

    /**
     * Kill and respawn this player.
     */
    reset() {
        if (!this.alive) return;
        this.takeDamage(DAMAGE_TYPES.NULL, 9999999);
    }

    get position() {
        return this._body.position;
    }

    get rotation() {
        return this._camera.yRotation;
    }
}
