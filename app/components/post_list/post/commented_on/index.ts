// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observePost, observePostAuthor} from '@queries/servers/post';
import {observeTeammateNameDisplay} from '@queries/servers/user';

import CommentedOn from './commented_on';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

const enhanced = withObservables(['post'], ({database, post}: WithDatabaseArgs & {post: PostModel}) => {
    const root = observePost(database, post.rootId);
    const rootAuthor = root.pipe(
        switchMap((p) => (p ? observePostAuthor(database, p) : of$(undefined))),
    );
    const teammateNameDisplay = observeTeammateNameDisplay(database);

    return {
        root,
        rootAuthor,
        teammateNameDisplay,
    };
});

export default withDatabase(enhanced(CommentedOn));
