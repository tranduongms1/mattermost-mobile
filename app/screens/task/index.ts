// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {Preferences} from '@constants';
import {observeChannel} from '@queries/servers/channel';
import {observePost} from '@queries/servers/post';
import {getUserById, queryUsersByIdsOrUsernames} from '@queries/servers/user';
import {displayUsername} from '@utils/user';

import Task from './task';

import type {WithDatabaseArgs} from '@typings/database/database';

const displayName = (user: any) => displayUsername(user, 'vi', Preferences.DISPLAY_PREFER_NICKNAME);

const enhance = withObservables(['id'], ({database, id}: WithDatabaseArgs & {id: string}) => {
    const post = observePost(database, id);
    const channelDisplayName = post.pipe(
        switchMap((p) => (p ? observeChannel(database, p.channelId) : of$(undefined))),
        switchMap((c) => of$(c?.displayName)),
    );
    const assigneeNames = post.pipe(
        switchMap((p) => {
            const ids = p?.props.assignee_ids || [];
            return queryUsersByIdsOrUsernames(database, ids, []).observe();
        }),
        switchMap((users) => of$(users.map(displayName))),
        switchMap((names) => of$(names.join(', '))),
    );
    const managerNames = post.pipe(
        switchMap((p) => {
            const ids = p?.props.manager_ids || [];
            return queryUsersByIdsOrUsernames(database, ids, []).observe();
        }),
        switchMap((users) => of$(users.map(displayName))),
        switchMap((names) => of$(names.join(', '))),
    );

    return {
        channelDisplayName,
        post,
        assigneeNames,
        managerNames,
        creator: post.pipe(
            switchMap((p) => getUserById(database, p?.props.creator_id)),
        ),
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
