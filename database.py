from google.cloud import datastore

from attributeDictClass import AttributeDict

datastore_client = datastore.Client()

RESPONSE_CODE = AttributeDict({
    'OK': 200,
    'PARTIAL_CONTENT': 206,
    'BAD_REQUEST': 400,
    'UNAUTHORIZED': 401,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'INTERNAL_SERVER_ERROR': 500
})

EVENT_STATE = AttributeDict({
    'COMPLETED': 0,
    'AWAITING_APPROVAL': 1
})


def create_user(
        email
):
    status, user = get_element_by_key('user', email)
    if status == RESPONSE_CODE.OK:
        return RESPONSE_CODE.CONFLICT, None

    entity_key = datastore_client.key('user', email)
    entity = datastore.Entity(key=entity_key)
    entity.update({
        'email': email,
        'calendars': [],
        'calendarsShared': [],
        'awaitingApprovalCalendars': []
    })
    datastore_client.put(entity)
    return RESPONSE_CODE.OK, entity


def create_calendar(
        name,
        owner
):
    status, user = get_element_by_key('user', owner)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    query = datastore_client.query(kind='calendar')
    query.add_filter('name', '=', name)
    query.add_filter('owner', '=', owner)

    if list(query.fetch()).__len__() > 0:
        return RESPONSE_CODE.CONFLICT, None

    entity = datastore.Entity(key=datastore_client.key('calendar'))
    entity.update({
        'name': name,
        'owner': owner,
        'sharedWith': []
    })
    datastore_client.put(entity)

    user['calendars'].append(entity.key.id)
    datastore_client.put(user)

    return RESPONSE_CODE.OK, {'id': entity.key.id, 'name': entity['name'], 'owner': entity['owner']}


def create_event(
        name,
        note,
        start,
        end,
        state,
        owner,
        calendar_id=None,
        return_entity=False
):
    status, user = get_element_by_key('user', owner)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    if start > end:
        return RESPONSE_CODE.BAD_REQUEST, None

    shared_with = []
    if calendar_id is not None:
        status, calendar = get_element_by_key('calendar', int(calendar_id))
        if status != RESPONSE_CODE.OK:
            return RESPONSE_CODE.NOT_FOUND, None

        if calendar['owner'] != owner:
            return RESPONSE_CODE.UNAUTHORIZED, None

        shared_with = calendar['sharedWith']

    entity = datastore.Entity(key=datastore_client.key('event'))
    entity.update({
        'name': name,
        'note': note,
        'start': int(start),
        'end': int(end),
        'state': int(state),
        'owner': owner,
        'calendar': int(calendar_id),
        'sharedWith': shared_with
    })

    datastore_client.put(entity)
    if return_entity:
        return RESPONSE_CODE.OK, {'id': entity.key.id, 'name': entity['name'], 'note': entity['note'],
                                  'owner': entity['owner'], 'start': entity['start'], 'end': entity['end'],
                                  'state': entity['state'], 'calendar': entity['calendar']}

    return RESPONSE_CODE.OK, None


def share_calendar(
        calendar_id,
        emails
):
    calendar_status, calendar = get_element_by_key('calendar', calendar_id)
    if calendar_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    email_failed = []
    for email in emails:
        user_status, user = get_element_by_key('user', email)
        if user_status != RESPONSE_CODE.OK:
            email_failed.append(email)
            continue

        if calendar_id not in user['calendars'] and calendar_id not in user['awaitingApprovalCalendars']:
            user['awaitingApprovalCalendars'].append(calendar_id)
            user.update({'awaitingApprovalCalendars': user['awaitingApprovalCalendars']})
            datastore_client.put(user)

    new_emails = list(set(emails) - set(email_failed))
    calendar['sharedWith'].extend(new_emails)
    calendar.update({'sharedWith': calendar['sharedWith']})
    datastore_client.put(calendar)

    query = datastore_client.query(kind='event')
    query.add_filter('calendar', '=', calendar_id)
    for event in query.fetch():
        event['sharedWith'].extend(new_emails)
        event.update({'sharedWith': event['sharedWith']})
        datastore_client.put(event)

    if email_failed:
        return RESPONSE_CODE.PARTIAL_CONTENT, email_failed

    return RESPONSE_CODE.OK, None


