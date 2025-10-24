// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React, {useCallback, useRef} from 'react';
import {Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import {updateTask} from '@actions/remote/task';
import CompassIcon from '@components/compass_icon';
import FormattedDate from '@components/formatted_date';
import {Screens} from '@constants';
import {TaskActions} from '@constants/task';
import {useServerUrl} from '@context/server';
import {goToScreen, openAsBottomSheet} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import AttachmentAuthor from '../content/message_attachments/attachment_author';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    channelDisplayName: string;
    isChannelMember: boolean;
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
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderLeftColor: '#FAC300',
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
        actions: {
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 12,
        },
        button: {
            marginRight: 12,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
        activeColor: {
            color: theme.buttonBg,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        icon: {
            color: theme.centerChannelColor,
        },
        text: {
            color: theme.centerChannelColor,
            fontSize: 15,
            fontFamily: 'OpenSans-SemiBold',
            lineHeight: 17,
            marginLeft: 8,
        },
    };
});

const Issue = ({
    channelDisplayName,
    isChannelMember,
    post,
    location,
    style,
    theme,
}: Props) => {
    const presssed = useRef(false);
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);

    const {
        id,
        props: {
            title,
            creator_name,
            priority,
            status,
        },
        createAt,
    } = post as any;

    const canShowOption = location === Screens.TASK_LIST && isChannelMember;

    const handlePress = useCallback(preventDoubleTap(() => {
        goToScreen(Screens.ISSUE, '', {id}, {
            topBar: {
                title: {
                    text: 'Chi tiết sự cố',
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

    const updateStatus = useCallback(preventDoubleTap(async (newStatus) => {
        if (!newStatus) {
            return;
        }
        if (!presssed.current) {
            presssed.current = true;
            updateTask(serverUrl, post.id, {status: newStatus}).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, id]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={canShowOption ? showPostOptions : undefined}
            delayLongPress={600}
            style={[styles.container, style]}
        >
            <View style={styles.header}>
                <AttachmentAuthor
                    name={creator_name}
                    theme={theme}
                />
                {priority && (
                    <CompassIcon
                        style={styles.priority}
                        name='alarm-plus'
                    />
                )}
                <FormattedDate
                    style={styles.date}
                    value={createAt}
                />
            </View>
            <View style={styles.title}>
                <Text style={styles.titleText}>{title}</Text>
            </View>
            <View style={styles.actions}>
                {TaskActions[status].map((action) => (
                    <Button
                        key={action.text}
                        buttonStyle={styles.button}
                        disabledStyle={styles.buttonDisabled}
                        onPress={() => updateStatus(action.newStatus)}
                    >
                        <CompassIcon
                            size={18}
                            name={action.iconName}
                            style={[styles.icon, !action.newStatus && styles.activeColor]}
                        />
                        <Text style={[styles.text, !action.newStatus && styles.activeColor]}>
                            {action.text}
                        </Text>
                    </Button>
                ))}
            </View>
        </TouchableOpacity>
    );
};

export default Issue;
