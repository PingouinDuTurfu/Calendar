import { endInitHtml } from "./components/HtmlBuilder.js";
import { currentSession, createDateFromHtml } from "./script.js";

endInitHtml.then(() => {

    console.log('listeners.js loaded');

    $('#show-previous-week-button').click(function () {
        currentSession.decrementDate(7);
        currentSession.updateWeek();
    });

    $('#show-next-week-button').click(function () {
        currentSession.incrementDate(7);
        currentSession.updateWeek();
    });

    $('#today-button').click(function () {
        currentSession.currentDateSetToToday();
        currentSession.updateWeek();
    });

    $('.edit-event-container .close-box').click(function () {
        $('.edit-event-container').hide();
    });

    $('.after-share-calendar-container .close-box').click(function () {
        $('.after-share-calendar-container').hide();
    });

    // $('#header-notification-button').click(function () {
    //     const notification_box = $('.header-notification-overlay');
    //     notification_box.toggle();
    // });
    //
    // $('.edit-event-container #edit-event-delete').click(function () {
    //     const event_id = $('.edit-event-container #edit-event-id').val();
    //     $.ajax({
    //         type: "POST",
    //         url: '/api/delete_event',
    //         data: {
    //             'event_id': event_id
    //         },
    //         success: function (data) {
    //             if (data['status'] !== 200) {
    //                 session.displayError(data['status'], true);
    //                 return
    //             }
    //             $('.edit-event-container').hide();
    //             session.displayMessage('Event deleted');
    //             session.updateWeek();
    //         }
    //     });
    // });
    //
    // $('.left-panel-block .add-icon').each(function () {
    //     $(this).click(function () {
    //         const create_overlay = $(this).parent().find('.create-overlay');
    //         create_overlay.toggle();
    //         if (create_overlay.is(':visible')) {
    //             $.ajax({
    //                 type: "POST",
    //                 url: '/api/get_users_list',
    //                 success: function (data) {
    //                     if (data['status'] !== 200) {
    //                         session.displayError(data['status'], true);
    //                         return
    //                     }
    //                     const share_list = create_overlay.find('.share-list');
    //                     share_list.empty();
    //                     share_list.append(`<option value="---">---</option>`);
    //                     data['users'].forEach(user => {
    //                         share_list.append(`<option value="${user}">${user}</option>`);
    //                     });
    //
    //                     const calendar_list = create_overlay.find('.calendar-list');
    //                     calendar_list.empty();
    //                     calendar_list.append(`<option value="Default">Default</option>`);
    //                     session.calendars.forEach(calendar => {
    //                         calendar_list.append(`<option value="${calendar.id}">${calendar.name}</option>`);
    //                     });
    //                 }
    //             });
    //         }
    //     });
    // });
    //
    // $('#create-event-form').submit(function (e) {
    //     e.preventDefault();
    //     const form = $(this);
    //     const array = form.serializeArray();
    //     const json = {};
    //     json['name'] = array[0]['value'];
    //     json['note'] = array[4]['value'];
    //     json['start'] = createDateFromHtml(array[1]['value'], array[2]['value']);
    //     json['end'] = createDateFromHtml(array[1]['value'], array[3]['value']);
    //     if (array[5]['value'] !== "Default")
    //         json['calendar'] = array[5]['value'];
    //     let share_list = [];
    //     if ($(this).find('.share-list').val() !== '---')
    //         share_list = $(this).find('.share-list').val().filter(item => item !== '---');
    //     if (share_list.length > 0)
    //         json['share'] = JSON.stringify(share_list);
    //     $.ajax({
    //         type: "POST",
    //         url: form.attr('action'),
    //         data: json,
    //         success: function (data) {
    //             $('.create-event-container').hide();
    //             if (data['status'] !== 200 && data['status'] !== 206) {
    //                 session.displayError(data['status'], true);
    //                 return;
    //             }
    //             if (data['status'] === 206)
    //                 session.displayError("Share failed for: " + data['email_failed']);
    //             session.displayMessage("Event created successfully");
    //             session.updateWeek();
    //         }
    //     });
    // });
    //
    //
    // $('#event-edit-form').submit(function (e) {
    //     e.preventDefault();
    //     const form = $(this);
    //     const array = form.serializeArray();
    //     const json = {};
    //     json['name'] = array[0]['value'];
    //     json['start'] = createDateFromHtml(array[1]['value'], array[2]['value']);
    //     json['end'] = createDateFromHtml(array[1]['value'], array[3]['value']);
    //     json['note'] = array[4]['value'];
    //     if (array[5]['value'] !== "Default")
    //         json['calendar'] = array[5]['value'];
    //     json['event_id'] = parseInt(array[6]['value']);
    //     $.ajax({
    //         type: "POST",
    //         url: form.attr('action'),
    //         data: json,
    //         success: function (data) {
    //             $('.edit-event-container').hide();
    //             if (data['status'] !== 200) {
    //                 session.displayError(data['status'], true);
    //                 return;
    //             }
    //             session.displayMessage("Event edited successfully");
    //             session.updateWeek();
    //         }
    //     });
    // });
    //
    // $('#event-after-share-form').submit(function (e) {
    //     e.preventDefault();
    //     const form = $(this);
    //     const json = {};
    //     json['event_id'] = parseInt(form.serializeArray()[0]['value']);
    //     let share_list = [];
    //     if ($(this).find('.share-list').val() !== '---')
    //         share_list = $(this).find('.share-list').val().filter(item => item !== '---');
    //     if (share_list.length > 0)
    //         json['share'] = JSON.stringify(share_list);
    //     $.ajax({
    //         type: "POST",
    //         url: form.attr('action'),
    //         data: json,
    //         success: function (data) {
    //             $('.after-share-event-container').hide();
    //             if (data['status'] !== 200 && data['status'] !== 206) {
    //                 session.displayError(data['status'], true);
    //                 return;
    //             }
    //             if (data['status'] === 206)
    //                 session.displayError("Share failed for: " + data['email_failed']);
    //             session.displayMessage("Event shared successfully");
    //         }
    //     });
    // });
    //
    // $('#calendar-after-share-form').submit(function (e) {
    //     e.preventDefault();
    //     const form = $(this);
    //     const json = {};
    //     json['calendar_id'] = parseInt(form.serializeArray()[0]['value']);
    //     const share_list = $(this).find('.share-list').val();
    //     if (share_list.length > 0)
    //         json['share'] = JSON.stringify(share_list);
    //     const remove_list = $(this).find('.already-share-list').val();
    //     if (remove_list.length > 0)
    //         json['remove'] = JSON.stringify(remove_list);
    //     $.ajax({
    //         type: "POST",
    //         url: form.attr('action'),
    //         data: json,
    //         success: function (data) {
    //             $('.after-share-calendar-container').hide();
    //             if (data['status'] !== 200 && data['status'] !== 206) {
    //                 session.displayError(data['status'], true);
    //                 return;
    //             }
    //             if (data['status'] === 206)
    //                 session.displayError("Share failed for: " + data['email_failed']);
    //             session.displayMessage("Calendar shared successfully");
    //         }
    //     });
    // });
});

$(window).resize(function() {
    currentSession.resize();
});
