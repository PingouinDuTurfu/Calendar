import { HTTP_STATUS_CODES } from "../HttpCode.js";
import { ClickableWindow } from "./ClickableWindow.js";
import { logger } from "./Logger.js";

class HtmlBuilder {

    constructor() {
        this.endInitHtml = $.Deferred();
        this.groupsListeners = new Map();
    }

    getHtmlContent(element, path, hide = false) {
        logger.log("Loading " + path + " ...");
        return $.ajax({
            url: 'get_file/' + path,
            success: (data) => {
                if (data.status !== HTTP_STATUS_CODES.OK) {
                    this.endInitHtml.reject();
                    logger.error("Failed to load " + path + " : " + data['status']);
                }
                const parseHtml = $($.parseHTML(data['content']));
                parseHtml.attr('id', element.attr('id'));
                element.replaceWith(parseHtml);

                if (hide)
                    parseHtml.css('display', 'none');

                logger.log("Successfully loaded " + path + " !");
            },
            error: (data) => {
                this.endInitHtml.reject();
                logger.error("Failed to load " + path + " : " + data['status']);
            }
        });
    }

    loadFragment() {
        const includes = $('[data-include]').toArray().map(async (include) => {
            const path = $(include).data('include');
            const filename = `${path.split('/').pop()}.html`;
            return this.getHtmlContent($(include), `${path}/${filename}`);
        });

        const windows = $('[data-window]').toArray().map(async (window) => {
            const path = `${$(window).data('window')}.html`;
            return this.getHtmlContent($(window), path, true);
          });

        Promise.all([...includes, ...windows]).then(() => {
            if (includes.length > 0)
                this.loadFragment();
            else
                this.bindWindowsListeners();
        });
    }

    bindWindowsListeners() {
        const targets = $('[data-window-target]');
        const self = this;
        targets.each(function() {
            const target = $(this).data('window-target');
            const script = $(this).data('window-script');
            const group = $(this).data('window-group');
            const isFixed = $(this).data('window-fixed');

            self.addWindowListener($(this), target, script, group, isFixed !== undefined);
        }).promise().done(
            () => this.endInitHtml.resolve()
        );
    }

    addWindowListener(button, target, script = undefined, group = undefined, isFixed = false) {
        if(group !== undefined)
            if(this.groupsListeners.has(group))
                this.groupsListeners.get(group).addListener(button);
            else {
                const window = new ClickableWindow(button, $('#' + target), script, isFixed);
                this.groupsListeners.set(group, window);
            }
        else
            new ClickableWindow(button, $('#' + target), script, isFixed);
    }

    getPromise() {
        return this.endInitHtml;
    }
}

export const htmlBuilder = new HtmlBuilder();

$(() => {
    logger.enable();
    htmlBuilder.loadFragment();
});