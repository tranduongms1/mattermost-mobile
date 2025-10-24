// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observePost, queryPostsById} from '@queries/servers/post';
import {observeCurrentUserId} from '@queries/servers/system';

import Plan from './plan';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhance = withObservables(['id'], ({database, id}: WithDatabaseArgs & {id: string}) => {
    const post = observePost(database, id);
    const channelDisplayName = post.pipe(
        switchMap((p) => (p ? observeChannel(database, p.channelId) : of$(null))),
        switchMap((c) => of$(c?.displayName)),
    );
    const currentUserId = observeCurrentUserId(database);
    const getPosts = (ids: string[]) => (ids ? queryPostsById(database, ids).observeWithColumns(['props']) : of$([]));
    const troubles = post.pipe(
        switchMap((p) => (p ? getPosts(p.props!.troubles as any) : of$([]))),
    );
    const issues = post.pipe(
        switchMap((p) => (p ? getPosts(p.props!.issues as any) : of$([]))),
    );

    return {
        channelDisplayName,
        currentUserId,
        post,
        troubles,
        issues,
    };
});

export default withDatabase(enhance(Plan));
