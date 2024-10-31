// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React, {useCallback, useRef} from 'react';
import {Image, Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import {patchIssue} from '@actions/remote/issue';
import CompassIcon from '@components/compass_icon';
import FormattedDate from '@components/formatted_date';
import {Screens} from '@constants';
import {ATTITUDE_IMAGES, ACTIONS} from '@constants/issue';
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
            borderWidth: 1,
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
        customerRow: {
            alignItems: 'center',
            alignSelf: 'flex-start',
            borderColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderWidth: 1,
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
            paddingHorizontal: 12,
        },
        customerText: {
            color: theme.centerChannelColor,
            fontFamily: 'OpenSans-SemiBold',
            minWidth: 24,
        },
        customerName: {
            borderLeftColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderLeftWidth: 1,
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderRightWidth: 1,
            lineHeight: 36,
            paddingHorizontal: 12,
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
            issue_type,
            status,
            creator_name,
            priority,
            customer_attitude = 1,
            customer_name,
            room,
        },
        createAt,
    } = post;

    const canShowOption = location === 'IssueList' && isChannelMember;

    const handlePress = useCallback(preventDoubleTap(() => {
        const name = issue_type === 'customer' ? 'trouble' : 'sự cố';
        goToScreen(Screens.ISSUE, '', {id}, {
            topBar: {
                title: {
                    text: `Chi tiết ${name}`,
                },
                subtitle: {
                    color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
                    text: channelDisplayName,
                },
            },
        });
    }), [id, channelDisplayName, issue_type, theme]);

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
            patchIssue(serverUrl, post.id, {status: newStatus}).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, id]);

    const borderLeft = {
        borderLeftColor: issue_type === 'customer' ? '#FF7A00' : '#FAC300',
        borderLeftWidth: 3,
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={canShowOption ? showPostOptions : undefined}
            delayLongPress={600}
            style={[styles.container, borderLeft, style]}
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
                    format='HH:mm DD/MM/YY'
                    style={styles.date}
                    value={createAt}
                />
            </View>
            <View style={styles.title}>
                <Text style={styles.titleText}>{title}</Text>
            </View>
            {issue_type === 'customer' &&
            <View style={styles.customerRow}>
                <Image
                    resizeMode='contain'
                    source={ATTITUDE_IMAGES[customer_attitude - 1]}
                    style={{width: 24, height: 24}}
                />
                <Text style={[styles.customerText, styles.customerName]}>
                    {customer_name}
                </Text>
                <Text style={styles.customerText}>
                    {room}
                </Text>
            </View>
            }
            <View style={styles.actions}>
                {ACTIONS[status].map((action) => (
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
