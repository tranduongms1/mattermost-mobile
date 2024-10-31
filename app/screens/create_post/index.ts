// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {DEFAULT_SERVER_MAX_FILE_SIZE} from '@constants/post_draft';
import {queryDraft, observeFirstDraft} from '@queries/servers/drafts';
import {observeConfigIntValue, observeCurrentUserId, observeMaxFileCount} from '@queries/servers/system';

import CreatePost from './create_post';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = {
    channelId: string;
}
const enhanced = withObservables(['channelId'], ({database, channelId}: WithDatabaseArgs & OwnProps) => {
    const currentUserId = observeCurrentUserId(database);

    const maxFileCount = observeMaxFileCount(database);
    const maxFileSize = observeConfigIntValue(database, 'MaxFileSize', DEFAULT_SERVER_MAX_FILE_SIZE);

    const draft = queryDraft(database, channelId, '').observeWithColumns(['files']).pipe(
        switchMap(observeFirstDraft),
    );

    const files = draft.pipe(switchMap((d) => of$(d?.files || [])));

    return {
        currentUserId,
        maxFileCount,
        maxFileSize,
        files,
    };
});

export default withDatabase(enhanced(CreatePost));
