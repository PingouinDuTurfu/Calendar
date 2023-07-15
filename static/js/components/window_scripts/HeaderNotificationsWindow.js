import { DefaultScriptWindow } from "./DefaultScriptWindow.js";

export default class CreateCalendarsWindow extends DefaultScriptWindow{

    constructor(element) {
        super(element)
    }

    async run() {
        if(this.element.find('#header-notification-items-list').children().length === 0)
            this.element.find('#header-notification-empty').css("display", "flex");
        else
            this.element.find('#header-notification-empty').css("display", "none");
    }
}

