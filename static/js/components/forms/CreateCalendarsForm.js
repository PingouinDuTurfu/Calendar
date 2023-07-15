import { endInitHtml } from "../HtmlBuilder.js";

endInitHtml.then(() => {
    $('#create-calendar-form').submit(function (e) {
        e.preventDefault();

        const form = {};
        $(this).serializeArray().forEach(item => {
            form[item.name] = item.value;
        });

        const dataJson = {
            "name": form['calendar-title']
        };


        console.log(dataJson);
        // const json = {};
        // json['name'] = array[0]['value'];
        // let share_list = [];
        // if ($(this).find('.share-list').val() !== '---')
        //     share_list = $(this).find('.share-list').val().filter(item => item !== '---');
        // if (share_list.length > 0)
        //     json['share'] = JSON.stringify(share_list);
        // $.ajax({
        //     type: "POST",
        //     url: form.attr('action'),
        //     data: json,
        //     success: function (data) {
        //         $('.create-calendar-container').hide();
        //         if (data['status'] !== 200) {
        //             if (data['status'] === 409)
        //                 session.displayError("You already have a calendar with this name");
        //             else
        //                 session.displayError(data['status'], true);
        //             return;
        //         }
        //         session.displayMessage("Calendar created successfully");
        //         session.addCalendar(data['calendar']);
        //     }
        // });
    });
});