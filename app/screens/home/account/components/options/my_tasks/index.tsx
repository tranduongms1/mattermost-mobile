// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter} from 'react-native';

import {getMyTaskCount} from '@actions/remote/task';
import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {useServerUrl} from '@context/server';
import WebsocketManager from '@managers/websocket_manager';
import {goToScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const MyTasks = () => {
    const serverUrl = useServerUrl();
    const [count, setCount] = useState<number>(0);

    const fetchCount = useCallback(async () => {
        const result = await getMyTaskCount(serverUrl, 'to_me', ['new', 'confirmed']);
        setCount(result);
    }, [serverUrl]);

    useEffect(() => {
        fetchCount();
        const client: any = WebsocketManager.getClient(serverUrl);
        const callback = client.eventCallback;
        client?.setEventCallback((evt: WebSocketMessage) => {
            if (evt.event === 'posted') {
                const post = JSON.parse(evt.data.post);
                if (post.type === 'custom_task' || post.type === 'custom_task_updated') {
                    fetchCount();
                }
            }
            callback(serverUrl, evt);
        });
        const listener = DeviceEventEmitter.addListener('TASK_STATUS_UPDATED', fetchCount);
        return () => {
            client?.setEventCallback(callback);
            listener.remove();
        };
    }, [serverUrl, fetchCount]);

    const openMyTasks = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.MY_TASKS,
            'Công việc của tôi',
        );
    }), []);

    return (
        <OptionItem
            action={openMyTasks}
            icon='product-playbooks'
            label='Công việc của tôi'
            info={count > 0 ? String(count) : undefined}
            type='default'
        />
    );
};

export default MyTasks;
