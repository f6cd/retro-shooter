import { Vec3 } from "cannon-es";
import { packetTypes } from "shared";
import EntitySystem from "../entsys/ents";
import NetService from "../lib/net";
import GameContext from "./ctx";
import Player, { DAMAGE_TYPES } from "./player";
import PlayerPuppet from "./puppet";

const MOVEMENT_SEND_HZ = 45;
const HEALTH_LOSS_ON_HIT = 0.4;

export default class PlayerService {
    /**
     * Player service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const netService = entSys.getService(NetService);

        netService.promiseOpen().then(() => {
            const player = entSys.getEntities(Player)[0];

            //
            // Player movement replication.
            //
            const lastSendPosition = new Vec3();
            let lastAngle = 0;

            setInterval(() => {
                if (!player.alive) return;

                // Don't send movement update if we've only moved & rotated a tiny distance!
                if (lastSendPosition.vsub(player.position).almostZero() && Math.abs(lastAngle - player.rotation) < 1e-2) return;
                lastSendPosition.copy(player.position);
                lastAngle = player.rotation;

                netService.send(packetTypes.TYPE_MOVEMENT_SEND.encode(...lastSendPosition.toArray(), lastAngle));
            }, 1000 / MOVEMENT_SEND_HZ);

            //
            // Player health replication.
            //
            netService.attachHandler(packetTypes.TYPE_HIT_PLAYER_RECV, () => player.takeDamage(DAMAGE_TYPES.BULLET, HEALTH_LOSS_ON_HIT));

            const replicateHealth = (newValue) => netService.send(packetTypes.TYPE_UPDATE_HEALTH_SEND.encode(newValue));

            player.tookDamage.subscribe(values => {
                const [damageType, newHealth] = values;
                replicateHealth(newHealth);
            })
            player.respawned.subscribe(() => {
                replicateHealth(player.health);
            })
            player.shotGun.subscribe(
                /**
                 * @param {[Vec3, Vec3, PlayerPuppet|null]} params 
                 */
                (params) => {
                    const [origin, hitPoint, hitPuppet] = params;

                    // Send packet for bullet streak effect.
                    netService.send(packetTypes.TYPE_SHOT.encode(...origin.toArray(), ...hitPoint.toArray()));

                    // If we hit another player...
                    if (hitPuppet) {
                        // Play effect.
                        hitPuppet.playHitEffect();
                        // Send notification that we've hit another player.
                        netService.send(packetTypes.TYPE_HIT_PLAYER_SEND.encode(hitPuppet.userId));
                    }
                })
        })
    }
}