// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React, {useCallback, useRef} from 'react';
import {Alert, Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import {patchTask} from '@actions/remote/task';
import CompassIcon from '@components/compass_icon';
import FormattedDate from '@components/formatted_date';
import ProgressBar from '@components/progress_bar';
import {Screens} from '@constants';
import {ACTIONS} from '@constants/task';
import {useServerUrl} from '@context/server';
import {goToScreen, openAsBottomSheet} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    channelDisplayName: string;
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
            marginTop: 5,
            padding: 12,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
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

const RecurringTasks = ({
    channelDisplayName,
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
        message,
        props: {
            title,
            endDate,
            checklists,
            status,
        },
        createAt,
    } = post;

    const canShowOption = location === 'TaskList';
    const doneFilter = (item: any) => ['closed', 'skipped'].includes(item.state);
    const items = checklists || [];
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;
    const overdue = endDate && (new Date().getTime() > endDate);
    const progressColor = overdue ? theme.errorTextColor : '#FAC300';

    const handlePress = useCallback(preventDoubleTap(() => {
        goToScreen(Screens.RECURRING_TASKS, '', {id}, {
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

    const updateStatus = useCallback(preventDoubleTap(async (newStatus) => {
        if (!newStatus) {
            return;
        }
        if (newStatus === 'done' && progress !== 1) {
            Alert.alert('Không thể báo xong do chưa hoàn thành hết việc');
            return;
        }
        if (!presssed.current) {
            presssed.current = true;
            patchTask(serverUrl, post.id, {status: newStatus}).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, id, progress]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={canShowOption ? showPostOptions : undefined}
            delayLongPress={600}
            style={[styles.container, style]}
        >
            <View style={styles.header}>
                <Text>{}</Text>
                <FormattedDate
                    format='HH:mm DD/MM/YY'
                    style={styles.date}
                    value={createAt}
                />
            </View>
            <View style={styles.title}>
                <Text style={styles.titleText}>{title || message}</Text>
            </View>
            {endDate &&
            <View style={{flexDirection: 'row', paddingBottom: 2}}>
                <Text style={styles.sm}>{'Thời hạn: '}</Text>
                <FormattedDate
                    format='DD/MM/YY'
                    style={styles.sm}
                    value={endDate}
                />
            </View>
            }
            {items.length > 0 &&
            <View style={{paddingBottom: 4}}>
                <ProgressBar
                    color='#009AF9'
                    progress={progress}
                    style={{height: 6, borderRadius: 3, backgroundColor: progressColor}}
                />
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

export default RecurringTasks;
