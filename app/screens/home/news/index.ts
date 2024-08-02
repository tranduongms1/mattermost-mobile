// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React from 'react';
import {combineLatest, of as of$} from 'rxjs';
import {switchMap, distinctUntilChanged} from 'rxjs/operators';

import {General} from '@constants';
import {getChannelByName, observeMyChannel} from '@queries/servers/channel';
import {queryPostsBetween, queryPostsInChannel} from '@queries/servers/post';
import {queryTeamByName} from '@queries/servers/team';

import NewsScreen from './news';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => {
    const channelId = queryTeamByName(database, 'emotion').observe().pipe(
        switchMap((ts) => getChannelByName(database, ts[0].id, General.DEFAULT_CHANNEL)),
        switchMap((ch) => of$(ch!.id)),
    );
    const myChannel = channelId.pipe(
        switchMap((id) => observeMyChannel(database, id)),
    );
    const postsInChannelObserver = channelId.pipe(
        switchMap((id) => queryPostsInChannel(database, id).observeWithColumns(['earliest', 'latest'])),
    );

    return {
        channelId,
        lastViewedAt: myChannel.pipe(
            switchMap((cm) => of$(cm?.viewedAt)),
            distinctUntilChanged(),
        ),
        posts: combineLatest([channelId, postsInChannelObserver]).pipe(
            switchMap(([id, postsInChannel]) => {
                if (!postsInChannel.length) {
                    return of$([]);
                }

                const {earliest, latest} = postsInChannel[0];
                return queryPostsBetween(database, earliest, latest, Q.desc, '', id, '').observe();
            }),
        ),
    };
});

export default React.memo(withDatabase(enhanced(NewsScreen)));
