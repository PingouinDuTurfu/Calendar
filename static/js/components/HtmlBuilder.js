import {currentSession} from "../script.js";
import {HTTP_STATUS_CODES} from "../HttpCode.js";
import {ClickableWindow} from "./ClickableWindow.js";

function getHtmlContent(element, path, hide = false) {
    console.log(path + ' ' + hide);
    return $.ajax({
        url: 'get_file/' + path,
        success: (data) => {
            if (data.status !== HTTP_STATUS_CODES.OK) {
                currentSession.displayError(data['status'], true);
                endInitHtml.reject();
            }
            const parseHtml = $($.parseHTML(data['content']));
            parseHtml.attr('id', element.attr('id'));
            element.replaceWith(parseHtml);

            if (hide)
                parseHtml.css('display', 'none');
        }
    });
}

function loadFragment() {
    const promises = [];

    const includes = $('[data-include]').toArray().map(async (include) => {
        const path = $(include).data('include');
        const filename = `${path.split('/').pop()}.html`;
        return getHtmlContent($(include), `${path}/${filename}`);
    });

    const windows = $('[data-window]').toArray().map(async (window) => {
        const path = `${$(window).data('window')}.html`;
        return getHtmlContent($(window), path, true);
      });

    Promise.all([...includes, ...windows]).then(() => {
        if (includes.length > 0)
            loadFragment();
        else
            bindWindowsListeners();
    });
}

function bindWindowsListeners() {
    const targets = $('[data-window-target]');

    targets.each(function() {
        const target = $(this).data('window-target');
        const script = $(this).data('window-script');
        const window = new ClickableWindow($(this), $('#' + target), script);
    }).promise().done(
        () => endInitHtml.resolve()
    );
}

const endInitHtml = $.Deferred();
$(() => loadFragment());

export { endInitHtml };