// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {Preferences} from '@constants';
import {observeChannel} from '@queries/servers/channel';
import {observeUser} from '@queries/servers/user';
import {displayUsername} from '@utils/user';

import Task from './task';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhance = withObservables(['post'], ({post, database}: {post: PostModel} & WithDatabaseArgs) => {
    const channelDisplayName = observeChannel(database, post.channelId).pipe(
        switchMap((c) => of$(c?.displayName)),
    );
    const displayName = (user: any) => displayUsername(user, 'vi', Preferences.DISPLAY_PREFER_NICKNAME);
    const creatorName = observeUser(database, post.props.creator_id).pipe(
        switchMap((u) => of$(displayName(u))),
    );

    return {
        channelDisplayName,
        creatorName,
    };
});

export default withDatabase(enhance(Task));