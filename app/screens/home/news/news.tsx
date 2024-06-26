// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, DeviceEventEmitter} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {markChannelAsRead} from '@actions/remote/channel';
import {fetchPosts, fetchPostsBefore} from '@actions/remote/post';
import {PER_PAGE_DEFAULT} from '@client/rest/constants';
import PostList from '@components/post_list';
import {Events, Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {debounce} from '@helpers/api/general';
import {useAppState, useIsTablet} from '@hooks/device';
import useDidUpdate from '@hooks/did_update';
import EphemeralStore from '@store/ephemeral_store';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    channelId: string;
    lastViewedAt: number;
    posts: PostModel[];
}

const styles = StyleSheet.create({
    flex: {flex: 1},
    containerStyle: {paddingVertical: 16},
});

const NewsScreen = ({
    channelId,
    lastViewedAt,
    posts,
}: Props) => {
    const appState = useAppState();
    const isTablet = useIsTablet();
    const serverUrl = useServerUrl();
    const canLoadPostsBefore = useRef(true);
    const canLoadPost = useRef(true);
    const [fetchingPosts, setFetchingPosts] = useState(EphemeralStore.isLoadingMessagesForChannel(serverUrl, channelId));
    const oldPostsCount = useRef<number>(posts.length);

    const onEndReached = useCallback(debounce(async () => {
        if (!fetchingPosts && canLoadPostsBefore.current && posts.length) {
            const lastPost = posts[posts.length - 1];
            const result = await fetchPostsBefore(serverUrl, channelId, lastPost?.id || '');
            canLoadPostsBefore.current = false;
            if (!('error' in result)) {
                canLoadPostsBefore.current = (result.posts?.length ?? 0) > 0;
            }
        }
    }, 500), [fetchingPosts, serverUrl, channelId, posts]);

    useDidUpdate(() => {
        setFetchingPosts(EphemeralStore.isLoadingMessagesForChannel(serverUrl, channelId));
    }, [serverUrl, channelId]);

    useEffect(() => {
        const listener = DeviceEventEmitter.addListener(Events.LOADING_CHANNEL_POSTS, ({serverUrl: eventServerUrl, channelId: eventChannelId, value}) => {
            if (eventServerUrl === serverUrl && eventChannelId === channelId) {
                setFetchingPosts(value);
            }
        });

        return () => listener.remove();
    }, [serverUrl, channelId]);

    useEffect(() => {
        // If we have too few posts so the onEndReached may have been called while fetching
        // we call fetchPosts to make sure we have at least the latest page of posts
        if (!fetchingPosts && canLoadPost.current && posts.length < PER_PAGE_DEFAULT) {
            // We do this just once
            canLoadPost.current = false;
            fetchPosts(serverUrl, channelId);
        }
    }, [fetchingPosts, posts]);

    useEffect(() => {
        if (oldPostsCount.current < posts.length && appState === 'active') {
            oldPostsCount.current = posts.length;
            markChannelAsRead(serverUrl, channelId, true);
        }
    }, [posts, channelId, serverUrl, appState === 'active']);

    const postList = (
        <PostList
            channelId={channelId}
            contentContainerStyle={styles.containerStyle}
            isCRTEnabled={true}
            lastViewedAt={lastViewedAt}
            location={Screens.NEWS}
            nativeID={channelId}
            onEndReached={onEndReached}
            posts={posts}
            shouldShowJoinLeaveMessages={false}
            testID='news.post_list'
        />
    );

    if (isTablet) {
        return postList;
    }

    return (
        <SafeAreaView
            edges={['bottom']}
            style={styles.flex}
        >
            {postList}
        </SafeAreaView>
    );
};

export default NewsScreen;
