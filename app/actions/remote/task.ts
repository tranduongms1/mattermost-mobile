// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceEventEmitter} from 'react-native';

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getPostById} from '@queries/servers/post';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

export const fetchTasksForChannel = async (serverUrl: string, channelId: string, type: string, statuses: string[], page = 0) => {
    try {
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        let postsArray: Post[] = [];
        const data = await client.doFetch(
            `${client.getChannelRoute(channelId)}/tasks?type=${type}&${statuses.map((s) => 'status[]=' + s).join('&')}&page=${page}&per_page=60`,
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
            await operator.batchRecords(models, 'fetchTasksForChannel');
        }
        return {
            order,
            posts: postsArray,
        };
    } catch (error) {
        logDebug('error on fetchTasksForChannel', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const getChannelTaskCount = async (serverUrl: string, channelId: string, type: string, statuses: string[]) => {
    const client = NetworkManager.getClient(serverUrl);
    const data = await client.doFetch(
        `${client.getChannelRoute(channelId)}/tasks/count?type=${type}&${statuses.map((s) => 'status[]='+s).join('&')}`,
        {method: 'get'},
    ) as any;
    return data.count;
};

export const fetchMyTasks = async (serverUrl: string, type: string, statuses: string[], page = 0) => {
    try {
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        let postsArray: Post[] = [];
        const data = await client.doFetch(
            `${client.getUserRoute('me')}/tasks?type=${type}&${statuses.map((s) => 'status[]=' + s).join('&')}&page=${page}&per_page=60`,
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
            await operator.batchRecords(models, 'fetchMyTasks');
        }
        return {
            order,
            posts: postsArray,
        };
    } catch (error) {
        logDebug('error on fetchMyTasks', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const getMyTaskCount = async (serverUrl: string, type: string, statuses: string[]) => {
    const client = NetworkManager.getClient(serverUrl);
    const data = await client.doFetch(
        `${client.getUserRoute('me')}/tasks/count?type=${type}&${statuses.map((s) => 'status[]='+s).join('&')}`,
        {method: 'get'},
    ) as any;
    return data.count;
};

export const updateTask = async (serverUrl: string, id: string, patch: any) => {
    try {
        const {database} = await DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        const data = await client.doFetch(
            client.urlVersion + '/tasks/' + id,
            {method: 'patch', body: patch},
        ) as any;
        const post = await getPostById(database, id);
        await database.write(async () => {
            await post!.update((p) => {
                p.props = {...p.props, ...patch};
            });
        });
        if (patch.status) {
            DeviceEventEmitter.emit('TASK_STATUS_UPDATED', {id, patch});
        }
        return data;
    } catch (error) {
        logDebug('error on updateTask', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};
