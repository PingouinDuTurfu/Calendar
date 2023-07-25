import { logger } from "../Logger.js";
import { DefaultScriptWindow } from "./DefaultScriptWindow.js";

export default class EditEventsWindows extends DefaultScriptWindow {

    constructor(trigger, window) {
        super(trigger, window)
    }

    async run() {
        logger.log("EditEventsWindows");
    }
}

