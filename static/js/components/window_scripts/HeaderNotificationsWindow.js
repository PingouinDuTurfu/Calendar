import { DefaultScriptWindow } from "./DefaultScriptWindow.js";

export default class CreateCalendarsWindow extends DefaultScriptWindow {

    constructor(trigger, window) {
        super(trigger, window)
    }

    async run() {
        if(this.window.find('#header-notification-items-list').children().length === 0)
            this.window.find('#header-notification-empty').css("display", "flex");
        else
            this.window.find('#header-notification-empty').css("display", "none");
    }
}

