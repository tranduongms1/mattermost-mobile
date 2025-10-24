// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {fetchMyTasks, getMyTaskCount} from '@actions/remote/task';
import {handleWebSocketEvent} from '@actions/websocket/event';
import TaskList from '@components/task_list';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import WebsocketManager from '@managers/websocket_manager';
import {popTopScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    channelId?: string;
    componentId: AvailableScreens;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        borderBottomWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.20),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
    },
    button: {
        paddingHorizontal: 4,
        paddingVertical: 16,
    },
    text: {
        color: theme.centerChannelColor,
        fontSize: 16,
    },
    active: {
        color: theme.linkColor,
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
        right: 0,
    },
}));

const TABS = [
    {type: 'from_me', statuses: ['new', 'confirmed']},
    {type: 'to_me', statuses: ['new', 'confirmed']},
    {type: 'is_manager', statuses: ['new', 'confirmed']},
    {type: 'task', statuses: ['done']},
    {type: 'task', statuses: ['completed']},
];

function MyTasks({
    channelId,
    componentId,
}: Props) {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [tabIndex, setTabIndex] = useState(1);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<any>({});
    const [ids, setIds] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCounts = async () => {
        Promise.all([
            getMyTaskCount(serverUrl, 'from_me', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'to_me', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'is_manager', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'all', ['done']),
            getMyTaskCount(serverUrl, 'all', ['completed']),
        ]).then((res) => setCounts({
            fromMe: res[0],
            toMe: res[1],
            isManager: res[2],
            done: res[3],
            completed: res[4],
        }));
    };

    useEffect(() => {
        fetchCounts();
        const client = WebsocketManager.getClient(serverUrl);
        client?.setEventCallback((evt: WebSocketMessage) => {
            if (evt.event === 'posted') {
                const post = JSON.parse(evt.data.post);
                if (post.type === 'custom_task') {
                    fetchCounts();
                }
                if (post.type == 'custom_task_updated' && post.props.task_type == 'task') {
                    fetchCounts();
                }
            }
            handleWebSocketEvent(serverUrl, evt);
        });
        const listener = DeviceEventEmitter.addListener('TASK_STATUS_UPDATED', fetchCounts);
        return () => {
            client?.setEventCallback((evt: WebSocketMessage) => handleWebSocketEvent(serverUrl, evt));
            listener.remove();
        };
    }, [serverUrl]);

    const filter = TABS[tabIndex];

    const fetchData = useCallback(async () => {
        const results = await fetchMyTasks(serverUrl, filter.type, filter.statuses);
        setIds(results.order || []);
    }, [serverUrl, channelId, filter]);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    return (
        <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={styles.container}
            testID='tasks.screen'
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(0)}
                >
                    <Text style={[styles.text, tabIndex === 0 && styles.active]}>{'Tôi giao'}</Text>
                    {Boolean(counts.fromMe) &&
                    <Text style={styles.count}>{counts.fromMe}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(1)}
                >
                    <Text style={[styles.text, tabIndex === 1 && styles.active]}>{'Cần làm'}</Text>
                    {Boolean(counts.toMe) &&
                    <Text style={styles.count}>{counts.toMe}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(2)}
                >
                    <Text style={[styles.text, tabIndex === 2 && styles.active]}>{'Quản lý'}</Text>
                    {Boolean(counts.isManager) &&
                    <Text style={styles.count}>{counts.isManager}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(3)}
                >
                    <Text style={[styles.text, tabIndex === 3 && styles.active]}>{'Nghiệm thu'}</Text>
                    {Boolean(counts.done) &&
                    <Text style={styles.count}>{counts.done}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(4)}
                >
                    <Text style={[styles.text, tabIndex === 4 && styles.active]}>{'Xong'}</Text>
                </TouchableOpacity>
            </View>
            <TaskList
                ids={ids}
                statuses={filter.statuses}
                loading={loading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />
        </SafeAreaView>
    );
}

export default MyTasks;
