import { Howl } from "howler";
import { Subject } from "rxjs";
import getRandomInArray from "../lib/getRandomInArray";

const ALL_SOUND_VOLUME = 0.55;

export default class SoundGroup {
    /**
     * Sound group.
     * @param {Array.<string>} soundList List of relative paths.
     */
    constructor(soundList) {
        /** @type {Array.<Howl>} */
        this.loadedSounds = soundList.map(relativePath => {
            return new Howl({
                src: [relativePath],
            })
        })

        /** @typedef {Array.<Howl, Number>} PlayEntry */
        /** @type {PlayEntry} */
        this._currentlyPlaying = null;
        /** @type {PlayEntry} */
        this._lastPlayed = null;

        this.PlayedSound = new Subject();
    }

    /**
     * Play a random sound file in this group.
     */
    play() {
        if (this.loadedSounds.length <= 0) return;

        this.stop();

        /** @type {Howl} */
        let sound;

        do {
            sound = getRandomInArray(this.loadedSounds);
        } while (this.loadedSounds.length > 1 && sound === this._lastPlayed ? this._lastPlayed[0] : null);

        const id = sound.play();
        sound.volume(ALL_SOUND_VOLUME, id);
        this._currentlyPlaying = this._lastPlayed = [sound, id];

        this.PlayedSound.next(sound);
    }

    /**
     * Stop whatever's playing.
     */
    stop() {
        if (this._currentlyPlaying) {
            this._currentlyPlaying[0].stop(this._currentlyPlaying[1]);
            this._currentlyPlaying = null;
        }
    }
}
