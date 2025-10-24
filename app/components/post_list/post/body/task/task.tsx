// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import DisplayName from '@components/display_name';
import FormattedDate from '@components/formatted_date';
import ProgressBar from '@components/progress_bar';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {goToScreen, openAsBottomSheet} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import AttachmentAuthor from '../content/message_attachments/attachment_author';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    channelDisplayName: string;
    creatorName: string;
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
            borderColor: changeOpacity(theme.centerChannelColor, 0.15),
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
        sm: {
            color: changeOpacity(theme.centerChannelColor, 0.56),
            ...typography('Body', 75, 'Regular'),
        },
    };
});

const Task = ({
    channelDisplayName,
    creatorName,
    isChannelMember,
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
            manager_ids,
            assignee_ids,
            end_date,
            checklists,
            priority,
        },
        createAt,
    } = post as any;

    const canShowOption = location === Screens.TASK_LIST && isChannelMember;
    const items = (checklists || []).reduce((p: any[], c: any) => (c.items ? p.concat(c.items) : p), []);
    const progress = items.length && (items.filter((i: any) => ['closed', 'skipped'].includes(i.state)).length / items.length);
    const overdue = end_date && (new Date().getTime() > end_date);
    const progressColor = overdue ? theme.errorTextColor : '#FAC300';

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
                    style={styles.date}
                    value={createAt}
                />
            </View>
            <View style={styles.title}>
                <Text style={styles.titleText}>{title}</Text>
            </View>
            {end_date &&
            <View style={{flexDirection: 'row'}}>
                <Text style={styles.sm}>{'Thời hạn: '}</Text>
                <FormattedDate
                    style={styles.sm}
                    value={end_date}
                />
            </View>
            }
            {items.length > 0 &&
                <ProgressBar
                    color='#009AF9'
                    progress={progress}
                    style={{height: 6, borderRadius: 3, backgroundColor: progressColor}}
                />
            }
            <View style={styles.title}>
                <DisplayName
                    style={styles.sm}
                    ids={[...assignee_ids || [], ...manager_ids || []]}
                />
            </View>
        </TouchableOpacity>
    );
};

export default Task;
