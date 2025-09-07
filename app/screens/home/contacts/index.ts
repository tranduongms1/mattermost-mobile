// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import {observeCurrentUserId} from '@queries/servers/system';
import {observeContacts, observeTeammateNameDisplay} from '@queries/servers/user';

import ContactsScreen from './contacts';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => {
    return {
        contacts: observeContacts(database),
        teammateNameDisplay: observeTeammateNameDisplay(database),
        currentUserId: observeCurrentUserId(database),
    };
});

export default withDatabase(enhanced(ContactsScreen));
