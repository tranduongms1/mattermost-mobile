// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {fetchTasksForChannel} from '@actions/remote/task';
import CustomPostList from '@components/custom_post_list';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {popTopScreen} from '@screens/navigation';

import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    channelId: string;
    componentId: AvailableScreens;
    statuses: string[];
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});

function ChannelTroubles({
    channelId,
    componentId,
    statuses,
}: Props) {
    const serverUrl = useServerUrl();
    const [loading, setLoading] = useState(true);
    const [ids, setIds] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        const results = await fetchTasksForChannel(serverUrl, channelId, 'trouble', statuses);
        setIds(results.order || []);
    }, [serverUrl, channelId, statuses]);

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
            style={styles.flex}
        >
            <CustomPostList
                ids={ids}
                statuses={statuses}
                loading={loading}
                location={Screens.TASK_LIST}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />
        </SafeAreaView>
    );
}

export default ChannelTroubles;
