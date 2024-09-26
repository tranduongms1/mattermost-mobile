// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {General} from '@constants';
import {observeChannel} from '@queries/servers/channel';
import {observePost, queryPostReplies} from '@queries/servers/post';
import {querySavedPostsPreferences} from '@queries/servers/preference';

import ThreadOverview from './thread_overview';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables(
    ['rootId'],
    ({database, rootId}: WithDatabaseArgs & {rootId: string}) => {
        return {
            rootPost: observePost(database, rootId),
            isArticle: observePost(database, rootId).pipe(
                switchMap((p) => (p ? observeChannel(database, p.channelId) : of$(undefined))),
                switchMap((c) => of$(c?.name === General.DEFAULT_CHANNEL)),
            ),
            isSaved: querySavedPostsPreferences(database, rootId).
                observeWithColumns(['value']).
                pipe(
                    switchMap((pref) => of$(Boolean(pref[0]?.value === 'true'))),
                ),
            repliesCount: queryPostReplies(database, rootId).observeCount(false),
        };
    });

export default withDatabase(enhanced(ThreadOverview));
