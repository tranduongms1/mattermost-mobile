// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {DeviceEventEmitter, Text, TouchableOpacity, View} from 'react-native';

import {getChannelTaskCount} from '@actions/remote/task';
import {handleWebSocketEvent} from '@actions/websocket/event';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import WebsocketManager from '@managers/websocket_manager';
import {goToScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

type ChannelProps = {
    channelId: string;
    displayName: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        borderBottomWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.20),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 16,
    },
    text: {
        color: theme.centerChannelColor,
        fontSize: 16,
    },
    count: {
        backgroundColor: 'red',
        borderRadius: 7,
        color: 'white',
        fontSize: 10,
        lineHeight: 14,
        minWidth: 14,
        overflow: 'hidden',
        paddingHorizontal: 2,
        position: 'absolute',
        textAlign: 'center',
        top: 5,
        right: 3,
    },
}));

const TechnicalActions = ({
    channelId,
    displayName,
}: ChannelProps) => {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [counts, setCounts] = useState<any>({});

    const fetchData = async () => {
        Promise.all([
            getChannelTaskCount(serverUrl, channelId, 'trouble', ['new', 'confirmed']),
            getChannelTaskCount(serverUrl, channelId, 'trouble', ['done']),
            getChannelTaskCount(serverUrl, channelId, 'issue', ['new', 'confirmed']),
            getChannelTaskCount(serverUrl, channelId, 'issue', ['done']),
            getChannelTaskCount(serverUrl, channelId, 'plan', ['new', 'confirmed']),
            getChannelTaskCount(serverUrl, channelId, 'plan', ['done']),
        ]).then((res) => setCounts({
            troubles: res[0],
            doneTroubles: res[1],
            issues: res[2],
            doneIssues: res[3],
            plans: res[4],
            donePlans: res[5],
        }));
    };

    useEffect(() => {
        fetchData();
        const client = WebsocketManager.getClient(serverUrl);
        client?.setEventCallback((evt: WebSocketMessage) => {
            if (evt.event === 'posted') {
                const post = JSON.parse(evt.data.post);
                if (['custom_trouble', 'custom_issue', 'custom_plan'].includes(post.type)) {
                    fetchData();
                }
                if (post.type == 'custom_task_updated') {
                    if (post.channel_id == channelId && ['trouble', 'issue', 'plan'].includes(post.props.task_type)) {
                        fetchData();
                    }
                }
            }
            handleWebSocketEvent(serverUrl, evt);
        });
        const listener = DeviceEventEmitter.addListener('TASK_STATUS_UPDATED', fetchData);
        return () => {
            client?.setEventCallback((evt: WebSocketMessage) => handleWebSocketEvent(serverUrl, evt));
            listener.remove();
        };
    }, [serverUrl, channelId]);

    const getOptions = (title: string) => ({
        topBar: {
            title: {
                text: title,
            },
            subtitle: {
                color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
                text: displayName,
            },
        },
    });

    const {doneTroubles = 0, doneIssues = 0, donePlans = 0} = counts;
    const doneCount = doneTroubles + doneIssues + donePlans;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => goToScreen(Screens.CHANNEL_TROUBLES, '',
                    {channelId, statuses: ['new', 'confirmed']},
                    getOptions('Trouble'),
                )}
            >
                <Text style={styles.text}>{'Trouble'}</Text>
                {Boolean(counts.troubles) &&
                <Text style={styles.count}>{counts.troubles}</Text>
                }
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => goToScreen(Screens.CHANNEL_ISSUES, '',
                    {channelId, statuses: ['new', 'confirmed']},
                    getOptions('Sự cố'),
                )}
            >
                <Text style={styles.text}>{'Sự cố'}</Text>
                {Boolean(counts.issues) &&
                <Text style={styles.count}>{counts.issues}</Text>
                }
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.text}>{'Định kỳ'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => goToScreen(Screens.CHANNEL_PLANS, '',
                    {channelId, statuses: ['new', 'confirmed']},
                    getOptions('Việc kế hoạch'),
                )}
            >
                <Text style={styles.text}>{'Kế hoạch'}</Text>
                {Boolean(counts.plans) &&
                <Text style={styles.count}>{counts.plans}</Text>
                }
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => goToScreen(Screens.CHANNEL_DONE_TASKS, '',
                    {channelId, displayName},
                    getOptions('Việc đã xong'),
                )}
            >
                <Text style={styles.text}>{'Xong'}</Text>
                {Boolean(doneCount) &&
                <Text style={styles.count}>{doneCount}</Text>
                }
            </TouchableOpacity>
        </View>
    );
};

export default TechnicalActions;
