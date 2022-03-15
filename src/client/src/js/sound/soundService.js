import { packetTypes } from "shared";
import SoundGroup from "./soundGroup";
import Player, { DAMAGE_TYPES } from "../game/player";
import PlayerPuppet from "../game/puppet";
import { Howl } from "howler";
import { PLAYER_UNIT_SCALE } from "../phys/playerBody";
import EntitySystem from "../entsys/ents";
import NetService from "../lib/net";

export default class SoundService {
    /**
     * Sound service.
     * @param {EntitySystem} entSys Entity system.
     */
    constructor(_, entSys) {
        this._entSys = entSys;

        this.hurtSounds = new SoundGroup([
            "../assets/sound/player/pain1.wav",
            "../assets/sound/player/pain2.wav",
            "../assets/sound/player/pain3.wav",
            "../assets/sound/player/pain4.wav",
            // "../assets/sound/player/pain5.wav",
            // "../assets/sound/player/pain6.wav",
        ]);
        this.deathSounds = new SoundGroup([
            "../assets/sound/player/death1.wav",
            "../assets/sound/player/death2.wav",
            "../assets/sound/player/death3.wav",
            "../assets/sound/player/death4.wav",
            "../assets/sound/player/death5.wav",
        ]);
        this.impactSounds = new SoundGroup([
            "../assets/sound/player/land.wav",
            // "../assets/sound/player/land2.wav",
        ]);
        this.shootSounds = new SoundGroup([
            "../assets/sound/weapons/rocket1i.wav",
        ]);
        this.walkSounds = new SoundGroup([
            "../assets/sound/player/step/pl_step1.wav",
            "../assets/sound/player/step/pl_step2.wav",
            "../assets/sound/player/step/pl_step3.wav",
            "../assets/sound/player/step/pl_step4.wav",
        ]);
        this.jumpSounds = new SoundGroup([
            "../assets/sound/player/plyrjmp8.wav",
        ]);
        this.burnSounds = new SoundGroup([
            "../assets/sound/player/h2odeath.wav",
        ]);
        this.respawnSounds = new SoundGroup([
            "../assets/sound/player/respawn.wav",
        ]);

        const broadcastSystems = [this.hurtSounds, this.deathSounds, this.impactSounds, this.shootSounds, this.jumpSounds];
        const availableSounds = broadcastSystems.flatMap(sys => sys.loadedSounds);

        broadcastSystems.forEach(system => {
            /**
             * Sound played callback.
             * @param {SoundFile} sound Player sound.
             */
            system.PlayedSound.subscribe((sound) => {
                const broadcastIndex = availableSounds.findIndex((val) => val === sound);
                if (broadcastIndex !== -1)
                    entSys.getService(NetService).send(packetTypes.TYPE_PLAY_SOUND_SEND.encode(broadcastIndex));
            });
        });

        entSys.getService(NetService).attachHandler(packetTypes.TYPE_PLAY_SOUND_RECV, (obj) => {
            const [userId, soundIndex] = obj;

            const soundObj = availableSounds[soundIndex];

            const targetPuppet = entSys.getEntities(PlayerPuppet).filter(ent => ent.userId === userId)[0];

            // Oh no!!! Target puppet doesn't exist.
            // Player has disconnected (unlikely) or some other networking mumbo jumbo has happened...
            if (!targetPuppet) return;

            const playId = soundObj.play();
            soundObj.pos(...targetPuppet.position.toArray(), playId);
            soundObj.volume(0.5, playId);
            soundObj.pannerAttr({
                panningModel: 'HRTF',
                refDistance: (64) * PLAYER_UNIT_SCALE,
                rolloffFactor: 0.3,
                distanceModel: 'exponential'
            }, playId);
        });

        //
        // Local player sounds
        //
        entSys.observeEntitiesOfType(Player).subscribe(player => {
            this.setupBreathingSound(player);
            this.setupHurtSounds(player);
            this.setupShootSounds(player);
            this.setupStepSounds(player);
            this.setupRespawnSounds(player);
            this.setupJumpSounds(player);
            this.setupImpactSounds(player);
        })
    }

    /**
     * @param {Player} player 
     */
    setupBreathingSound(player) {
        const PLAY_BREATHING_THRESHOLD = 0.2;
        const FADE_INTERVAL = 500;

        const breatheSound = new Howl({
            src: ["../assets/sound/player/breathe1.wav"]
        });
        breatheSound.volume(0);
        const playId = breatheSound.play();
        breatheSound.loop(true, playId);

        const update = () => {
            const newVol = player.health > PLAY_BREATHING_THRESHOLD ? 0 : 0.06;
            breatheSound.fade(breatheSound.volume(playId), newVol, FADE_INTERVAL - 1, playId);
        }

        setInterval(update, FADE_INTERVAL);
    }

    /**
     * @param {Player} player 
     */
    setupHurtSounds(player) {
        player.tookDamage.subscribe(values => {
            const [damageType,] = values;
            const alive = player.alive;

            if (alive) {
                this.hurtSounds.play();
            } else {
                if (damageType === DAMAGE_TYPES.BULLET) {
                    this.deathSounds.play();
                } else if (damageType == DAMAGE_TYPES.BURN) {
                    this.deathSounds.play();
                    this.burnSounds.play();
                }
            }
        });
    }

    /**
     * @param {Player} player 
     */
    setupShootSounds(player) {
        player.shotGun.subscribe(() => {
            this.shootSounds.play();
        });
    }

    /**
     * @param {Player} player 
     */
    setupStepSounds(player) {
        // player._body.
        player.footstep.subscribe(() => {
            this.walkSounds.play();
        })
    }

    /**
     * @param {Player} player 
     */
    setupRespawnSounds(player) {
        player.respawned.subscribe(() => {
            this.respawnSounds.play();
        })
    }

    /**
     * @param {Player} player 
     */
    setupJumpSounds(player) {
        player.jumped.subscribe(() => {
            this.jumpSounds.play();
        })
    }

    /**
     * @param {Player} player 
     */
    setupImpactSounds(player) {
        player.impacted.subscribe(() => {
            this.impactSounds.play();
        })
    }
}