import p5, { Vector } from "p5";
import GameContext from "./game/ctx";
import EntitySystem from "./entsys/ents";
import SoundService from "./sound/soundService";
import RenderUIService from "./2d/renderUIService";
import DamageScreen from "./2d/damageScreen";
import DeathScreen from "./2d/deathScreen";
import HealthBar from "./2d/healthBar";
import Reticle from "./2d/reticle";
import NetService from "./lib/net";
import PhysicsService from "./phys/physService";
import Render3DService from "./gfx/render3DService";
import RoverCam from "./lib/cam";
import WorldMap from "./game/map";
import RenderFBOService from "./2d/renderFBOService";
import { Vec3 } from "cannon-es";
import Player from "./game/player";
import { PLAYER_HEIGHT } from "./phys/playerBody";
import SpawnPoint from "./game/spawnPoint";
import PlayerPuppetService from "./game/puppetService";
import BulletStreakService from "./game/bulletStreakService";
import HelpText from "./2d/helpText";
import PlayerService from "./game/playerService";
import InputService from "./game/inputService";

/**
 * Setup the world + GFX. Should be called after the canvas has been created.
 * @param {p5} p Processing instance.
 */
async function setup(p) {
    const gameCtx = new GameContext(p);

    const entitySystem = new EntitySystem(gameCtx);

    entitySystem.instantiate(RoverCam);

    const netService = entitySystem.instantiateService(NetService);
    const soundService = entitySystem.instantiateService(SoundService);
    const renderUIService = entitySystem.instantiateService(RenderUIService);
    const physicsService = entitySystem.instantiateService(PhysicsService);
    const render3DService = entitySystem.instantiateService(Render3DService);
    const renderFBOService = entitySystem.instantiateService(RenderFBOService);
    const playerPuppetService = entitySystem.instantiateService(PlayerPuppetService);
    const playerService = entitySystem.instantiate(PlayerService);
    const bulletStreakService = entitySystem.instantiateService(BulletStreakService);
    const inputService = entitySystem.instantiateService(InputService);

    const spawnPoints = [
        new Vector(-5, -0 - PLAYER_HEIGHT, -5),
        new Vector(-20, -0 - PLAYER_HEIGHT, -5),
        new Vector(-32.5, -0 - PLAYER_HEIGHT, -5),
        new Vector(-20, -7.5 - PLAYER_HEIGHT, 54),
        new Vector(37, -8 - PLAYER_HEIGHT, 30),
        new Vector(37, -8 - PLAYER_HEIGHT, 10),
    ];
    spawnPoints.forEach(pos => entitySystem.instantiate(SpawnPoint, pos));

    entitySystem.instantiate(HealthBar);
    entitySystem.instantiate(Reticle);
    entitySystem.instantiate(HelpText);
    entitySystem.instantiate(DeathScreen);
    entitySystem.instantiate(DamageScreen);

    entitySystem.instantiate(WorldMap);
    entitySystem.instantiate(Player);

    entitySystem.getEntities(RoverCam)[0].position = new Vec3(-20, -10, 20);

    p.draw = () => {
        const deltaMs = p.deltaTime / 1000;

        // Pre-draw updates.
        physicsService.update();
        inputService.updateInput();

        entitySystem.updateAll();

        // Draw all entities (creating draw requests).
        entitySystem.drawAll();

        // Invoke systems to handle draw requests.
        render3DService.runDraws();
        bulletStreakService.draw();
        renderFBOService.drawGraphicsFBO(render3DService._g3d);
        renderUIService.runDraws();

        // Send packets created in the 'update' stage (this may yield?).
        netService.flushAndSendMessages();
    };

    // Handle resize.
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        gameCtx.g3d.resizeCanvas(p.windowWidth, p.windowHeight);
    };
}

/**
 * Init sketch.
 * @param {p5} p Processing instance. 
 */
async function createSketch(p) {
    p.setup = () => {
        setup(p);
    }
}

new p5(createSketch)