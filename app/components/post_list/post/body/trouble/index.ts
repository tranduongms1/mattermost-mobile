// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel, observeChannelMembers} from '@queries/servers/channel';

import Trouble from './trouble';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhance = withObservables(['post'], ({post, database}: {post: PostModel} & WithDatabaseArgs) => {
    const channelDisplayName = observeChannel(database, post.channelId).pipe(
        switchMap((c) => of$(c?.displayName)),
    );
    const isChannelMember = observeChannelMembers(database, post.channelId).pipe(
        switchMap((cm) => of$(cm.length > 0)),
    );

    return {
        channelDisplayName,
        isChannelMember,
    };
});

export default withDatabase(enhance(Trouble));
