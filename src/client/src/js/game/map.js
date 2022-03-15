import { mat4 } from "gl-matrix";
import { PLAYER_UNIT_SCALE } from "../phys/playerBody";
import createGenericBody from "../phys/createGenericBody";
import EntitySystem from "../entsys/ents";
import GameContext from "../game/ctx";
import makeTrimesh from "../phys/getTrimesh";
import MultiTexturedModel from "../lib/model";
import p5, { Vector } from "p5";
import PhysicsService from "../phys/physService";
import Render3DService from "../gfx/render3DService";
import { Vec3 } from "cannon-es";

export default class WorldMap {
    /**
     * World physical map.
     * @param {GameContext} gameCtx Game context.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(gameCtx, entSys) {
        const mapModel = new MultiTexturedModel("../assets/map.obj");

        const physicsService = entSys.getService(PhysicsService);
        const render3DService = entSys.getService(Render3DService);

        mapModel.loadGeometry(
            render3DService.ImageStream,
            new Vector(PLAYER_UNIT_SCALE, -PLAYER_UNIT_SCALE, PLAYER_UNIT_SCALE)
        ).then(() => {
            const trimesh = makeTrimesh(mapModel.geometry);
    
            const body = this.body = createGenericBody(trimesh, 0, Vec3.ZERO);
            body.material = physicsService.playerPhysMaterial;
            body.updateAABB();
            physicsService.add(body);
    
            this._entSys = entSys;
            this._model = mapModel;
        })
    }

    draw() {
        if (!this._model) return;

        const blank = mat4.create();
        // mat4.rotateY(blank, blank, 90*(Math.PI/180));

        this._entSys.getService(Render3DService).submitDraw({
            castShadow: true,
            mat4: blank,
            model: this._model,
        })
    }
}
