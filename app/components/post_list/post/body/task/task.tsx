// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedDate from '@components/formatted_date';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {goToScreen, openAsBottomSheet} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import AttachmentAuthor from '../content/message_attachments/attachment_author';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    channelDisplayName: string;
    creatorName: string;
    location: string;
    post: PostModel;
    style?: StyleProp<ViewStyle>;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            borderRadius: 4,
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderLeftColor: changeOpacity(theme.linkColor, 0.6),
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderWidth: 1,
            borderLeftWidth: 3,
            marginTop: 5,
            padding: 12,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        priority: {
            color: 'red',
            fontSize: 16,
            marginRight: 2,
        },
        date: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 11,
        },
        title: {
            marginTop: 3,
        },
        titleText: {
            color: theme.centerChannelColor,
            fontSize: 14,
            fontFamily: 'OpenSans-SemiBold',
            lineHeight: 20,
            marginBottom: 5,
        },
    };
});

const Task = ({
    channelDisplayName,
    creatorName,
    post,
    location,
    style,
    theme,
}: Props) => {
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);

    const {
        id,
        props: {
            title,
            priority,
        },
        createAt,
    } = post;

    const canShowOption = location === 'TaskList';

    const handlePress = useCallback(preventDoubleTap(() => {
        goToScreen(Screens.TASK, '', {id}, {
            topBar: {
                title: {
                    text: 'Chi tiết công việc',
                },
                subtitle: {
                    color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
                    text: channelDisplayName,
                },
            },
        });
    }), [id, channelDisplayName, theme]);

    const showPostOptions = () => {
        openAsBottomSheet({
            closeButtonId: 'close-post-options',
            screen: Screens.POST_OPTIONS,
            theme,
            title,
            props: {sourceScreen: location, post, showAddReaction: true, serverUrl},
        });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={canShowOption ? showPostOptions : undefined}
            delayLongPress={600}
            style={[styles.container, style]}
        >
            <View style={styles.header}>
                <AttachmentAuthor
                    name={creatorName}
                    theme={theme}
                />
                {priority && (
                    <CompassIcon
                        style={styles.priority}
                        name='alarm-plus'
                    />
                )}
                <FormattedDate
                    format='HH:mm DD/MM/YY'
                    style={styles.date}
                    value={createAt}
                />
            </View>
            <View style={styles.title}>
                <Text style={styles.titleText}>{title}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default Task;