def share_event(
        event_id,
        emails
):
    event_status, event = get_element_by_key('event', event_id)
    if event_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    email_failed = []
    for email in emails:
        user_status, user = get_element_by_key('user', email)
        if user_status != RESPONSE_CODE.OK:
            email_failed.append(email)
            continue

        copy_event_status, _ = create_event(event['name'], event['note'], event['start'], event['end'],
                                            EVENT_STATE.AWAITING_APPROVAL, email)

        if copy_event_status != RESPONSE_CODE.OK:
            email_failed.append(email)

    if email_failed:
        return RESPONSE_CODE.PARTIAL_CONTENT, email_failed

    return RESPONSE_CODE.OK, None


def add_event_to_calendar(
        calendar_id,
        event_id
):
    calendar_status, calendar = get_element_by_key('calendar', calendar_id)
    if calendar_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    event_status, event = get_element_by_key('event', event_id)
    if event_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if event['calendar'] is not None:
        return RESPONSE_CODE.CONFLICT

    event['calendar'] = calendar_id
    event.update({'calendar': event['calendar']})
    datastore_client.put(event)

    return RESPONSE_CODE.OK


def get_element_by_key(
        kind,
        id_element
):
    element = datastore_client.get(datastore_client.key(kind, id_element))
    if element is None:
        return RESPONSE_CODE.NOT_FOUND, None
    return RESPONSE_CODE.OK, element


def fetch_event_by_date(
        start_date,
        end_date,
        state=None,
        owner=None,
        share=None,
        in_calendar=True
):
    query_after = datastore_client.query(kind='event')
    query_after.add_filter('start', '>=', int(start_date))

    query_before = datastore_client.query(kind='event')
    query_before.add_filter('end', '<=', int(end_date))

    if state is not None:
        query_after.add_filter('state', '=', state)
        query_before.add_filter('state', '=', state)
    if owner is not None:
        query_after.add_filter('owner', '=', owner)
        query_before.add_filter('owner', '=', owner)
    if share is not None:
        query_after.add_filter('sharedWith', '=', share)
        query_after.add_filter('sharedWith', '=', share)
    if not in_calendar:
        query_after.add_filter('calendar', '=', None)
        query_before.add_filter('calendar', '=', None)

    after = query_after.fetch()
    before = query_before.fetch()

    after_list = [{'id': entity.key.id, 'name': entity['name'], 'note': entity['note'], 'owner': entity['owner'],
                   'start': entity['start'], 'end': entity['end'], 'state': entity['state'],
                   'calendar': entity['calendar'] if in_calendar else None} for entity in after]
    before_list = [{'id': entity.key.id, 'name': entity['name'], 'note': entity['note'], 'owner': entity['owner'],
                    'start': entity['start'], 'end': entity['end'], 'state': entity['state'],
                    'calendar': entity['calendar'] if in_calendar else None} for entity in before]

    return RESPONSE_CODE.OK, [value for value in after_list if value in before_list]


def fetch_event_not_in_calendar_by_state(
        state,
        owner,
):
    query = datastore_client.query(kind='event')
    query.add_filter('state', '=', state)
    query.add_filter('owner', '=', owner)
    query.add_filter('calendar', '=', None)

    return RESPONSE_CODE.OK, [
        {'id': entity.key.id, 'name': entity['name'], 'note': entity['note'], 'owner': entity['owner'],
         'start': entity['start'], 'end': entity['end'], 'state': entity['state']} for entity in query.fetch()]


def fetch_event_by_calendar(
        start_date,
        end_date,
        calendar_id
):
    query_after = datastore_client.query(kind='event')
    query_after.add_filter('start', '>=', int(start_date))

    query_before = datastore_client.query(kind='event')
    query_before.add_filter('end', '<=', int(end_date))

    query_after.add_filter('calendar', '=', str(calendar_id))
    query_before.add_filter('calendar', '=', str(calendar_id))

    after = query_after.fetch()
    before = query_before.fetch()

    after_list = [{'id': entity.key.id, 'name': entity['name'], 'note': entity['note'], 'owner': entity['owner'],
                   'start': entity['start'], 'end': entity['end'], 'state': entity['state'],
                   'calendar': entity['calendar']} for entity in after]
    before_list = [{'id': entity.key.id, 'name': entity['name'], 'note': entity['note'], 'owner': entity['owner'],
                    'start': entity['start'], 'end': entity['end'], 'state': entity['state'],
                    'calendar': entity['calendar']} for entity in before]

    return RESPONSE_CODE.OK, [value for value in after_list if value in before_list]


