// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useMemo} from 'react';
import {View} from 'react-native';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {type Edge, SafeAreaView} from 'react-native-safe-area-context';

import NavigationHeader from '@components/navigation_header';
import {Screens} from '@constants';
import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';
import NavigationStore from '@store/navigation_store';

const EDGES: Edge[] = ['bottom', 'left', 'right'];

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.centerChannelBg,
    },
}));

const NotificationsScreen = () => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            NavigationStore.setVisibleTap(Screens.NOTIFICATIONS);
        }
    }, [isFocused]);

    const animated = useAnimatedStyle(() => {
        if (!isFocused) {
            return {
                opacity: withTiming(0, {duration: 150}),
                transform: [{translateX: withTiming(0, {duration: 150})}],
            };
        }
        return {
            opacity: withTiming(1, {duration: 150}),
            transform: [{translateX: withTiming(0, {duration: 150})}],
        };
    }, [isFocused]);

    const headerStyle = useMemo(() => ({
        backgroundColor: theme.sidebarBg,
    }), [theme]);

    return (
        <SafeAreaView
            edges={EDGES}
            style={styles.flex}
            testID='notifications.screen'
        >
            <NavigationHeader
                showBackButton={false}
                title={'Thông báo'}
                style={headerStyle}
            />
            <Animated.View style={[styles.flex, animated]}>
                <View style={styles.container}>
                    {/* Notifications content will go here */}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};

export default NotificationsScreen;
