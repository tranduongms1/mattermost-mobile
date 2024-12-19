// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {queryPostsById} from '@queries/servers/post';

import TaskList from './list';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

type OwnProps = {
    ids: string[];
    statuses?: string[];
}

const enhance = withObservables(['ids'], ({database, ids, statuses = []}: WithDatabaseArgs & OwnProps) => {
    const filterByStatus = (post: PostModel) => statuses.includes(post.props.status);
    const sort = (a: PostModel, b: PostModel) => {
        if (statuses[0] !== 'completed') {
            if (a.props.priority && !b.props.priority) {
                return -1;
            }
            if (!a.props.priority && b.props.priority) {
                return 1;
            }
        }
        return b.updateAt - a.updateAt;
    };

    const tasks = queryPostsById(database, ids).observeWithColumns(['props', 'update_at']).pipe(
        switchMap((posts) => of$(posts.filter(filterByStatus).sort(sort))),
    );

    return {
        tasks,
    };
});

export default withDatabase(enhance(TaskList));
