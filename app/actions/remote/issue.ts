// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceEventEmitter} from 'react-native';

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getPostById} from '@queries/servers/post';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

type GetIssuesOptions = {
    channelId?: string;
    statuses?: string[];
    type?: string;
}

export async function fetchTechnicalChannels(serverUrl: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);

        const channels = await client.doFetch('/plugins/xerp/api/channels', {method: 'get'}) as any;
        await operator.handleChannel({channels, prepareRecordsOnly: false});

        return {channels};
    } catch (error) {
        logDebug('error on fetchTechnicalChannels', getFullErrorMessage(error));
        return {error};
    }
}

const getURLSearchParams = (options: GetIssuesOptions) => {
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

export const fetchIssues = async (serverUrl: string, options: GetIssuesOptions) => {
    try {
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        let postsArray: Post[] = [];
        const data = await client.doFetch(
            `/plugins/xerp/api/issues?${getURLSearchParams(options)}`,
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
            await operator.batchRecords(models, 'fetchIssues');
        }
        return {
            order,
            posts: postsArray,
        };
    } catch (error) {
        logDebug('error on fetchIssues', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const getIssuesCount = async (serverUrl: string, options: GetIssuesOptions) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const data = await client.doFetch(
            `/plugins/xerp/api/issues/count?${getURLSearchParams(options)}`,
            {method: 'get'},
        ) as {count: number};
        return data.count;
    } catch (error) {
        logDebug('error on fetchIssues', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};

export const patchIssue = async (serverUrl: string, id: string, patch: any) => {
    try {
        const {database} = await DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const client = NetworkManager.getClient(serverUrl);
        const data = await client.doFetch(
            `/plugins/xerp/api/issues/${id}`,
            {method: 'patch', body: patch},
        ) as any;
        const post = await getPostById(database, id);
        await database.write(async () => {
            await post!.update((p) => {
                p.props = {...p.props, ...patch};
            });
        });
        DeviceEventEmitter.emit('ISSUE_UPDATED', {id, patch});
        return data;
    } catch (error) {
        logDebug('error on fetchIssues', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};
