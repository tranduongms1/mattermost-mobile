// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import {observePost} from '@queries/servers/post';

import IssueUpdated from './issue_updated';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhanced = withObservables(['post'], ({database, post}: WithDatabaseArgs & {post: PostModel}) => {
    const root = observePost(database, post.rootId);
    return {
        root,
    };
});

export default withDatabase(enhanced(IssueUpdated));
