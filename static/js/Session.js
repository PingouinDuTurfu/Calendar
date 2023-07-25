import { GridOverlay, TYPE_GRID_OVERLAY } from "./GridOverlay.js";
import { Event } from "./Event.js";
import { HTTP_STATUS_CODES_REVERSE } from "./HttpCode.js";
import { logger } from "./components/Logger.js";

const week_days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

class Session {
    constructor() {
        this.calendars = [];
        this.calendarsShared = [];

        this.awaitingCalendars = [];
        this.awaitingEvents = [];

        this.events = [];

        this.eventsNotInCalendar = [];
        this.eventsInSharedCalendar = [];
        this.eventsOwn = [];

        this.gridOverlays = [];

        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);

        this.gridHeightUnit = 0;
        this.gridWidthUnit = 0;
    }

    createSession() {
        const url = '/api/get_data';
        $.ajax({
            url: url,
            type: 'POST',
            async: false,
            success: (data) => {
                this.calendars = data['calendars'];
                this.calendarsShared = data['calendars_shared'];

                this.awaitingCalendars = data['awaiting_calendars'];
                this.awaitingEvents = data['awaiting_events'];
            }
        });
    }

    updateWeek() {
        this.clearLeftPanel();
        this.clearGridOverlays();
        const url = '/api/get_week_data';
        const data = {
            'start': this.currentDate.valueOf(),
            'end': this.currentDate.addDays(7).valueOf()
        }
        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            async: false,
            success: (data) => {
                this.events = data['events'];

                // this.eventsNotInCalendar = data['events_not_in_calendar'];
                // this.eventsInSharedCalendar = data['events_in_shared_calendar'];
                // this.eventsOwn = data['events_own'];
                //
                // logger.log("eventsNotInCalendar", this.eventsNotInCalendar);
                // logger.log("eventsInSharedCalendar", this.eventsInSharedCalendar);
                // logger.log("eventsOwn", this.eventsOwn);

                this.buildGridOverlays();

                this.displayHeaderMonthAndYear();
                this.displayWeekDaysHeader();
            }
        });
    }

    clearLeftPanel() {
        $('.events-list-container').empty();
        $('.calendars-list-container').empty();
        $('.calendars-shared-list-container').empty();
    }

    clearGridOverlays() {
        for(let index = this.gridOverlays.length - 1; index >= 0; index--)
            this.gridOverlays[index].delete();
    }

    addEvent(event) {
        if(event['start'] < this.currentDate.valueOf() || event['start'] > this.currentDate.addDays(7).valueOf()
            || event['end'] < this.currentDate.valueOf() || event['end'] > this.currentDate.addDays(7).valueOf())
            return;
        this.eventsOwn.push(event);
        this.eventsNotInCalendar.push(event);

        const grid_overlay = new GridOverlay(event['id']);
        this.gridOverlays.push(grid_overlay);
        const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        grid_overlay.addEvent(newEvent);
        newEvent.render();

        this.displayConflicts();
    }

    addEventToCalendar(event) {
        if(event['start'] < this.currentDate.valueOf() || event['start'] > this.currentDate.addDays(7).valueOf()
            || event['end'] < this.currentDate.valueOf() || event['end'] > this.currentDate.addDays(7).valueOf())
            return;
        this.eventsOwn.push(event);

        const grid_overlay = new GridOverlay(event['calendar']);
        this.gridOverlays.push(grid_overlay);
        const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        grid_overlay.addEvent(newEvent);
        newEvent.render();

        this.displayConflicts();
    }

    addEventToSharedCalendar(event) {
        // if(event['start'] < this.currentDate.valueOf() || event['start'] > this.currentDate.addDays(7).valueOf()
        //     || event['end'] < this.currentDate.valueOf() || event['end'] > this.currentDate.addDays(7).valueOf())
        //     return;
        // this.eventsInSharedCalendar.push(event);
        //
        // const grid_overlay = new GridOverlay(event['calendar']);
        // this.gridOverlays.push(grid_overlay);
        // const newEvent = new Event(grid_overlay.id, event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        // grid_overlay.addEvent(newEvent);
        // newEvent.render();
        //
        // this.displayConflicts();
    }

    addCalendar(calendar) {
        this.calendars.push(calendar);

        const grid_overlay = new GridOverlay(calendar['id']);
        this.gridOverlays.push(grid_overlay);
    }

    addSharedCalendar(calendar) {
        // this.calendarsShared.push(calendar);
        //
        // const grid_overlay = new GridOverlay(calendar['id']);
        // this.gridOverlays.push(grid_overlay);
    }

    removeEvent(event_id) {
        // const event = this.eventsOwn.find(event => event['id'] === event_id);
        // this.eventsOwn.splice(this.eventsOwn.indexOf(event), 1);
        // this.eventsNotInCalendar.splice(this.eventsNotInCalendar.indexOf(event), 1);
        // this.gridOverlays.splice(this.gridOverlays.indexOf(this.gridOverlays.find(grid_overlay => grid_overlay.id === event_id)), 1);
        // $(`.left-panel-container #left-${event_id}`).remove();
        // $(`.calendar-body-grid #grid-overlay-${event_id}`).remove();
        //
        // this.displayConflicts();

    }

    removeCalendar(calendar_id, isShared = false) {
        // let calendar;
        // if(isShared) {
        //     calendar = this.calendarsShared.find(calendar => calendar['id'] === calendar_id);
        //     this.calendarsShared.splice(this.calendarsShared.indexOf(calendar), 1);
        // } else {
        //     calendar = this.calendars.find(calendar => calendar['id'] === calendar_id);
        //     this.calendars.splice(this.calendars.indexOf(calendar), 1);
        // }
        // this.gridOverlays.splice(this.gridOverlays.indexOf(this.gridOverlays.find(grid_overlay => grid_overlay.id === calendar_id)), 1);
        // $(`.left-panel-container #left-${calendar_id}`).remove();
        // $(`.calendar-body-grid #grid-overlay-${calendar_id}`).remove();
        //
        // this.displayConflicts();
    }

    eventNotificationUpdate (event_id, accepted = true) {
        const event = this.awaitingEvents.find(event => event['id'] === event_id);
        this.awaitingEvents.splice(this.awaitingEvents.indexOf(event), 1);
        $('#notification-event-' + event_id).remove();
        if(this.awaitingEvents.length === 0 && this.awaitingCalendars.length === 0) {
            $('.header .header-notification-content').removeClass('active');
            $('.header-notification-overlay').hide();
        }
        if(accepted)
            this.addEvent(event);
    }

    calendarNotificationUpdate(calendar, accepted = true) {
        const calendar_item = this.awaitingCalendars.find(calendar => calendar['id'] === calendar['id']);
        this.awaitingCalendars.splice(this.awaitingCalendars.indexOf(calendar_item), 1);
        $('#notification-calendar-' + calendar['id']).remove();
        if(this.awaitingEvents.length === 0 && this.awaitingCalendars.length === 0) {
            $('.header .header-notification-content').removeClass('active');
            $('.header-notification-overlay').hide();
        }
        if(accepted)
            this.addSharedCalendar(calendar);
    }

    buildNotificationsBox() {
        const notifications_box = $('#header-notification-items-list');
        notifications_box.empty();

        if(this.awaitingCalendars.length > 0 || this.awaitingEvents.length > 0) {
            $('.header .header-notification-content').addClass('active');
        }

        this.awaitingCalendars.forEach(calendar => {
            this.addNotificationItem("notification-calendar", calendar['id'], calendar['name']);
        });
        
        this.awaitingEvents.forEach(event => {
            this.addNotificationItem("notification-event", event['id'], event['name']);
        });

        this.updateNotificationsButton();
    }

    updateNotificationsButton() {
        logger.warn('TODO: Session -> updateNotificationsButton');
    //     $('.notification-item-accept-button').each((_, element) => {
    //         if(this.alreadyBindButton.includes(element))
    //             return;
    //         this.alreadyBindButton.push(element);
    //         $(element).click(() => {
    //             const notification_item = $(element).parent();
    //             const [_, item_type, notification_id] = notification_item.attr('id').split('-');
    //             if(item_type === 'event') {
    //                 $.ajax({
    //                     type: "POST",
    //                     url: '/api/accept_event',
    //                     data: {'event_id': notification_id},
    //                     success: (data) => {
    //                         if(data['status'] !== 200) {
    //                             this.displayError(data['status'], true);
    //                             return;
    //                         }
    //                         this.eventNotificationUpdate(parseInt(notification_id));
    //                     }
    //                 });
    //             }
    //             else if(item_type === 'calendar') {
    //                 $.ajax({
    //                     type: "POST",
    //                     url: '/api/accept_calendar',
    //                     data: {
    //                         'start': this.currentDate.valueOf(),
    //                         'end': this.currentDate.addDays(7).valueOf(),
    //                         'calendar_id': notification_id
    //                     },
    //                     success: (data) => {
    //                         if(data['status'] !== 200) {
    //                             this.displayError(data['status'], true);
    //                             return;
    //                         }
    //                         this.calendarNotificationUpdate(data['calendar']);
    //                         data['events'].forEach((event) => {
    //                            this.addEventToSharedCalendar(event);
    //                         });
    //                     }
    //                 });
    //             }
    //         });
    //     });
    //     $('.notification-item-reject-button').each((_, element) => {
    //         if(this.alreadyBindButton.includes(element))
    //             return;
    //         this.alreadyBindButton.push(element);
    //         $(element).click(() => {
    //             const notification_item = $(element).parent();
    //             const [_, item_type, notification_id] = notification_item.attr('id').split('-');
    //             if(item_type === 'event') {
    //                 $.ajax({
    //                     type: "POST",
    //                     url: '/api/reject_event',
    //                     data: {'event_id': notification_id},
    //                     success: (data) => {
    //                         if(data['status'] !== 200) {
    //                             this.displayError(data['status'], true);
    //                             return;
    //                         }
    //                         this.eventNotificationUpdate(parseInt(notification_id), false);
    //                     }
    //                 });
    //             } else if(item_type === 'calendar') {
    //                 $.ajax({
    //                     type: "POST",
    //                     url: '/api/reject_calendar',
    //                     data: {'calendar_id': notification_id},
    //                     success: (data) => {
    //                         if(data['status'] !== 200) {
    //                             this.displayError(data['status'], true);
    //                             return;
    //                         }
    //                         this.calendarNotificationUpdate({id: parseInt(notification_id)}, false);
    //                     }
    //                 });
    //             }
    //         });
    //     });
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

        this.calendars.forEach(calendar => {
            if(this.awaitingCalendars.some(e => e['id'] === calendar['id']))
                return;
            new GridOverlay(TYPE_GRID_OVERLAY.CALENDAR, calendar['id'], calendar['name']);
        });

        this.calendarsShared.forEach(calendar => {
            if(this.awaitingCalendars.some(e => e['id'] === calendar['id']))
                return;
            new GridOverlay(TYPE_GRID_OVERLAY.SHARED_CALENDAR, calendar['id'], calendar['name']);
        });

        this.events.forEach(event => {
            if(this.awaitingEvents.some(e => e['id'] === event['id']))
                return;

            if(event['calendar'] === null)
                new GridOverlay(TYPE_GRID_OVERLAY.EVENT, parseInt(event['id']), event['name'])
                    .newEvent(event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
            else
                this.gridOverlays.find(g => g.id === event['calendar'])
                    .newEvent(event['id'], event['name'], event['note'], new Date(event['start']), new Date(event['end']));
        });

        this.displayConflicts();
    }

    resize() {
        const cell_height = $('.calendar-container').height() / 25;
        $('.calendar-time .time').css('height', cell_height);
        $('.calendar-body .day').css('height', cell_height);
        $('.calendar-body .calendar-body-grid .cell').css('height', cell_height);

        const calendar_grid = $('.calendar-body .calendar-body-grid');

        this.gridHeightUnit = calendar_grid.height() / 24;
        this.gridWidthUnit = calendar_grid.width() / 7;

        this.gridOverlays.forEach(grid_overlay => {
            grid_overlay.resize();
        });
    }

    displayWeekDaysHeader() {
        const calendar_body_header = $('.calendar-body .calendar-body-header');
        calendar_body_header.empty();
        for (let i = 0; i < 7; i++)
            calendar_body_header.append("<div class='day'>" + week_days[(this.currentDate.getDay() - 1 + i) % 7] + "<div class='day-number'>" + this.currentDate.addDays(i).getDate() + "</div></div>");
    }

    displayHeaderMonthAndYear(short = false) {
        const date = $('.calendar-header .date-container .current-date');
        const date_start = this.currentDate;
        const date_end = date_start.addDays(7);
        const date_start_month = date_start.toLocaleString('default', { month: short ? 'short' : 'long' });
        const date_end_month = date_end.toLocaleString('default', { month: short ? 'short' : 'long' });
        if(date_start.getMonth() === date_end.getMonth() && date_start.getFullYear() === date_end.getFullYear())
            date.text(date_start_month + ' ' + date_start.getFullYear());
        else if(date_start.getMonth() !== date_end.getMonth() && date_start.getFullYear() === date_end.getFullYear())
            date.text(date_start_month + ' - ' + date_end_month + ' ' + date_start.getFullYear());
        else
            date.text(date_start_month + ' ' + date_start.getFullYear() + ' - ' + date_end_month + ' ' + date_end.getFullYear());
    }

    displayConflicts() {
        const gap = 1;
        const conflicts_week = [{}, {}, {}, {}, {}, {}, {}];
        this.gridOverlays.forEach(grid_overlay => {
            grid_overlay.getDisplayEvents().forEach(event => {
                const day_index = ((7 - this.currentDate.getDay() + event.start.getDay()) % 7);
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
        this.currentDate.setTime(new Date().getTime());
        this.currentDate.setHours(0, 0, 0, 0);
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
        this.calendars = [];
        this.calendarsShared = [];
        this.awaitingCalendars = [];
        this.awaitingEvents = [];

        this.eventsNotInCalendar = [];
        this.eventsInSharedCalendar = [];
        this.eventsOwn = [];

        this.gridOverlays = [];
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
        this.gridHeightUnit = 0;
        this.gridWidthUnit = 0;

        this.buildLeftPanel();
        this.displayHeaderMonthAndYear();
        this.displayWeekDaysHeader();
        $('.grid-overlay-container').empty();
    }

    removeGridOverlay(grid_overlay) {
        this.gridOverlays.splice(this.gridOverlays.indexOf(grid_overlay), 1);
    }

    getCurrentDate() {
        return this.currentDate;
    }

    getCalendars() {
        return this.calendars;
    }

    getGridHeightUnit() {
        return this.gridHeightUnit;
    }

    getGridWidthUnit() {
        return this.gridWidthUnit;
    }
}

Date.prototype.addDays = function(d){return new Date(this.valueOf()+24*60*60*1000*d);};

export { Session };