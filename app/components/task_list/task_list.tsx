// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {DeviceEventEmitter, FlatList, type ListRenderItemInfo, View, StyleSheet} from 'react-native';

import Loading from '@components/loading';
import Issue from '@components/post_list/post/body/issue';
import Plan from '@components/post_list/post/body/plan';
import Task from '@components/post_list/post/body/task';
import Trouble from '@components/post_list/post/body/trouble';
import {Events} from '@constants';
import Screens from '@constants/screens';
import {useTheme} from '@context/theme';

import type {ViewableItemsChanged} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';

type Props = {
    posts: PostModel[];
    loading: boolean;
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
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
});

function TaskList({
    posts,
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
                acc[`${Screens.TASK_LIST}-${item.value.currentPost.id}`] = true;
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
        switch (item.type as string) {
            case 'custom_issue':
                return (
                    <Issue
                        key={item.id}
                        location={Screens.TASK_LIST}
                        post={item}
                        style={{marginTop: 16}}
                        theme={theme}
                    />
                );
            case 'custom_plan':
                return (
                    <Plan
                        key={item.id}
                        location={Screens.TASK_LIST}
                        post={item}
                        style={{marginTop: 16}}
                        theme={theme}
                    />
                );
            case 'custom_trouble':
                return (
                    <Trouble
                        key={item.id}
                        location={Screens.TASK_LIST}
                        post={item}
                        style={{marginTop: 16}}
                        theme={theme}
                    />
                );
            default:
                return (
                    <Task
                        key={item.id}
                        location={Screens.TASK_LIST}
                        post={item}
                        style={{marginTop: 16}}
                        theme={theme}
                    />
                );
        }
    }, [theme]);

    return (
        <FlatList
            contentContainerStyle={posts.length ? styles.list : styles.empty}
            ListEmptyComponent={emptyList}
            data={posts}
            onRefresh={onRefresh}
            refreshing={refreshing}
            renderItem={renderItem}
            scrollToOverflowEnabled={true}
            onViewableItemsChanged={onViewableItemsChanged}
            testID='custom_post.flat_list'
        />
    );
}

export default TaskList;
