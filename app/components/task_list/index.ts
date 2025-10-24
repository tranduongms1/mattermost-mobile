// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {queryPostsById} from '@queries/servers/post';

import TaskList from './task_list';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = {
    ids: string[];
    statuses?: string[];
}

const enhance = withObservables(['ids'], ({database, ids, statuses = []}: WithDatabaseArgs & OwnProps) => {
    const filterByStatus = (post: any) => statuses.includes(post.props.status);
    const sort = (a: any, b: any) => {
        if (!statuses.includes('completed')) {
            if (a.props.priority && !b.props.priority) {
                return -1;
            }
            if (!a.props.priority && b.props.priority) {
                return 1;
            }
        }
        return b.updateAt - a.updateAt;
    };

    const posts = queryPostsById(database, ids).observeWithColumns(['props', 'update_at']).pipe(
        switchMap((list) => of$(list.filter(filterByStatus).sort(sort))),
    );

    return {
        posts,
    };
});

export default withDatabase(enhance(TaskList));
