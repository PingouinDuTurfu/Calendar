import { currentSession } from "../../script.js";
import { HTTP_STATUS_CODES } from "../../HttpCode.js";
import { DefaultScriptWindow } from "./DefaultScriptWindow.js";


export default class CreateCalendarsWindow extends DefaultScriptWindow{

    constructor(trigger, window) {
        super(trigger, window)
    }

    async run() {
        const response = await $.ajax({
            type: "POST",
            url: '/api/get_users_list'
        });

        if (response.status !== HTTP_STATUS_CODES.OK) {
            currentSession.displayError(response.status, true);
            return;
        }

        const shareList = this.window.find('#calendar-share');
        shareList.empty().append(`<option value="null">---</option>`);

        response.users.forEach(user => {
            shareList.append(`<option value="${user}">${user}</option>`);
        });
    }
}

