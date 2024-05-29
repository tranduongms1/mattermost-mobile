// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {DeviceEventEmitter, FlatList, type ListRenderItemInfo, View, StyleSheet} from 'react-native';

import Loading from '@components/loading';
import Issue from '@components/post_list/post/body/issue';
import {Events, Screens} from '@constants';
import {useTheme} from '@context/theme';

import type {ViewableItemsChanged} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';

type Props = {
    issues: PostModel[];
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
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
});

function IssueList({
    issues,
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
                acc[`${Screens.ISSUES}-${item.value.currentPost.id}`] = true;
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
            <Issue
                key={item.id}
                location='IssueList'
                post={item}
                style={{marginTop: 16}}
                theme={theme}
            />
        );
    }, [theme]);

    return (
        <FlatList
            contentContainerStyle={issues.length ? styles.list : [styles.empty]}
            ListEmptyComponent={emptyList}
            data={issues}
            onRefresh={onRefresh}
            refreshing={refreshing}
            renderItem={renderItem}
            scrollToOverflowEnabled={true}
            onViewableItemsChanged={onViewableItemsChanged}
            testID='issues.flat_list'
        />
    );
}

export default IssueList;
