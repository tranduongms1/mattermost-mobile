// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {DEFAULT_SERVER_MAX_FILE_SIZE} from '@constants/post_draft';
import {observeTechnicalChannels} from '@queries/servers/channel';
import {queryDraft, observeFirstDraft} from '@queries/servers/drafts';
import {observeCanUploadFiles} from '@queries/servers/security';
import {observeConfigIntValue, observeCurrentChannelId, observeCurrentUserId, observeMaxFileCount} from '@queries/servers/system';

import CreateIssue from './create_issue';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => {
    const channels = observeTechnicalChannels(database);
    const currentChannelId = observeCurrentChannelId(database);
    const currentUserId = observeCurrentUserId(database);

    const canUploadFiles = observeCanUploadFiles(database);
    const maxFileCount = observeMaxFileCount(database);
    const maxFileSize = observeConfigIntValue(database, 'MaxFileSize', DEFAULT_SERVER_MAX_FILE_SIZE);

    const draft = currentChannelId.pipe(
        switchMap((cId) => queryDraft(database, cId, 'issue').observeWithColumns(['files']).pipe(
            switchMap(observeFirstDraft),
        )),
    );

    const files = draft.pipe(switchMap((d) => of$(d?.files || [])));

    return {
        channels,
        currentChannelId,
        currentUserId,
        canUploadFiles,
        maxFileCount,
        maxFileSize,
        files,
    };
});

export default withDatabase(enhanced(CreateIssue));
