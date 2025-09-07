// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import {queryUsersOnChannel} from '@queries/servers/channel';

import GmAvatar from './gm_avatar';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhance = withObservables(['channelId'], ({channelId, database}: {channelId: string} & WithDatabaseArgs) => {
    const users = queryUsersOnChannel(database, channelId).extend(Q.take(4)).observe();
    const count = queryUsersOnChannel(database, channelId).observeCount();

    return {
        users,
        count,
    };
});

export default withDatabase(enhance(GmAvatar));
