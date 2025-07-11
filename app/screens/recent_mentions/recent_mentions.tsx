// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState, useEffect, useMemo} from 'react';
import {ActivityIndicator, DeviceEventEmitter, type ListRenderItemInfo, StyleSheet, View, Keyboard, FlatList} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

import {fetchRecentMentions} from '@actions/remote/search';
import CompassIcon from '@components/compass_icon';
import DateSeparator from '@components/post_list/date_separator';
import PostWithChannelInfo from '@components/post_with_channel_info';
import {Events, Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import {buildNavigationButton, dismissModal, setButtons} from '@screens/navigation';
import {getDateForDateLine, selectOrderedPosts} from '@utils/post_list';

import EmptyState from '../home/recent_mentions/components/empty';

import type {PostListItem, PostListOtherItem, ViewableItemsChanged} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';
import type {AvailableScreens} from '@typings/screens/navigation';

const EDGES: Edge[] = ['bottom', 'left', 'right'];

type Props = {
    appsEnabled: boolean;
    componentId: AvailableScreens;
    customEmojiNames: string[];
    currentTimezone: string | null;
    mentions: PostModel[];
}

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

const CLOSE_BUTTON_ID = 'close-recent-mentions';

const close = () => {
    Keyboard.dismiss();
    dismissModal();
};

const makeCloseButton = (theme: Theme) => {
    const icon = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.saved-messages.button', icon);
};

const RecentMentionsScreen = ({
    appsEnabled,
    componentId,
    customEmojiNames,
    mentions,
    currentTimezone,
}: Props) => {
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const serverUrl = useServerUrl();

    useEffect(() => {
        setLoading(true);
        fetchRecentMentions(serverUrl).finally(() => {
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

    const posts = useMemo(() => selectOrderedPosts(mentions, 0, false, '', '', false, currentTimezone, false).reverse(), [mentions]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRecentMentions(serverUrl);
        setRefreshing(false);
    }, [serverUrl]);

    const onViewableItemsChanged = useCallback(({viewableItems}: ViewableItemsChanged) => {
        if (!viewableItems.length) {
            return;
        }

        const viewableItemsMap = viewableItems.reduce((acc: Record<string, boolean>, {item, isViewable}) => {
            if (isViewable && item.type === 'post') {
                acc[`${Screens.MENTIONS}-${item.value.currentPost.id}`] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit(Events.ITEM_IN_VIEWPORT, viewableItemsMap);
    }, []);

    const renderEmptyList = useCallback(() => (
        <View style={styles.empty}>
            {loading ? (
                <ActivityIndicator
                    color={theme.centerChannelColor}
                    size='large'
                />
            ) : (
                <EmptyState/>
            )}
        </View>
    ), [loading, theme]);

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
                        location={Screens.MENTIONS}
                        post={item.value.currentPost}
                        testID='recent_mentions.post_list'
                    />
                );
            default:
                return null;
        }
    }, [appsEnabled, customEmojiNames]);

    return (
        <SafeAreaView
            style={styles.flex}
            edges={EDGES}
            testID='recent_mentions.screen'
        >
            <View style={styles.container}>
                <FlatList
                    ListEmptyComponent={renderEmptyList()}
                    data={posts}
                    scrollToOverflowEnabled={true}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    indicatorStyle='black'
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    renderItem={renderItem}
                    removeClippedSubviews={true}
                    onViewableItemsChanged={onViewableItemsChanged}
                    testID='recent_mentions.post_list.flat_list'
                />
            </View>
        </SafeAreaView>
    );
};

export default RecentMentionsScreen;
