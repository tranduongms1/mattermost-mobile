// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {fetchTasks} from '@actions/remote/task';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {popTopScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import TaskList from './list';

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
        paddingHorizontal: 12,
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
        borderRadius: 8,
        color: 'white',
        fontSize: 10,
        lineHeight: 14,
        minWidth: 14,
        paddingHorizontal: 2,
        position: 'absolute',
        textAlign: 'center',
        top: 5,
        right: 6,
    },
}));

const TABS = [
    {type: 'out', statuses: ['new', 'confirmed']},
    {type: 'in', statuses: ['new', 'confirmed']},
    {},
    {statuses: ['done', 'completed']},
    {type: 'draff'},
];

function Tasks({
    channelId,
    componentId,
}: Props) {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [tabIndex, setTabIndex] = useState(1);
    const [loading, setLoading] = useState(true);
    const [counts] = useState<any>({});
    const [ids, setIds] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const filter = TABS[tabIndex];

    const fetchData = useCallback(async () => {
        const results = await fetchTasks(serverUrl, {
            channelId,
            ...filter,
        });
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
                    {Boolean(counts.out) &&
                    <Text style={styles.count}>{counts.out}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(1)}
                >
                    <Text style={[styles.text, tabIndex === 1 && styles.active]}>{'Cần làm'}</Text>
                    {Boolean(counts.in) &&
                    <Text style={styles.count}>{counts.in}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={[styles.text, tabIndex === 2 && styles.active]}>{'Quản lý'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setTabIndex(3)}
                >
                    <Text style={[styles.text, tabIndex === 3 && styles.active]}>{'Xong'}</Text>
                    {Boolean(counts.done) &&
                    <Text style={styles.count}>{counts.done}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={[styles.text, tabIndex === 4 && styles.active]}>{'Nháp'}</Text>
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

export default Tasks;
