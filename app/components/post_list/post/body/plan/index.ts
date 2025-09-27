// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {Preferences} from '@constants';
import {observeChannel} from '@queries/servers/channel';
import {queryPostsById} from '@queries/servers/post';
import {observeUser} from '@queries/servers/user';
import {displayUsername} from '@utils/user';

import Plan from './plan';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhance = withObservables(['post'], ({post, database}: {post: PostModel} & WithDatabaseArgs) => {
    const props = post.props || {} as any;
    const channelDisplayName = observeChannel(database, post.channelId).pipe(
        switchMap((c) => of$(c?.displayName)),
    );
    const displayName = (user: any) => displayUsername(user, 'vi', Preferences.DISPLAY_PREFER_NICKNAME);
    const creatorName = observeUser(database, props.creator_id).pipe(
        switchMap((u) => of$(displayName(u))),
    );

    const troubles = props.troubles ? queryPostsById(database, props.troubles).observeWithColumns(['props']) : of$([]);
    const issues = props.issues ? queryPostsById(database, props.issues).observeWithColumns(['props']) : of$([]);

    return {
        channelDisplayName,
        creatorName,
        troubles,
        issues,
    };
});

export default withDatabase(enhance(Plan));
