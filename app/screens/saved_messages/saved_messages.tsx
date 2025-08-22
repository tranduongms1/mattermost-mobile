// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {DeviceEventEmitter, FlatList, type ListRenderItemInfo, StyleSheet, View, Keyboard} from 'react-native';
import {type Edge, SafeAreaView} from 'react-native-safe-area-context';

import {fetchSavedPosts} from '@actions/remote/post';
import CompassIcon from '@components/compass_icon';
import Loading from '@components/loading';
import DateSeparator from '@components/post_list/date_separator';
import PostWithChannelInfo from '@components/post_with_channel_info';
import {Events, Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import {buildNavigationButton, dismissModal, setButtons} from '@screens/navigation';
import {getDateForDateLine, selectOrderedPosts} from '@utils/post_list';

import EmptyState from '../home/saved_messages/components/empty';

import type {PostListItem, PostListOtherItem, ViewableItemsChanged} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    appsEnabled: boolean;
    componentId: AvailableScreens;
    currentTimezone: string | null;
    customEmojiNames: string[];
    posts: PostModel[];
}

const edges: Edge[] = ['bottom', 'left', 'right'];

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    empty: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
});

const CLOSE_BUTTON_ID = 'close-saved-messages';

const close = () => {
    Keyboard.dismiss();
    dismissModal();
};

const makeCloseButton = (theme: Theme) => {
    const icon = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.saved-messages.button', icon);
};

function SavedMessages({
    appsEnabled,
    componentId,
    posts,
    currentTimezone,
    customEmojiNames,
}: Props) {
    const [loading, setLoading] = useState(!posts.length);
    const [refreshing, setRefreshing] = useState(false);
    const theme = useTheme();
    const serverUrl = useServerUrl();

    useEffect(() => {
        setLoading(true);
        fetchSavedPosts(serverUrl).finally(() => {
            setLoading(false);
        });
    }, [serverUrl]);

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [makeCloseButton(theme)],
        });
    }, [componentId, theme]);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, [close]);

    const data = useMemo(() => selectOrderedPosts(posts, 0, false, '', '', false, currentTimezone, false).reverse(), [posts]);

    const onViewableItemsChanged = useCallback(({viewableItems}: ViewableItemsChanged) => {
        if (!viewableItems.length) {
            return;
        }

        const viewableItemsMap = viewableItems.reduce((acc: Record<string, boolean>, {item, isViewable}) => {
            if (isViewable && item.type === 'post') {
                acc[`${Screens.SAVED_MESSAGES}-${item.value.currentPost.id}`] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit(Events.ITEM_IN_VIEWPORT, viewableItemsMap);
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSavedPosts(serverUrl);
        setRefreshing(false);
    }, [serverUrl]);

    const emptyList = useMemo(() => (
        <View style={styles.empty}>
            {loading ? (
                <Loading
                    color={theme.buttonBg}
                    size='large'
                />
            ) : (
                <EmptyState/>
            )}
        </View>
    ), [loading, theme.buttonBg]);

    const renderItem = useCallback(({item}: ListRenderItemInfo<PostListItem | PostListOtherItem>) => {
        switch (item.type) {
            case 'date':
                return (
                    <DateSeparator
                        key={item.value}
                        date={getDateForDateLine(item.value)}
                        timezone={currentTimezone}
                    />
                );
            case 'post':
                return (
                    <PostWithChannelInfo
                        appsEnabled={appsEnabled}
                        customEmojiNames={customEmojiNames}
                        key={item.value.currentPost.id}
                        location={Screens.SAVED_MESSAGES}
                        post={item.value.currentPost}
                        testID='saved_messages.post_list'
                        skipSavedPostsHighlight={true}
                    />
                );
            default:
                return null;
        }
    }, [appsEnabled, currentTimezone, customEmojiNames, theme]);

    return (
        <SafeAreaView
            edges={edges}
            style={styles.flex}
            testID='saved_messages.screen'
        >
            <View style={styles.container}>
                <FlatList
                    ListEmptyComponent={emptyList}
                    data={data}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    renderItem={renderItem}
                    scrollToOverflowEnabled={true}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    indicatorStyle='black'
                    removeClippedSubviews={true}
                    onViewableItemsChanged={onViewableItemsChanged}
                    testID='saved_messages.post_list.flat_list'
                />
            </View>
        </SafeAreaView>
    );
}

export default SavedMessages;
