import { currentSession } from "./script.js";
import {logger} from "./components/Logger.js";
import {htmlBuilder} from "./components/HtmlBuilder.js";
import {TYPE_GRID_OVERLAY} from "./GridOverlay.js";

class Event {
    constructor(parentGrid, id, name, note, start, end) {
        this.id = id;

        this.name = name;
        this.note = note;
        this.start = start;
        this.end = end;

        this.parentGrid = parentGrid;
        this.element = $(
            `<div class='event' id='event-${this.id}'>
                <div class="title">${this.name}</div>
                <div class="note">${this.note}</div>
            </div>`
        )

        this.parentGrid.append(this.element);

        htmlBuilder.addWindowListener(this.element, "window-edit-event", undefined, TYPE_GRID_OVERLAY.EVENT);

        this.resize();
    }

    resize() {
        this.element.css(this.getStyle());
    }

    getStyle() {
        const start_pos = currentSession.gridHeightUnit * (this.start.getHours() + this.start.getMinutes() / 60 + this.start.getSeconds() / 3600);
        const end_pos = currentSession.gridHeightUnit * (this.end.getHours() + this.end.getMinutes() / 60 + this.end.getSeconds() / 3600);
        return {
            'top':`${start_pos}px`,
            'height':`${end_pos - start_pos}px`,
            'left':`${currentSession.gridWidthUnit * ((7 - currentSession.currentDate.getDay() + this.start.getDay()) % 7) + 10}px`,
            'width':`${currentSession.gridWidthUnit - 20}px`
        };
    }

    showEditForm() {
        $('.edit-event-container').css('display', 'flex');
        $('.edit-event-container #edit-event-title').val(this.name);
        const startLocaleDateString = currentSession.isoStringToLocaleDateString(this.start);
        const endLocaleDateString = currentSession.isoStringToLocaleDateString(this.end);
        $('.edit-event-container #edit-event-date').val(startLocaleDateString.slice(0, 10));
        $('.edit-event-container #edit-event-start-time').val(startLocaleDateString.slice(11, 16));
        $('.edit-event-container #edit-event-end-time').val(endLocaleDateString.slice(11, 16));
        $('.edit-event-container #edit-event-note').val(this.note);
        $('.edit-event-container #edit-event-id').val(this.id);

        const calendar_list = $('.edit-event-container #edit-event-calendar');
        calendar_list.empty();
        if(this.gridOverlayId !== this.id)
            calendar_list.append(`<option value="${this.gridOverlayId}">${currentSession.calendars.find(calendar => calendar.id === this.gridOverlayId).name}</option>`);
        calendar_list.append(`<option value="Default">Default</option>`);
        currentSession.calendars.forEach(calendar => {
            if(calendar.id !== this.gridOverlayId)
                calendar_list.append(`<option value="${calendar.id}">${calendar.name}</option>`);
        });
    }

    showShareForm() {
        $('.after-share-event-container').css('display', 'flex');
        $.ajax({
            type: "POST",
            url: '/api/get_users_list',
            success: function (data) {
                if (data['status'] !== 200) {
                    currentSession.displayError(data['status'], true);
                    return
                }
                const share_list = $('.after-share-event-container #event-share');
                share_list.empty();
                data['users'].forEach(user => {
                    share_list.append(`<option value="${user}">${user}</option>`);
                });
            }
        });
        $('.after-share-event-container #edit-event-id').val(this.id);
    }


    getGridOverlayId() {
        return this.gridOverlayId;
    }

    getId() {
        return this.id;
    }

    getStart() {
        return this.start;
    }

    getEnd() {
        return this.end;
    }
}

export { Event };