export class DefaultScriptWindow {

    constructor(trigger, window) {
        this.trigger = trigger;
        this.window = window;
    }

    async run() {
        console.log("Missing implementation for this element " + this.window + " with trigger " + this.trigger);
    }
}