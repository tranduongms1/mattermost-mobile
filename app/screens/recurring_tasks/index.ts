// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observePost} from '@queries/servers/post';
import {observeCurrentUserId} from '@queries/servers/system';

import RecurringTasks from './recurring_tasks';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhance = withObservables(['id'], ({database, id}: WithDatabaseArgs & {id: string}) => {
    const post = observePost(database, id);
    const channelDisplayName = post.pipe(
        switchMap((p) => (p ? observeChannel(database, p.channelId) : of$(null))),
        switchMap((c) => of$(c?.displayName)),
    );
    const currentUserId = observeCurrentUserId(database);

    return {
        channelDisplayName,
        currentUserId,
        post,
    };
});

export default withDatabase(enhance(RecurringTasks));
