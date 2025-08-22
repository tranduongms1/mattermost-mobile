// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {switchMap} from 'rxjs/operators';

import {getDefaultChannelForTeam} from '@queries/servers/channel';
import {observeCurrentTeamId} from '@queries/servers/system';

import DefaultChannel from './default_channel';

import type {WithDatabaseArgs} from '@typings/database/database';

const enchanced = withObservables([], ({database}: WithDatabaseArgs) => {
    const currentTeamId = observeCurrentTeamId(database);
    const channel = currentTeamId.pipe(switchMap((teamId) => getDefaultChannelForTeam(database, teamId)));

    return {
        channel,
    };
});

export default withDatabase(enchanced(DefaultChannel));
