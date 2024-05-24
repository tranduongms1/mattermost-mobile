// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef} from 'react';
import {Image, Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';
import Button from 'react-native-button';

import CompassIcon from '@components/compass_icon';
import FormattedDate from '@components/formatted_date';
import {Screens} from '@constants';
import {attitudeImages, issueActions} from '@constants/issue';
import {useServerUrl} from '@context/server';
import NetworkManager from '@managers/network_manager';
import {goToScreen, openAsBottomSheet} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import AttachmentAuthor from '../content/message_attachments/attachment_author';
import AttachmentTitle from '../content/message_attachments/attachment_title';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    displayName: string;
    location: string;
    post: PostModel;
    style?: StyleProp<ViewStyle>;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            borderRadius: 3,
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: 1,
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
        border: {
            borderLeftColor: changeOpacity(theme.linkColor, 0.6),
            borderLeftWidth: 3,
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
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            marginRight: 16,
            paddingHorizontal: 8,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
        activeColor: {
            color: theme.buttonBg,
        },
        buttonDisabled: {
            opacity: 0.5,
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
    displayName,
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
        channelId,
        createAt,
    } = post;

    const handlePress = useCallback(preventDoubleTap(() => {
        const name = issue_type === 'customer' ? 'trouble' : 'sự cố';
        goToScreen(Screens.ISSUE, '', {id}, {
            topBar: {
                title: {
                    text: `Chi tiết ${name}`,
                },
                subtitle: {
                    color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
                    text: displayName,
                },
            },
        });
    }), [id, displayName, issue_type, theme]);

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
            const client = NetworkManager.getClient(serverUrl);
            client.doFetch(
                `/plugins/xerp/api/issues/${id}`,
                {method: 'patch', body: {status: newStatus}},
            ).finally(() => {
                presssed.current = false;
            });
        }
    }), [serverUrl, id]);

    let borderStyle;
    switch (issue_type) {
        case 'customer':
            borderStyle = {borderLeftColor: '#FF7A00'};
            break;

        case 'technical':
            borderStyle = {borderLeftColor: '#FAC300'};
            break;

        default:
            break;
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={location === 'IssueList' ? showPostOptions : undefined}
            delayLongPress={200}
            style={[styles.container, styles.border, borderStyle, style]}
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
            <AttachmentTitle
                channelId={channelId}
                location={location}
                theme={theme}
                value={title}
            />
            {issue_type === 'customer' &&
            <View style={styles.customerRow}>
                <Image
                    resizeMode='contain'
                    source={attitudeImages[customer_attitude - 1]}
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
                {issueActions[status].map((action) => (
                    <Button
                        key={action.text}
                        containerStyle={styles.button}
                        disabledContainerStyle={styles.buttonDisabled}
                        onPress={() => updateStatus(action.newStatus)}
                    >
                        <CompassIcon
                            size={18}
                            name={action.iconName}
                            style={!action.newStatus && styles.activeColor}
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
