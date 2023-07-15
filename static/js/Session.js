import {GridOverlay} from "./GridOverlay.js";
import {Event} from "./Event.js";
import { HTTP_STATUS_CODES_REVERSE } from "./HttpCode.js";

const week_days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

class Session {
    constructor() {
        this._calendars = [];
        this._calendarsShared = [];
        this._awaitingCalendars = [];
        this._awaitingEvents = [];

        this._eventsNotInCalendar = [];
        this._eventsInSharedCalendar = [];
        this._eventsOwn = [];

        this._listGridOverlays = [];
        this._currentDate = new Date();
        this._currentDate.setHours(0, 0, 0, 0);
        this._gridHeightUnit = 0;
        this._gridWidthUnit = 0;

        this._alreadyBindButton = [];
    }

    createSession() {
        const url = '/api/get_data';
        $.ajax({
            url: url,
            type: 'POST',
            async: false,
            success: (data) => {
                this._calendars = data['calendars'];
                this._calendarsShared = data['calendars_shared'];
                this._awaitingCalendars = data['awaiting_calendars'];
                this._awaitingEvents = data['awaiting_events'];
            }
        });
    }

    updateWeek() {
        const url = '/api/get_week_data';
        const data = {
            'start': this._currentDate.valueOf(),
            'end': this._currentDate.addDays(7).valueOf()
        }
        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            async: false,
            success: (data) => {
                this._eventsNotInCalendar = data['events_not_in_calendar'];
                this._eventsInSharedCalendar = data['events_in_shared_calendar'];
                this._eventsOwn = data['events_own'];

                this.buildLeftPanel();
                this.buildGridOverlays();
                this.displayHeaderMonthAndYear();
                this.displayWeekDaysHeader();
            }
        });
    }

    addEvent(event) {
        if(event['start'] < this._currentDate.valueOf() || event['start'] > this._currentDate.addDays(7).valueOf()
            || event['end'] < this._currentDate.valueOf() || event['end'] > this._currentDate.addDays(7).valueOf())
            return;
        this._eventsOwn.push(event);
        this._eventsNotInCalendar.push(event);

        this.addEventToLeftPanel(event);
        this.updateLeftPanelButton();


        const grid_overlay = new GridOverlay(event['id']);
        this._listGridOverlays.push(grid_overlay);
        const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        grid_overlay.addEvent(newEvent);
        newEvent.render();

        this.updateGridOverlaysEventsButton();
        this.displayConflicts();
    }

    addEventToCalendar(event) {
        if(event['start'] < this._currentDate.valueOf() || event['start'] > this._currentDate.addDays(7).valueOf()
            || event['end'] < this._currentDate.valueOf() || event['end'] > this._currentDate.addDays(7).valueOf())
            return;
        this._eventsOwn.push(event);

        const grid_overlay = new GridOverlay(event['calendar']);
        this._listGridOverlays.push(grid_overlay);
        const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        grid_overlay.addEvent(newEvent);
        newEvent.render();

        this.displayConflicts();
    }

    addEventToSharedCalendar(event) {
        if(event['start'] < this._currentDate.valueOf() || event['start'] > this._currentDate.addDays(7).valueOf()
            || event['end'] < this._currentDate.valueOf() || event['end'] > this._currentDate.addDays(7).valueOf())
            return;
        this._eventsInSharedCalendar.push(event);

        const grid_overlay = new GridOverlay(event['calendar']);
        this._listGridOverlays.push(grid_overlay);
        const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        grid_overlay.addEvent(newEvent);
        newEvent.render();

        this.displayConflicts();
    }

    addCalendar(calendar) {
        this._calendars.push(calendar);

        this.addCalendarToLeftPanel(calendar);
        this.updateLeftPanelButton();

        const grid_overlay = new GridOverlay(calendar['id']);
        this._listGridOverlays.push(grid_overlay);
    }

    addSharedCalendar(calendar) {
        this._calendarsShared.push(calendar);

        this.addCalendarSharedToLeftPanel(calendar);
        this.updateLeftPanelButton();

        const grid_overlay = new GridOverlay(calendar['id']);
        this._listGridOverlays.push(grid_overlay);
    }

    removeEvent(event_id) {
        const event = this._eventsOwn.find(event => event['id'] === event_id);
        this._eventsOwn.splice(this._eventsOwn.indexOf(event), 1);
        this._eventsNotInCalendar.splice(this._eventsNotInCalendar.indexOf(event), 1);
        this._listGridOverlays.splice(this._listGridOverlays.indexOf(this._listGridOverlays.find(grid_overlay => grid_overlay.id === event_id)), 1);
        $(`.left-panel-container #left-${event_id}`).remove();
        $(`.calendar-body-grid #grid-overlay-${event_id}`).remove();
        this.updateLeftPanelButton();
        this.displayConflicts();
        this.updateGridOverlaysEventsButton();
    }

    removeCalendar(calendar_id, isShared = false) {
        let calendar;
        if(isShared) {
            calendar = this._calendarsShared.find(calendar => calendar['id'] === calendar_id);
            this._calendarsShared.splice(this._calendarsShared.indexOf(calendar), 1);
        } else {
            calendar = this._calendars.find(calendar => calendar['id'] === calendar_id);
            this._calendars.splice(this._calendars.indexOf(calendar), 1);
        }
        this._listGridOverlays.splice(this._listGridOverlays.indexOf(this._listGridOverlays.find(grid_overlay => grid_overlay.id === calendar_id)), 1);
        $(`.left-panel-container #left-${calendar_id}`).remove();
        $(`.calendar-body-grid #grid-overlay-${calendar_id}`).remove();
        this.updateLeftPanelButton();
        this.displayConflicts();
        this.updateGridOverlaysEventsButton();
    }

    eventNotificationUpdate (event_id, accepted = true) {
        const event = this._awaitingEvents.find(event => event['id'] === event_id);
        this._awaitingEvents.splice(this._awaitingEvents.indexOf(event), 1);
        $('#notification-event-' + event_id).remove();
        if(this._awaitingEvents.length === 0 && this._awaitingCalendars.length === 0) {
            $('.header .header-notification-content').removeClass('active');
            $('.header-notification-overlay').hide();
        }
        if(accepted)
            this.addEvent(event);
    }

    calendarNotificationUpdate(calendar, accepted = true) {
        const calendar_item = this._awaitingCalendars.find(calendar => calendar['id'] === calendar['id']);
        this._awaitingCalendars.splice(this._awaitingCalendars.indexOf(calendar_item), 1);
        $('#notification-calendar-' + calendar['id']).remove();
        if(this._awaitingEvents.length === 0 && this._awaitingCalendars.length === 0) {
            $('.header .header-notification-content').removeClass('active');
            $('.header-notification-overlay').hide();
        }
        if(accepted)
            this.addSharedCalendar(calendar);
    }

    buildLeftPanel() {
        $('.events-list-container').empty();
        $('.calendars-list-container').empty();
        $('.calendars-shared-list-container').empty();

        this._eventsNotInCalendar.forEach(event => {
            if(!this._awaitingEvents.some(e => e['id'] === event['id']))
                this.addEventToLeftPanel(event);
        });

        this._calendars.forEach(calendar => {
            this.addCalendarToLeftPanel(calendar);
        });

        this._calendarsShared.forEach(calendar => {
            this.addCalendarSharedToLeftPanel(calendar);
        });

        this.updateLeftPanelButton();
    }

    buildNotificationsBox() {
        const notifications_box = $('#header-notification-items-list');
        notifications_box.empty();

        if(this._awaitingCalendars.length > 0 || this._awaitingEvents.length > 0) {
            $('.header .header-notification-content').addClass('active');
        }

        this._awaitingCalendars.forEach(calendar => {
            this.addNotificationItem("notification-calendar", calendar['id'], calendar['name']);
        });
        
        this._awaitingEvents.forEach(event => {
            this.addNotificationItem("notification-event", event['id'], event['name']);
        });

        this.updateNotificationsButton();
    }

    addEventToLeftPanel(event) {
        const events_container = $('.events-list-container');
        events_container.append(`
            <div class="block event" id="left-${event['id']}">
                <div class="view">
                    <img class="block-show-view-button event-show-view-button" index="${event["id"]}" src="./static/svg/show_view.svg" alt="view">
                    <img class="block-hide-view-button event-hide-view-button" index="${event["id"]}" src="./static/svg/hide_view.svg" alt="view">
                </div>
                <div class="block-title event-title">
                    ${event['name']}
                </div>
                <div class="edit">
                    <img class="event-edit-button" index="${event["id"]}" src="./static/svg/edit.svg" alt="edit">
                </div>
                <div class="delete">
                    <img class="event-delete-button" index="${event["id"]}" src="./static/svg/bin.svg" alt="delete">
                </div>
                <div class="share">
                    <img class="event-share-button" index="${event["id"]}" src="./static/svg/paper_plane.svg" alt="share">
                </div>
            </div>
        `);
    }

    addCalendarToLeftPanel(calendar) {
        const calendars_container = $('.calendars-list-container');
        calendars_container.append(`
            <div class="block calendar" id="left-${calendar['id']}">
                <div class="view">
                    <img class="block-show-view-button calendar-show-view-button" index="${calendar["id"]}" src="./static/svg/show_view.svg" alt="view">
                    <img class="block-hide-view-button calendar-hide-view-button" index="${calendar["id"]}" src="./static/svg/hide_view.svg" alt="view">
                </div>
                <div class="block-title calendar-title">
                    ${calendar['name']}
                </div>
                <div class="edit">
                    <img class="calendar-edit-button" index="${calendar["id"]}" src="./static/svg/edit.svg" alt="edit">
                </div>
                <div class="delete">
                    <img class="calendar-delete-button" index="${calendar["id"]}" src="./static/svg/bin.svg" alt="delete">
                </div>
                <div class="share">
                    <img class="calendar-share-button" index="${calendar["id"]}" src="./static/svg/paper_plane.svg" alt="share">
                </div>
            </div>
        `);
    }

    addCalendarSharedToLeftPanel(calendar) {
        const calendars_shared_container = $('.calendars-shared-list-container');
        calendars_shared_container.append(`
            <div class="block calendar-shared" id="left-${calendar['id']}">
                <div class="view">
                    <img class="block-show-view-button calendar-show-view-button" index="${calendar["id"]}" src="./static/svg/show_view.svg" alt="view" style="">
                    <img class="block-hide-view-button calendar-hide-view-button" index="${calendar["id"]}" src="./static/svg/hide_view.svg" alt="view" style="">
                </div>
                <div class="block-title calendar-title">
                    ${calendar['name']}
                </div>
                <div class="delete">
                    <img class="calendar-delete-button" index="${calendar["id"]}" src="./static/svg/bin.svg" alt="delete">
                </div>
            </div>
        `);
    }

    updateLeftPanelButton() {
        $('.block-show-view-button, .block-hide-view-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const parent = $(element).parent();
                parent.find('.block-hide-view-button').toggle();
                parent.find('.block-show-view-button').toggle();
                $('#grid-overlay-' + $(element).attr('index')).toggle();
                this.displayConflicts();
            });
        });

        $('.event-delete-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const event_id = $(element).attr('index');
                $.ajax({
                    type: "POST",
                    url: '/api/delete_event',
                    data: {'event_id': event_id},
                    success: (data) => {
                        if (data['status'] !== 200) {
                            this.displayError(data['status'], true);
                            return
                        }
                        this.removeEvent(event_id);
                    }
                });
            });
        });

        $('.calendar-delete-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const calendar_id = $(element).attr('index');
                const grid_overlay = this._listGridOverlays.find(g => g.id === parseInt(calendar_id));

                if(grid_overlay.events.length > 0)
                    if(!confirm('Are you sure you want to delete this calendar ? All events will be deleted too.'))
                        return;

                $.ajax({
                    type: "POST",
                    url: '/api/delete_calendar',
                    data: {'calendar_id': calendar_id},
                    success: (data) => {
                        if (data['status'] !== 200) {
                            this.displayError(data['status'], true);
                            return
                        }
                        this.removeCalendar(calendar_id);
                    }
                });
            });
        });

        $('.event-edit-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const event_id = $(element).attr('index');
                const event = this._listGridOverlays.find(g => g.events.find(e => e.id === parseInt(event_id))).events.find(e => e.id === parseInt(event_id));
                event.showEditForm();
            });
        });

        $('.event-share-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const event_id = $(element).attr('index');
                const event = this._listGridOverlays.find(g => g.events.find(e => e.id === parseInt(event_id))).events.find(e => e.id === parseInt(event_id));
                event.showShareForm();
            });
        });

        $('.calendar-share-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const calendar_id = $(element).attr('index');
                const calendar = this._listGridOverlays.find(g => g.id === parseInt(calendar_id));
                calendar.showShareForm();
            });
        });
    }

    updateNotificationsButton() {
        $('.notification-item-accept-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const notification_item = $(element).parent();
                const [_, item_type, notification_id] = notification_item.attr('id').split('-');
                if(item_type === 'event') {
                    $.ajax({
                        type: "POST",
                        url: '/api/accept_event',
                        data: {'event_id': notification_id},
                        success: (data) => {
                            if(data['status'] !== 200) {
                                this.displayError(data['status'], true);
                                return;
                            }
                            this.eventNotificationUpdate(parseInt(notification_id));
                        }
                    });
                }
                else if(item_type === 'calendar') {
                    $.ajax({
                        type: "POST",
                        url: '/api/accept_calendar',
                        data: {
                            'start': this._currentDate.valueOf(),
                            'end': this._currentDate.addDays(7).valueOf(),
                            'calendar_id': notification_id
                        },
                        success: (data) => {
                            if(data['status'] !== 200) {
                                this.displayError(data['status'], true);
                                return;
                            }
                            this.calendarNotificationUpdate(data['calendar']);
                            data['events'].forEach((event) => {
                               this.addEventToSharedCalendar(event);
                            });
                        }
                    });
                }
            });
        });
        $('.notification-item-reject-button').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const notification_item = $(element).parent();
                const [_, item_type, notification_id] = notification_item.attr('id').split('-');
                if(item_type === 'event') {
                    $.ajax({
                        type: "POST",
                        url: '/api/reject_event',
                        data: {'event_id': notification_id},
                        success: (data) => {
                            if(data['status'] !== 200) {
                                this.displayError(data['status'], true);
                                return;
                            }
                            this.eventNotificationUpdate(parseInt(notification_id), false);
                        }
                    });
                } else if(item_type === 'calendar') {
                    $.ajax({
                        type: "POST",
                        url: '/api/reject_calendar',
                        data: {'calendar_id': notification_id},
                        success: (data) => {
                            if(data['status'] !== 200) {
                                this.displayError(data['status'], true);
                                return;
                            }
                            this.calendarNotificationUpdate({id: parseInt(notification_id)}, false);
                        }
                    });
                }
            });
        });
    }

    updateGridOverlaysEventsButton() {
        $('.grid-overlay .event').each((_, element) => {
            if(this._alreadyBindButton.includes(element))
                return;
            this._alreadyBindButton.push(element);
            $(element).click(() => {
                const [_, event_id] = $(element).attr('id').split('-');
                const [__, ___, parent_id] = $(element).parent().attr('id').split('-');
                const grid_overlay = this._listGridOverlays.find(g => g.id === parseInt(parent_id));
                if(grid_overlay === undefined)
                    return;
                const event = grid_overlay.events.find(e => e.id === parseInt(event_id));
                if(event === undefined)
                    return;
                event.showEditForm();
            });
        });
    }

    addNotificationItem(type, id, name) {
        const notifications_box = $('#header-notification-items-list');
        notifications_box.append(`
            <div id="${type}-${id}" class="notification-item">
                <div class="item-text">${name}</div>
                <img class="notification-item-accept-button" src="./static/svg/accept.svg">
                <img class="notification-item-reject-button" src="./static/svg/reject.svg">
            </div>
        `);
    }

    buildGridOverlays() {
        this._listGridOverlays.forEach(grid_overlay => {
                grid_overlay.delete();
            });
        this._listGridOverlays = [];

        this._eventsOwn.forEach(event => {
            if(this._awaitingEvents.some(e => e['id'] === event['id']))
                return;
            let event_id = parseInt(event['id']);
            if(event['calendar'] !== undefined && event['calendar'] !== null)
                event_id = parseInt(event['calendar']);
            let grid_overlay = this._listGridOverlays.find(g => g.id === event_id);
            if(grid_overlay === undefined) {
                grid_overlay = new GridOverlay(event_id);
                this._listGridOverlays.push(grid_overlay);
            }
            grid_overlay.newEvent(event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']))
        });

        this._eventsInSharedCalendar.forEach(event => {
            let calendarId = parseInt(event['calendar']);
            if(this._awaitingCalendars.some(e => e['id'] === calendarId))
                return;
            let grid_overlay = this._listGridOverlays.find(g => g.id === calendarId);
            if(grid_overlay === undefined) {
                grid_overlay = new GridOverlay(calendarId);
                this._listGridOverlays.push(grid_overlay);
            }
            grid_overlay.newEvent(event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']))
        });

        this._calendars.forEach(calendar => {
            let grid_overlay = this._listGridOverlays.find(g => g.id === calendar['id']);
            if(grid_overlay === undefined) {
                grid_overlay = new GridOverlay(calendar['id']);
                this._listGridOverlays.push(grid_overlay);
            }
        });

        this._listGridOverlays.forEach(grid_overlay => {
            grid_overlay.show();
        });

        this.displayConflicts();
        this.updateGridOverlaysEventsButton();
    }

    resize() {
        const cell_height = $('.calendar-container').height() / 25;
        $('.calendar-time .time').css('height', cell_height);
        $('.calendar-body .day').css('height', cell_height);
        $('.calendar-body .calendar-body-grid .cell').css('height', cell_height);

        const calendar_grid = $('.calendar-body .calendar-body-grid');

        this._gridHeightUnit = calendar_grid.height() / 24;
        this._gridWidthUnit = calendar_grid.width() / 7;

        this._listGridOverlays.forEach(grid_overlay => {
            grid_overlay.resize();
        });
    }

    displayWeekDaysHeader() {
        const calendar_body_header = $('.calendar-body .calendar-body-header');
        calendar_body_header.empty();
        for (let i = 0; i < 7; i++)
            calendar_body_header.append("<div class='day'>" + week_days[(this._currentDate.getDay() - 1 + i) % 7] + "<div class='day-number'>" + this._currentDate.addDays(i).getDate() + "</div></div>");
    }

    displayHeaderMonthAndYear() {
        const date = $('.calendar-header .date-container .current-date');
        const date_start = this._currentDate;
        const date_end = date_start.addDays(7);
        if(date_start.getMonth() === date_end.getMonth() && date_start.getFullYear() === date_end.getFullYear())
            date.text(date_start.toLocaleString('default', { month: 'long' }) + ' ' + date_start.getFullYear());
        else if(date_start.getMonth() !== date_end.getMonth() && date_start.getFullYear() === date_end.getFullYear())
            date.text(date_start.toLocaleString('default', { month: 'long' }) + ' - ' + date_end.toLocaleString('default', { month: 'long' }) + ' ' + date_start.getFullYear());
        else
            date.text(date_start.toLocaleString('default', { month: 'long' }) + ' ' + date_start.getFullYear() + ' - ' + date_end.toLocaleString('default', { month: 'long' }) + ' ' + date_end.getFullYear());
    }

    displayConflicts() {
        const gap = 1;
        const conflicts_week = [{}, {}, {}, {}, {}, {}, {}];
        this._listGridOverlays.forEach(grid_overlay => {
            grid_overlay.getDisplayEvents().forEach(event => {
                const day_index = ((7 - this._currentDate.getDay() + event.start.getDay()) % 7);
                conflicts_week[day_index][event.start.valueOf() + gap] = 'start-' + event.gridOverlayId + '-' + event.id;
                conflicts_week[day_index][event.end.valueOf() - gap] = 'end-' + event.gridOverlayId + '-' + event.id;
                $(`.grid-overlay-container #event-${event.id}`).removeClass('conflict');
                $('.left-panel-container .block').removeClass('conflict');
            });
        })

        const conflict = new Set();
        for (let i = 0; i < conflicts_week.length; i++) {
            const memory = [];
            const conflicts_day = conflicts_week[i];
            const conflicts_day_keys_sorted = Object.keys(conflicts_day).sort((a, b) => a - b);
            for (let j = 0; j < conflicts_day_keys_sorted.length; j++) {
                const value = conflicts_day[conflicts_day_keys_sorted[j]];
                if(value.startsWith('start')) {
                    if(memory.length > 0) {
                        conflict.add(value);
                        memory.forEach(m => conflict.add(m));
                    }
                    memory.push(value);
                } else {
                    if(memory.length === 1)
                        memory.pop();
                    else
                        memory.splice(memory.indexOf(value.replace('end', 'start')), 1);
                }
            }
        }

        conflict.forEach(e => {
            const [_, grid_id, event_id] = e.split('-');
            $(`.grid-overlay-container #event-${event_id}`).addClass('conflict');
            $(`.left-panel-container #left-${grid_id}`).addClass('conflict');
        });
    }

    incrementDate(value) {
        this.currentDate.setDate(this.currentDate.getDate() + value);
    }

    decrementDate(value) {
        this.currentDate.setDate(this.currentDate.getDate() - value);
    }

    currentDateSetToToday() {
        this._currentDate.setTime(new Date().getTime());
        this._currentDate.setHours(0, 0, 0, 0);
    }

    isoStringToLocaleDateString(date) {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(date - tzoffset)).toISOString().slice(0, -1);
    }

    displayError(message, is_code = false) {
        if(is_code)
            message = HTTP_STATUS_CODES_REVERSE[parseInt(message)];
        const error_container = $('.header-messages-container .error-message');
        error_container.text(message);
        error_container.show();
    }

    displayMessage(message) {
        $('.header-messages-container .error-message').hide();
        const message_container = $('.header-messages-container .message');
        message_container.text(message);
        message_container.show();
    }

    destroy() {
        this._calendars = [];
        this._calendarsShared = [];
        this._awaitingCalendars = [];
        this._awaitingEvents = [];

        this._eventsNotInCalendar = [];
        this._eventsInSharedCalendar = [];
        this._eventsOwn = [];

        this._listGridOverlays = [];
        this._currentDate = new Date();
        this._currentDate.setHours(0, 0, 0, 0);
        this._gridHeightUnit = 0;
        this._gridWidthUnit = 0;

        this._alreadyBindButton = [];

        this.buildLeftPanel();
        this.displayHeaderMonthAndYear();
        this.displayWeekDaysHeader();
        $('.grid-overlay-container').empty();
    }

    get currentDate() {
        return this._currentDate;
    }

    get calendars() {
        return this._calendars;
    }

    get gridHeightUnit() {
        return this._gridHeightUnit;
    }

    get gridWidthUnit() {
        return this._gridWidthUnit;
    }
}

Date.prototype.addDays = function(d){return new Date(this.valueOf()+24*60*60*1000*d);};

export { Session };