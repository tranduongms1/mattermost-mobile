// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {DEFAULT_SERVER_MAX_FILE_SIZE} from '@constants/post_draft';
import {observeCurrentChannel} from '@queries/servers/channel';
import {queryDraft, observeFirstDraft} from '@queries/servers/drafts';
import {observeCanUploadFiles} from '@queries/servers/security';
import {observeConfigIntValue, observeCurrentChannelId, observeCurrentUserId, observeMaxFileCount} from '@queries/servers/system';

import CreateTask from './create_task';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => {
    const currentChannelId = observeCurrentChannelId(database);
    const currentUserId = observeCurrentUserId(database);

    const channelDisplayName = observeCurrentChannel(database).pipe(
        switchMap((c) => of$(c?.displayName)),
    );

    const canUploadFiles = observeCanUploadFiles(database);
    const maxFileCount = observeMaxFileCount(database);
    const maxFileSize = observeConfigIntValue(database, 'MaxFileSize', DEFAULT_SERVER_MAX_FILE_SIZE);

    const draft = currentChannelId.pipe(
        switchMap((cId) => queryDraft(database, cId, 'task').observeWithColumns(['files', 'props']).pipe(
            switchMap(observeFirstDraft),
        )),
    );

    const files = draft.pipe(switchMap((d) => of$(d?.files || [])));
    const props = draft.pipe(switchMap((d) => of$(d?.props || {})));

    return {
        currentChannelId,
        currentUserId,
        channelDisplayName,
        canUploadFiles,
        maxFileCount,
        maxFileSize,
        files,
        props,
    };
});

export default withDatabase(enhanced(CreateTask));
