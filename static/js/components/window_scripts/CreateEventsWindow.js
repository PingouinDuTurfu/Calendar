import { currentSession } from "../../script.js";
import { HTTP_STATUS_CODES } from "../../HttpCode.js";
import { DefaultScriptWindow } from "./DefaultScriptWindow.js";

export default class CreateCalendarsWindow extends DefaultScriptWindow{

    constructor(element) {
        super(element)
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

        const shareList = this.element.find('#calendar-share');
        shareList.empty().append(`<option value="null">None</option>`);

        response.users.forEach(user => {
            shareList.append(`<option value="${user}">${user}</option>`);
        });

        const calendar_list = this.element.find('#calendar-list');
        calendar_list.empty().append(`<option value="null">Default</option>`);

        currentSession.calendars.forEach(calendar => {
            calendar_list.append(`<option value="${calendar.id}">${calendar.name}</option>`);
        });
    }
}

