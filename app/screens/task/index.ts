// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observePost} from '@queries/servers/post';
import {getUserById} from '@queries/servers/user';

import Task from './task';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhance = withObservables(['id'], ({database, id}: WithDatabaseArgs & {id: string}) => {
    const post = observePost(database, id);
    const channelDisplayName = post.pipe(
        switchMap((p) => (p ? observeChannel(database, p.channelId) : of$(undefined))),
        switchMap((c) => of$(c?.displayName)),
    );
    return {
        channelDisplayName,
        post,
        confirmedBy: post.pipe(
            switchMap((p) => getUserById(database, p?.props.confirmed_by)),
        ),
        doneBy: post.pipe(
            switchMap((p) => getUserById(database, p?.props.done_by)),
        ),
        completedBy: post.pipe(
            switchMap((p) => getUserById(database, p?.props.completed_by)),
        ),
        restoredBy: post.pipe(
            switchMap((p) => getUserById(database, p?.props.restored_by)),
        ),
        priorityBy: post.pipe(
            switchMap((p) => getUserById(database, p?.props.priority_by)),
        ),
    };
});

export default withDatabase(enhance(Task));
