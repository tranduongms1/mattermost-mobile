// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';

import {queryUsersByIdsOrUsernames} from '@queries/servers/user';

import DisplayName from './display_name';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhance = withObservables(['ids'], ({database, ids}: WithDatabaseArgs & {ids: string[]}) => {
    const filtered = (ids || []).filter((id) => id);
    const users = filtered.length ? queryUsersByIdsOrUsernames(database, ids, []).observe() : of$([]);

    return {
        users,
    };
});

export default withDatabase(enhance(DisplayName));
