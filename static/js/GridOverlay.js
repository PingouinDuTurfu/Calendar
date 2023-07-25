import { Event } from './Event.js';
import { currentSession } from "./script.js";
import {logger} from "./components/Logger.js";
import {htmlBuilder} from "./components/HtmlBuilder.js";

const TYPE_GRID_OVERLAY = {
    EVENT: 0,
    CALENDAR: 1,
    SHARED_CALENDAR: 2
}

class GridOverlay {
    constructor(type, id, name) {
        this.type = type;
        this.id = id;
        this.name = name;

        this.events = [];
        this.isVisible = true;

        this.parent = $('#grid-overlay-container');
        this.element = $(
            `<div class='grid-overlay' id='grid-overlay-${this.id}'></div>`
        );
        this.parent.append(this.element);

        this.createLeftPanelElement();

        currentSession.gridOverlays.push(this);
    }

    createLeftPanelElement() {
        switch (this.type) {
            case TYPE_GRID_OVERLAY.EVENT:
                this.leftPanelParent = $('.events-list-container');
                break;
            case TYPE_GRID_OVERLAY.CALENDAR:
                this.leftPanelParent = $('.calendars-list-container');
                break;
            case TYPE_GRID_OVERLAY.SHARED_CALENDAR:
                this.leftPanelParent = $('.calendars-shared-list-container');
                break;
            default:
                logger.error('Invalid type of grid overlay');
                return;
        }
        this.leftPanelElement = $(`
            <div class="block" id="left-${this.id}">
                <div class="view">
                    <img class="block-view-button block-show-view-button" src="./static/svg/show_view.svg" alt="view">
                    <img class="block-view-button block-hide-view-button" src="./static/svg/hide_view.svg" alt="view">
                </div>
                <div class="block-title">
                    ${this.name}
                </div>
                <div class="edit">
                    <img class="block-edit-button" src="./static/svg/edit.svg" alt="edit">
                </div>
                <div class="delete">
                    <img class="block-delete-button" src="./static/svg/bin.svg" alt="delete">
                </div>
                <div class="share">
                    <img class="block-share-button" src="./static/svg/paper_plane.svg" alt="share">
                </div>
            </div>
        `);
        this.leftPanelParent.append(this.leftPanelElement);
        this.bindButtonsLeftPanel();
    }

    bindButtonsLeftPanel() {
        this.leftPanelElement.find('.block-show-view-button').click(e => {
            this.hide();
        });
        this.leftPanelElement.find('.block-hide-view-button').click(e => {
            this.show();
        });
        this.leftPanelElement.find('.block-delete-button').click(e => {
            this.delete();
        });

        htmlBuilder.addWindowListener(
            this.leftPanelElement.find('.block-edit-button'),
            this.type === TYPE_GRID_OVERLAY.EVENT ? "window-edit-event" : "window-edit-calendar",
            undefined, this.type
        );

        // this.leftPanelElement.find('.block-share-button').click(e => {
        //     this.share();
        // });
    }

    newEvent(id, name, note, start, end) {
        this.events.push(new Event(this.element, id, name, note, start, end));
    }

    addEvent(event) {
        this.events.push(event);
    }

    show() {
        this.isVisible = true;
        this.element.css('display', 'block');
        this.leftPanelElement.find('.block-hide-view-button').hide();
        this.leftPanelElement.find('.block-show-view-button').show();

        currentSession.displayConflicts();
    }

    hide() {
        this.isVisible = false;
        this.element.css('display', 'none');
        this.leftPanelElement.find('.block-hide-view-button').show();
        this.leftPanelElement.find('.block-show-view-button').hide();

        currentSession.displayConflicts();
    }

    resize() {
        this.events.forEach(event => {
            event.resize();
        });
    }

    delete() {
        this.element.remove();
        this.leftPanelElement.remove();
        currentSession.removeGridOverlay(this);
    }

    getDisplayEvents() {
        if(this.isVisible) {
            return this.events;
        }
        return [];
    }

    showShareForm() {
        $('.after-share-calendar-container').css('display', 'flex');
        $.ajax({
            type: "POST",
            data: {'calendar_id': this.id},
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
        $('.after-share-calendar-container #share-calendar-id').val(this.id);
    }

    getId() {
        return this.id;
    }


    getEvents() {
        return this.events;
    }
}

export { TYPE_GRID_OVERLAY, GridOverlay };