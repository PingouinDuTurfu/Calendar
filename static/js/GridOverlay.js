import { Event } from './Event.js';
import { currentSession } from "./script.js";

class GridOverlay {
    constructor(id) {
        this._events = [];
        this._id = id;
        $('.grid-overlay-container').append("<div class='grid-overlay' id='grid-overlay-" + this._id + "'></div>");
    }

    newEvent(id, name, note, start, end) {
        this._events.push(new Event(this._id, id, name, note, start, end));
    }


    addEvent(event) {
        this._events.push(event);
    }

    show() {
        this._events.forEach(event => {
            event.render();
        });
    }

    resize() {
        this._events.forEach(event => {
            event.resize();
        });
    }

    delete() {
        $('#grid-overlay-' + this._id).remove();
    }

    getDisplayEvents() {
        if($('#grid-overlay-' + this._id).is(':visible')) {
            return this._events;
        }
        return [];
    }

    showShareForm() {
        $('.after-share-calendar-container').css('display', 'flex');
        $.ajax({
            type: "POST",
            data: {'calendar_id': this._id},
            url: '/api/get_who_has_access',
            success: function (data) {
                if (data['status'] !== 200) {
                    currentSession.displayError(data['status'], true);
                    return
                }
                const already_share = data['already_share'];
                const users = data['users'];
                const toRemove = new Set(already_share);
                const difference = users.filter( x => !toRemove.has(x) );

                const already_share_list = $('.after-share-calendar-container #calendar-already-share');
                already_share_list.empty();
                already_share.forEach(user => {
                    already_share_list.append(`<option value="${user}">${user}</option>`);
                });

                const share_list = $('.after-share-calendar-container #calendar-share');
                share_list.empty();
                difference.forEach(user => {
                    share_list.append(`<option value="${user}">${user}</option>`);
                });
            }
        });
        $('.after-share-calendar-container #share-calendar-id').val(this._id);
    }

    get id() {
        return this._id;
    }


    get events() {
        return this._events;
    }
}

export { GridOverlay };