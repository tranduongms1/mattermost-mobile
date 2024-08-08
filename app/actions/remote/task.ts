// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

type GetTasksOptions = {
    channelId?: string;
    statuses?: string[];
    type?: string;
}

const getURLSearchParams = (options: GetTasksOptions) => {
    const params = new URLSearchParams();
    if (options.channelId) {
        params.append('channel_id', options.channelId);
    }
    if (options.statuses) {
        for (const s of options.statuses) {
            params.append('status[]', s);
        }
    }
    if (options.type) {
        params.append('type', options.type);
    }
    return params;
};

export const fetchTasks = async (serverUrl: string, options: GetTasksOptions) => {
    try {
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        let postsArray: Post[] = [];
        const data = await client.doFetch(
            `/plugins/xerp/api/tasks?${getURLSearchParams(options)}`,
            {method: 'get'},
        ) as PostResponse;

        const posts = data.posts || {};
        const order = data.order || [];

        postsArray = order.map((id) => posts[id]);
        if (postsArray.length) {
            const models = await operator.handlePosts({
                actionType: '',
                order: [],
                posts: postsArray,
                previousPostId: '',
                prepareRecordsOnly: true,
            });
            await operator.batchRecords(models, 'fetchTasks');
        }
        return {
            order,
            posts: postsArray,
        };
    } catch (error) {
        logDebug('error on fetchTasks', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const getTasksCount = async (serverUrl: string, options: GetTasksOptions) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const data = await client.doFetch(
            `/plugins/xerp/api/tasks/count?${getURLSearchParams(options)}`,
            {method: 'get'},
        ) as {count: number};
        return data.count;
    } catch (error) {
        logDebug('error on getTasksCount', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const patchTask = async (serverUrl: string, id: string, patch: any) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const data = await client.doFetch(
            `/plugins/xerp/api/tasks/${id}`,
            {method: 'patch', body: patch},
        ) as any;
        return data;
    } catch (error) {
        logDebug('error on patchTask', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};
