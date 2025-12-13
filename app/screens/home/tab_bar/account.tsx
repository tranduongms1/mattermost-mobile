// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, View} from 'react-native';

import {getMyTaskCount} from '@actions/remote/task';
import Badge from '@components/badge';
import CompassIcon from '@components/compass_icon';
import {BOTTOM_TAB_ICON_SIZE} from '@constants/view';
import {useServerUrl} from '@context/server';
import WebsocketManager from '@managers/websocket_manager';
import {changeOpacity} from '@utils/theme';

type Props = {
    isFocused: boolean;
    theme: Theme;
}

const Account = ({isFocused, theme}: Props) => {
    const serverUrl = useServerUrl();
    const [count, setCount] = useState<number>(0);

    const fetchCount = useCallback(async () => {
        const result = await getMyTaskCount(serverUrl, 'to_me', ['new', 'confirmed']);
        setCount(result);
    }, [serverUrl, isFocused]);

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

    let badgeStyle = {left: 14, top: 4};

    return (
        <View>
            <CompassIcon
                size={BOTTOM_TAB_ICON_SIZE}
                name='account-outline'
                color={isFocused ? theme.buttonBg : changeOpacity(theme.centerChannelColor, 0.48)}
            />
            <Badge
                backgroundColor={theme.buttonBg}
                borderColor={theme.centerChannelBg}
                color={theme.buttonColor}
                style={badgeStyle}
                visible={!isFocused && count > 0}
                value={count}
            />
        </View>
    );
};

export default Account;
