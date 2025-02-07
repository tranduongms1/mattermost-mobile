// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {DeviceEventEmitter, FlatList, type ListRenderItemInfo, View, StyleSheet} from 'react-native';

import Loading from '@components/loading';
import Task from '@components/post_list/post/body/task';
import {Events, Screens} from '@constants';
import {useTheme} from '@context/theme';

import type {ViewableItemsChanged} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';

type Props = {
    tasks: PostModel[];
    loading?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
}

const styles = StyleSheet.create({
    empty: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    list: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
});

function TaskList({
    tasks,
    loading,
    refreshing,
    onRefresh,
}: Props) {
    const theme = useTheme();

    const onViewableItemsChanged = useCallback(({viewableItems}: ViewableItemsChanged) => {
        if (!viewableItems.length) {
            return;
        }

        const viewableItemsMap = viewableItems.reduce((acc: Record<string, boolean>, {item, isViewable}) => {
            if (isViewable && item.type === 'post') {
                acc[`${Screens.TASKS}-${item.value.currentPost.id}`] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit(Events.ITEM_IN_VIEWPORT, viewableItemsMap);
    }, []);

    const emptyList = useMemo(() => (
        <View style={styles.empty}>
            {loading && (
                <Loading
                    color={theme.buttonBg}
                    size='large'
                />
            )}
        </View>
    ), [loading, theme.buttonBg]);

    const renderItem = useCallback(({item}: ListRenderItemInfo<PostModel>) => {
        return (
            <Task
                key={item.id}
                location='TaskList'
                post={item}
                style={{marginTop: 16}}
                theme={theme}
            />
        );
    }, [theme]);

    return (
        <FlatList
            contentContainerStyle={tasks.length ? styles.list : [styles.empty]}
            ListEmptyComponent={emptyList}
            data={tasks}
            onRefresh={onRefresh}
            refreshing={refreshing}
            renderItem={renderItem}
            scrollToOverflowEnabled={true}
            onViewableItemsChanged={onViewableItemsChanged}
            testID='tasks.flat_list'
        />
    );
}

export default TaskList;
