// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';

import Issue from './issue';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhance = withObservables(['post'], ({post, database}: {post: PostModel} & WithDatabaseArgs) => {
    const channel = observeChannel(database, post.channelId);

    return {
        displayName: channel.pipe(switchMap((c) => of$(c?.displayName))),
    };
});

export default withDatabase(enhance(Issue));
