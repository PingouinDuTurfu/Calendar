import { logger } from "../Logger.js";

export class DefaultScriptWindow {

    constructor(trigger, window) {
        this.trigger = trigger;
        this.window = window;
    }

    async run() {
        logger.warn("Missing implementation for this element " + this.window + " with trigger " + this.trigger);
    }

    setTrigger(trigger) {
        this.trigger = trigger;
    }
}