def get_who_has_access_to_calendar(
        owner,
        calendar_id
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    if calendar_id not in user['calendars']:
        return RESPONSE_CODE.BAD_REQUEST, None

    status, calendar = get_element_by_key('calendar', calendar_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    return RESPONSE_CODE.OK, calendar['sharedWith']


def get_user_data(
        email
):
    user_status, user = get_element_by_key('user', email)
    if user_status != RESPONSE_CODE.OK:
        status, user = create_user(email)
        if status != RESPONSE_CODE.OK:
            return status, None

    calendar_list = []
    if user['calendars'] is not None:
        for calendar in user['calendars']:
            calendar_status, calendar = get_element_by_key('calendar', calendar)
            if calendar_status != RESPONSE_CODE.OK:
                return RESPONSE_CODE.NOT_FOUND, None
            calendar_list.append({'id': calendar.key.id, 'name': calendar['name'], 'owner': calendar['owner']})

    calendar_shared_list = []
    if user['calendarsShared'] is not None:
        for calendar in user['calendarsShared']:
            calendar_status, calendar = get_element_by_key('calendar', calendar)
            if calendar_status != RESPONSE_CODE.OK:
                return RESPONSE_CODE.NOT_FOUND, None
            calendar_shared_list.append({'id': calendar.key.id, 'name': calendar['name'], 'owner': calendar['owner']})

    calendar_awaiting_list = []
    if user['awaitingApprovalCalendars'] is not None:
        for calendar in user['awaitingApprovalCalendars']:
            calendar_status, calendar = get_element_by_key('calendar', calendar)
            if calendar_status != RESPONSE_CODE.OK:
                return RESPONSE_CODE.NOT_FOUND, None
            calendar_awaiting_list.append({'id': calendar.key.id, 'name': calendar['name'], 'owner': calendar['owner']})

        return RESPONSE_CODE.OK, {'email': user['email'], 'calendars': calendar_list,
                                  'calendarsShared': calendar_shared_list,
                                  'awaitingApprovalCalendars': calendar_awaiting_list}


def get_users_list(
        email
):
    query = datastore_client.query(kind='user')
    query.add_filter('email', '!=', email)
    return RESPONSE_CODE.OK, [entity['email'] for entity in query.fetch()]


def accept_calendar(
        calendar_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    if calendar_id not in user['awaitingApprovalCalendars']:
        return RESPONSE_CODE.BAD_REQUEST, None

    calendar_status, calendar = get_element_by_key('calendar', calendar_id)
    if calendar_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND, None

    user['awaitingApprovalCalendars'].remove(calendar_id)
    user['calendarsShared'].append(calendar_id)
    user.update({
        'awaitingApprovalCalendars': user['awaitingApprovalCalendars'],
        'calendarsShared': user['calendarsShared']
    })
    datastore_client.put(user)

    return RESPONSE_CODE.OK, {'id': calendar.key.id, 'name': calendar['name'], 'owner': calendar['owner']}


def accept_event(
        event_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, event = get_element_by_key('event', event_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if event['owner'] != owner:
        return RESPONSE_CODE.BAD_REQUEST

    if event['state'] != EVENT_STATE.AWAITING_APPROVAL:
        return RESPONSE_CODE.BAD_REQUEST

    event.update({'state': EVENT_STATE.COMPLETED})
    datastore_client.put(event)

    return RESPONSE_CODE.OK


def reject_calendar(
        calendar_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, calendar = get_element_by_key('calendar', calendar_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if calendar_id not in user['awaitingApprovalCalendars']:
        return RESPONSE_CODE.BAD_REQUEST

    user['awaitingApprovalCalendars'].remove(calendar_id)
    user.update({'awaitingApprovalCalendars': user['awaitingApprovalCalendars']})
    datastore_client.put(user)

    calendar['sharedWith'].remove(owner)
    calendar.update({'sharedWith': calendar['sharedWith']})
    datastore_client.put(calendar)

    return RESPONSE_CODE.OK


def reject_event(
        event_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, event = get_element_by_key('event', event_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if event['owner'] != owner:
        return RESPONSE_CODE.BAD_REQUEST

    if event['state'] != EVENT_STATE.AWAITING_APPROVAL:
        return RESPONSE_CODE.BAD_REQUEST

    datastore_client.delete(event.key)

    return RESPONSE_CODE.OK


def delete_event(
        event_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, event = get_element_by_key('event', event_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if event['owner'] != owner:
        return RESPONSE_CODE.BAD_REQUEST

    if event['state'] != EVENT_STATE.COMPLETED:
        return RESPONSE_CODE.BAD_REQUEST

    datastore_client.delete(event.key)

    return RESPONSE_CODE.OK


def delete_calendar(
        calendar_id,
        owner
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, calendar = get_element_by_key('calendar', calendar_id)
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if calendar_id in user['calendarsShared']:
        user['calendarsShared'].remove(calendar_id)
        user.update({'calendarsShared': user['calendarsShared']})
        datastore_client.put(user)

        query = datastore_client.query(kind='event')
        query.add_filter('calendar', '=', str(calendar_id))

        events = []
        for event in query.fetch():
            event['sharedWith'].remove(owner)
            event.update({'sharedWith': event['sharedWith']})
            events.append(event)
        datastore_client.put_multi(events)

        calendar['sharedWith'].remove(owner)
        calendar.update({'sharedWith': calendar['sharedWith']})
        datastore_client.put(calendar)

        return RESPONSE_CODE.OK

    if calendar_id in user['calendars']:
        user['calendars'].remove(calendar_id)
        user.update({'calendars': user['calendars']})
        datastore_client.put(user)

    for user_email in calendar['sharedWith']:
        user_status, user = get_element_by_key('user', user_email)
        if user_status != RESPONSE_CODE.OK:
            return RESPONSE_CODE.NOT_FOUND

        if calendar_id in user['calendarsShared']:
            user['calendarsShared'].remove(calendar_id)
            user.update({'calendarsShared': user['calendarsShared']})
            datastore_client.put(user)

        if calendar_id in user['awaitingApprovalCalendars']:
            user['awaitingApprovalCalendars'].remove(calendar_id)
            user.update({'awaitingApprovalCalendars': user['awaitingApprovalCalendars']})
            datastore_client.put(user)

    query = datastore_client.query(kind='event')
    query.add_filter('calendar', '=', str(calendar_id))
    datastore_client.delete_multi([entity.key for entity in query.fetch()])

    datastore_client.delete(calendar.key)

    return RESPONSE_CODE.OK


def edit_event(
        owner,
        event_id,
        name,
        start,
        end,
        note,
        calendar_id=None
):
    user_status, user = get_element_by_key('user', owner)
    if user_status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    status, event = get_element_by_key('event', int(event_id))
    if status != RESPONSE_CODE.OK:
        return RESPONSE_CODE.NOT_FOUND

    if event['owner'] != owner:
        return RESPONSE_CODE.BAD_REQUEST

    if event['state'] != EVENT_STATE.COMPLETED:
        return RESPONSE_CODE.BAD_REQUEST

    start = int(start)
    end = int(end)

    if start > end:
        return RESPONSE_CODE.BAD_REQUEST

    event.update({
        'name': name,
        'start': start,
        'end': end,
        'note': note
    })

    if calendar_id is not None:
        calendar_status, calendar = get_element_by_key('calendar', calendar_id)
        if calendar_status != RESPONSE_CODE.OK:
            return RESPONSE_CODE.NOT_FOUND

        if calendar_id not in user['calendars']:
            return RESPONSE_CODE.BAD_REQUEST

        event.update({'calendar': calendar_id})
    else:
        event.update({'calendar': None})

    datastore_client.put(event)

    return RESPONSE_CODE.OK
