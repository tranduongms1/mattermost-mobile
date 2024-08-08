// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React, {useCallback, useRef} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {patchTask} from '@actions/remote/task';
import {fetchAndSwitchToThread} from '@actions/remote/thread';
import {Preferences, Screens} from '@app/constants';
import AssetId from '@components/asset_id';
import CompassIcon from '@components/compass_icon';
import Files from '@components/files';
import FormattedDate from '@components/formatted_date';
import {taskActions} from '@constants/task';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {popTopScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {displayUsername} from '@utils/user';

import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    componentId: AvailableScreens;
    channelDisplayName: string;
    post: PostModel;
    confirmedBy: UserModel | undefined;
    doneBy: UserModel | undefined;
    completedBy: UserModel | undefined;
    restoredBy: UserModel | undefined;
    priorityBy: UserModel | undefined;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            flex: 1,
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 16,
        },
        field: {
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderRadius: 4,
            borderWidth: 1,
        },
        text: {
            fontFamily: 'OpenSans',
            fontSize: 16,
            color: theme.centerChannelColor,
        },
        customerRow: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 16,
            paddingHorizontal: 16,
            paddingVertical: 0,
        },
        customerName: {
            flex: 1,
            borderLeftColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderLeftWidth: 1,
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderRightWidth: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
            textAlign: 'center',
        },
        card: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderRadius: 8,
            borderWidth: 1,
            marginTop: 16,
            marginBottom: 32,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderBottomWidth: 1,
        },
        lastRow: {
            borderBottomWidth: 0,
        },
        icon: {
            fontSize: 24,
            color: theme.centerChannelColor,
        },
        title: {
            flex: 1,
            marginLeft: 8,
        },
        actions: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderTopWidth: 1,
            paddingHorizontal: 16,
        },
        action: {
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
    };
});

const Task = ({
    componentId,
    channelDisplayName,
    post,
    confirmedBy,
    doneBy,
    completedBy,
    restoredBy,
    priorityBy,
}: Props) => {
    const theme = useTheme();
    const presssed = useRef(false);
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    const {
        title,
        description,
        status,
        creator_name,
        confirmed_at,
        confirmed_by,
        done_at,
        done_by,
        restored_at,
        restored_by,
        completed_at,
        completed_by,
        priority,
        priority_at,
        priority_by,
    } = post.props;

    const displayName = (user: any) => displayUsername(user, 'vi', Preferences.DISPLAY_PREFER_NICKNAME);

    const openThread = useCallback(preventDoubleTap(() => {
        fetchAndSwitchToThread(serverUrl, post.id);
    }), [serverUrl]);

    const updateTask = useCallback(preventDoubleTap((data) => {
        if (!presssed.current) {
            presssed.current = true;
            patchTask(serverUrl, post.id, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.field}>
                    <Text style={styles.text}>{title}</Text>
                </View>
                {description &&
                <View style={styles.field}>
                    <Text style={styles.text}>{description}</Text>
                </View>
                }
                <Files
                    isReplyPost={false}
                    location={Screens.TASK}
                    post={post}
                />
                <AssetId/>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='account-group'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {channelDisplayName}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='user-plus'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {creator_name}
                        </Text>
                        <FormattedDate
                            format='HH:mm DD/MM/YY'
                            style={styles.text}
                            value={post.createAt}
                        />
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='user-check'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {confirmed_by ? displayName(confirmedBy) : 'Chưa có thông tin'}
                        </Text>
                        {confirmed_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.text}
                                value={confirmed_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='user-done'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {done_by ? displayName(doneBy) : 'Chưa có thông tin'}
                        </Text>
                        {done_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.text}
                                value={done_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='user-restore'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {restored_by ? displayName(restoredBy) : 'Chưa có thông tin'}
                        </Text>
                        {restored_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.text}
                                value={restored_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='user-check-all'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {completed_by ? displayName(completedBy) : 'Chưa có thông tin'}
                        </Text>
                        {completed_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.text}
                                value={completed_at}
                            />
                        }
                    </View>
                    {priority &&
                    <View style={styles.row}>
                        <CompassIcon
                            style={styles.icon}
                            name='alarm-plus'
                        />
                        <Text style={[styles.text, styles.title]}>
                            {priority_by ? displayName(priorityBy) : 'Chưa có thông tin'}
                        </Text>
                        {priority_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.text}
                                value={priority_at}
                            />
                        }
                    </View>
                    }
                    <View style={[styles.row, styles.lastRow]}>
                        <CompassIcon
                            style={styles.icon}
                            name='money'
                        />
                        <Text style={[styles.text, styles.title]}>{'Chưa có thông tin'}</Text>
                    </View>
                </View>
            </ScrollView>
            <SafeAreaView
                edges={['bottom', 'left', 'right']}
                style={styles.actions}
            >
                {status !== 'completed' &&
                    <Button
                        containerStyle={styles.action}
                        disabled={presssed.current}
                        onPress={() => updateTask({priority: !priority})}
                    >
                        <CompassIcon
                            style={styles.icon}
                            name='alarm-plus'
                        />
                    </Button>
                }
                <Button
                    containerStyle={styles.action}
                    onPress={openThread}
                >
                    <CompassIcon
                        style={styles.icon}
                        name='reply-outline'
                    />
                </Button>
                <Button containerStyle={styles.action}>
                    <CompassIcon
                        style={styles.icon}
                        name='money'
                    />
                </Button>
                {taskActions[status].map((action) => (
                    <Button
                        key={action.iconName}
                        containerStyle={styles.action}
                        disabled={presssed.current}
                        onPress={() => action.newStatus && updateTask({
                            status: action.newStatus,
                        })}
                    >
                        <CompassIcon
                            name={action.iconName}
                            style={[styles.icon, !action.newStatus && {color: theme.buttonBg}]}
                        />
                    </Button>
                ))}
            </SafeAreaView>
        </SafeAreaView>
    );
};

export default Task;
