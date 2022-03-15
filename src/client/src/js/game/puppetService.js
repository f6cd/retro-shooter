import { Vec3 } from "cannon-es";
import { packetTypes } from "shared";
import EntitySystem from "../entsys/ents";
import { promiseLoadModel } from "../lib/assets";
import NetService from "../lib/net";
import GameContext from "./ctx";
import PlayerPuppet from "./puppet";

export default class PlayerPuppetService {
    /**
     * Puppet service.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const netService = entSys.getService(NetService);

        let puppetMdl = null;
        promiseLoadModel(gameCtx._p, "../assets/player.obj").then(mdl => puppetMdl = mdl);

        const currentPuppets = new Map();

        netService.attachHandler(packetTypes.TYPE_MOVEMENT_RECV, (obj) => {
            const [userId, x, y, z, angle] = obj;

            // Only attempt to move if we have a player model...
            if (!puppetMdl) return;

            // Ensure puppet exists...
            let puppet = currentPuppets.get(userId) || entSys.instantiate(PlayerPuppet, new Vec3(x, y, z), userId, puppetMdl);
            currentPuppets.set(userId, puppet);

            // Move puppet!
            puppet.setTransform(x, y, z, angle - Math.PI / 2);
        });

        netService.attachHandler(packetTypes.TYPE_DISCONNECT, (obj) => {
            const [userId] = obj;
            const puppet = currentPuppets.get(userId);

            if (puppet) {
                entSys.remove(currentPuppets.get(userId));
                currentPuppets.delete(userId);
            }
        });

        netService.attachHandler(packetTypes.TYPE_UPDATE_HEALTH_RECV, (obj) => {
            const [userId, newHealth] = obj;
            let puppet = currentPuppets.get(userId);
            if (puppet) puppet.health = newHealth;
        })
    }
}