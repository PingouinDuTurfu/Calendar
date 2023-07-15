import { currentSession } from "./script.js";

class Event {
    constructor(gridOverlayId, id, name, note, start, end) {
        this._gridOverlayId = gridOverlayId;
        this._id = id;
        this._name = name;
        this._note = note;
        this._start = start;
        this._end = end;
    }

    render() {
        $('#grid-overlay-' + this._gridOverlayId).append(
            `<div class='event' id='event-${this._id}'>
                <div class="title">${this._name}</div>
                <div class="note">${this._note}</div>
            </div>`
            );
        this.resize();
    }

    resize() {
        $('#event-' + this._id).css(this.getStyle());
    }

    getStyle() {
        const start_pos = currentSession.gridHeightUnit * (this._start.getHours() + this._start.getMinutes() / 60 + this._start.getSeconds() / 3600);
        const end_pos = currentSession.gridHeightUnit * (this._end.getHours() + this._end.getMinutes() / 60 + this._end.getSeconds() / 3600);
        return {
            'top':`${start_pos}px`,
            'height':`${end_pos - start_pos}px`,
            'left':`${currentSession.gridWidthUnit * ((7 - currentSession.currentDate.getDay() + this._start.getDay()) % 7) + 10}px`,
            'width':`${currentSession.gridWidthUnit - 20}px`
        };
    }

    showEditForm() {
        $('.edit-event-container').css('display', 'flex');
        $('.edit-event-container #edit-event-title').val(this._name);
        const startLocaleDateString = currentSession.isoStringToLocaleDateString(this._start);
        const endLocaleDateString = currentSession.isoStringToLocaleDateString(this._end);
        $('.edit-event-container #edit-event-date').val(startLocaleDateString.slice(0, 10));
        $('.edit-event-container #edit-event-start-time').val(startLocaleDateString.slice(11, 16));
        $('.edit-event-container #edit-event-end-time').val(endLocaleDateString.slice(11, 16));
        $('.edit-event-container #edit-event-note').val(this._note);
        $('.edit-event-container #edit-event-id').val(this._id);

        const calendar_list = $('.edit-event-container #edit-event-calendar');
        calendar_list.empty();
        if(this._gridOverlayId !== this._id)
            calendar_list.append(`<option value="${this._gridOverlayId}">${currentSession.calendars.find(calendar => calendar.id === this._gridOverlayId).name}</option>`);
        calendar_list.append(`<option value="Default">Default</option>`);
        currentSession.calendars.forEach(calendar => {
            if(calendar.id !== this._gridOverlayId)
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
        $('.after-share-event-container #edit-event-id').val(this._id);
    }


    get gridOverlayId() {
        return this._gridOverlayId;
    }

    get id() {
        return this._id;
    }

    get start() {
        return this._start;
    }

    get end() {
        return this._end;
    }
}

export { Event };