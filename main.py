import init

from flask import Flask, request, render_template

import google.oauth2.id_token
from google.auth.transport import requests

import json

import database
from database import RESPONSE_CODE

app = Flask(__name__)
firebase_request_adapter = requests.Request()

@app.route('/get_file/<path:path>', methods=['GET'])
def get_file(path):
    if path == '':
        return {'status': RESPONSE_CODE.BAD_REQUEST}
    with open('./templates/' + path, 'r') as file:
        data = file.read()
    return {'status': RESPONSE_CODE.OK, 'content': data}


@app.route('/')
def root():
    return render_template('index.html', message=request.args.get('message'),
                           error_message=request.args.get('error_message'))


@app.route('/api/get_data', methods=['POST'])
def get_user_data():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        status, user = database.get_user_data(claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        status, awaiting_events = database.fetch_event_not_in_calendar_by_state(database.EVENT_STATE.AWAITING_APPROVAL,
                                                                                claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        return {'status': RESPONSE_CODE.OK, 'calendars': user['calendars'], 'calendars_shared': user['calendarsShared'],
                'awaiting_calendars': user['awaitingApprovalCalendars'], 'awaiting_events': awaiting_events}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/get_week_data', methods=['POST'])
def get_week_data():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        start = request.form['start']
        end = request.form['end']

        if start == '' or end == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status, events_not_in_calendar = database.fetch_event_by_date(start, end, None, claim['email'], None, False)
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        status, events_in_shared_calendar = database.fetch_event_by_date(start, end, None, None, claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        status, events_own = database.fetch_event_by_date(start, end, None, claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        return {'status': status, 'events_not_in_calendar': events_not_in_calendar,
                'events_in_shared_calendar': events_in_shared_calendar, 'events_own': events_own}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/get_users_list', methods=['POST'])
def get_users_list():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}
        status, users = database.get_users_list(claim['email'])
        return {'status': status, 'users': users}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/get_own_calendars', methods=['POST'])
def get_own_calendars():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}
        status, user = database.get_user_data(claim['email'])
        return {'status': status, 'calendars': user['calendars']}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/get_who_has_access', methods=['POST'])
def get_who_has_access():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        calendar_id = request.form['calendar_id']
        if calendar_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status, already_share = database.get_who_has_access_to_calendar(claim['email'], int(calendar_id))
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        status, users = database.get_users_list(claim['email'])

        return {'status': status, 'already_share': already_share, 'users': users}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/create_event', methods=['POST'])
def create_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        data = request.form.get('name'), \
            request.form.get('note'), \
            request.form.get('start'), \
            request.form.get('end'),
        if data.__contains__(''):
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        calendar_id = request.form.get('calendar')
        if calendar_id is not None and calendar_id != '':
            status, event = database.create_event(*data, database.EVENT_STATE.COMPLETED, claim['email'], calendar_id,
                                                  True)
        else:
            status, event = database.create_event(*data, database.EVENT_STATE.COMPLETED, claim['email'], None, True)
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        share = request.form.get('share')
        if share is not None and share != '':
            share_status, email_failed = database.share_event(event['id'], json.loads(share))

            if share_status == RESPONSE_CODE.PARTIAL_CONTENT:
                return {'status': RESPONSE_CODE.PARTIAL_CONTENT, 'email_failed': email_failed, 'event': event}

            if share_status != RESPONSE_CODE.OK:
                return {'status': share_status}

        return {'status': RESPONSE_CODE.OK, 'event': event}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/create_calendar', methods=['POST'])
def create_calendar():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        name = request.form['name']
        if name == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status, calendar = database.create_calendar(name, claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}

        share = request.form.get('share')

        if share is not None:
            share_status, email_failed = database.share_calendar(calendar['id'], json.loads(share))

            if share_status == RESPONSE_CODE.PARTIAL_CONTENT:
                return {'status': RESPONSE_CODE.PARTIAL_CONTENT, 'email_failed': email_failed, 'calendar': calendar}

            if share_status != RESPONSE_CODE.OK:
                return {'status': share_status}

        return {'status': status, 'calendar': calendar}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/accept_event', methods=['POST'])
def accept_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        event_id = request.form['event_id']
        if event_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status = database.accept_event(int(event_id), claim['email'])
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/reject_event', methods=['POST'])
def reject_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        event_id = request.form['event_id']
        if event_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status = database.reject_event(int(event_id), claim['email'])
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/accept_calendar', methods=['POST'])
def accept_calendar():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        calendar_id = request.form['calendar_id']
        start = request.form['start']
        end = request.form['end']

        if start == '' or end == '' or calendar_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status, calendar = database.accept_calendar(int(calendar_id), claim['email'])
        if status != RESPONSE_CODE.OK:
            return {'status': status}
        status, events = database.fetch_event_by_calendar(start, end, calendar_id)
        if status != RESPONSE_CODE.OK:
            return {'status': status}
        return {'status': status, 'calendar': calendar, 'events': events}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/reject_calendar', methods=['POST'])
def reject_calendar():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        calendar_id = request.form['calendar_id']
        if calendar_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status = database.reject_calendar(int(calendar_id), claim['email'])
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/delete_event', methods=['POST'])
def delete_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        event_id = request.form['event_id']
        if event_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status = database.delete_event(int(event_id), claim['email'])
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/delete_calendar', methods=['POST'])
def delete_calendar():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        calendar_id = request.form['calendar_id']
        if calendar_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status = database.delete_calendar(int(calendar_id), claim['email'])
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/edit_event', methods=['POST'])
def edit_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        data = request.form['event_id'], \
            request.form.get('name'), \
            request.form.get('start'), \
            request.form.get('end'), \
            request.form.get('note')

        if data.__contains__(''):
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        calendar_id = request.form.get('calendar')
        if calendar_id is not None and calendar_id != '':
            status = database.edit_event(claim['email'], *data, int(calendar_id))
            return {'status': status}

        status = database.edit_event(claim['email'], *data)
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/share_event', methods=['POST'])
def share_event():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        event_id = request.form['event_id']
        if event_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        event_status, event = database.get_element_by_key('event', int(event_id))
        if event_status != RESPONSE_CODE.OK:
            return RESPONSE_CODE.NOT_FOUND

        share = request.form.get('share')
        if share is None or share == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        status, email_failed = database.share_event(int(event_id), json.loads(share))

        if status == RESPONSE_CODE.PARTIAL_CONTENT:
            return {'status': RESPONSE_CODE.PARTIAL_CONTENT, 'email_failed': email_failed}
        return {'status': status}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


@app.route('/api/share_calendar', methods=['POST'])
def share_calendar():
    id_token = request.cookies.get("token")
    if id_token:
        try:
            claim = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        except ValueError:
            return {'status': RESPONSE_CODE.UNAUTHORIZED}

        calendar_id = request.form['calendar_id']
        if calendar_id == '':
            return {'status': RESPONSE_CODE.BAD_REQUEST}

        calendar_status, calendar = database.get_element_by_key('calendar', int(calendar_id))
        if calendar_status != RESPONSE_CODE.OK:
            return RESPONSE_CODE.NOT_FOUND

        share = request.form.get('share')
        if share is not None and share != '':
            status, email_failed = database.share_calendar(int(calendar_id), json.loads(share))

            if status == RESPONSE_CODE.PARTIAL_CONTENT:
                return {'status': RESPONSE_CODE.PARTIAL_CONTENT, 'email_failed': email_failed}

        remove = request.form.get('remove')
        if remove is not None and remove != '':
            for email in json.loads(remove):
                status = database.delete_calendar(int(calendar_id), email)
                if status != RESPONSE_CODE.OK:
                    return {'status': status}
            return {'status': RESPONSE_CODE.OK}

        return {'status': RESPONSE_CODE.OK}
    return {'status': RESPONSE_CODE.UNAUTHORIZED}


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
