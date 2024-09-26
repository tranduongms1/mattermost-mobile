// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef} from 'react';
import {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {patchChecklist, patchChecklistItem, patchTask} from '@actions/remote/task';
import {fetchAndSwitchToThread} from '@actions/remote/thread';
import {Preferences, Screens} from '@app/constants';
import CompassIcon from '@components/compass_icon';
import Files from '@components/files';
import FormattedDate from '@components/formatted_date';
import {ACTIONS} from '@constants/task';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {popTopScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    componentId: AvailableScreens;
    channelDisplayName: string;
    post: PostModel;
    assigneeNames: string;
    managerNames: string;
    creator: UserModel;
    confirmedBy?: UserModel;
    doneBy?: UserModel;
    completedBy?: UserModel;
    restoredBy?: UserModel;
    priorityBy?: UserModel;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            flex: 1,
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 16,
        },
        header: {
            color: theme.centerChannelColor,
            flex: 1,
            paddingVertical: 16,
            fontWeight: 'bold',
            ...typography('Body', 200, 'Regular'),
        },
        text: {
            color: theme.centerChannelColor,
            flex: 1,
            paddingVertical: 12,
            ...typography('Body', 200, 'Regular'),
        },
        card: {
            backgroundColor: theme.centerChannelBg,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderRadius: 8,
            borderWidth: 1,
            marginVertical: 4,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderBottomWidth: 1,
        },
        lastRow: {
            borderBottomWidth: 0,
        },
        icon: {
            fontSize: 20,
            color: theme.centerChannelColor,
        },
        title: {
            color: theme.centerChannelColor,
            flex: 1,
            marginLeft: 8,
            paddingVertical: 12,
            ...typography('Body', 100, 'Regular'),
        },
        date: {
            color: theme.centerChannelColor,
            ...typography('Body', 100, 'Regular'),
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
    assigneeNames,
    managerNames,
    creator,
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
    const placeholder = changeOpacity(theme.centerChannelColor, 0.56);

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    const {
        title,
        checklists = [],
        status,
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
        if (data.status === 'done') {
            const isNotDone = (c: any) => c.items && c.items.some((i: any) => i.state !== 'closed');
            if (checklists.some(isNotDone)) {
                Alert.alert('Không thể báo xong do chưa hoàn thành hết việc');
                return;
            }
        }
        if (!presssed.current) {
            presssed.current = true;
            patchTask(serverUrl, post.id, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id, checklists]);

    const updateChecklist = useCallback(preventDoubleTap((index, data) => {
        if (!presssed.current) {
            presssed.current = true;
            patchChecklist(serverUrl, post.id, index, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id]);

    const updateChecklistItem = useCallback(preventDoubleTap((checklistIdx, itemIdx, data) => {
        if (!presssed.current) {
            presssed.current = true;
            patchChecklistItem(serverUrl, post.id, checklistIdx, itemIdx, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id]);

    const color1 = !assigneeNames && {color: placeholder};
    const color2 = !managerNames && {color: placeholder};

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.header}>{title}</Text>
                    </View>
                    <TouchableOpacity style={styles.row}>
                        <CompassIcon
                            name='user-check'
                            style={[styles.icon, color1]}
                        />
                        <Text style={[styles.title, color1]}>
                            {assigneeNames || 'Người thực hiện'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.row, styles.lastRow]}>
                        <CompassIcon
                            name='user-check'
                            style={[styles.icon, color2]}
                        />
                        <Text style={[styles.title, color2]}>
                            {managerNames || 'Người quản lý'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Files
                    isReplyPost={false}
                    location={Screens.TASK}
                    post={post}
                />
                {checklists.map((checklist: any, checklistIdx: number) => {
                    const items = checklist.items || [];
                    const notDone = items.some((i: any) => i.state !== 'closed');
                    return (
                        <View
                            key={checklistIdx}
                            style={styles.card}
                        >
                            <View style={[styles.row, !items.length && styles.lastRow]}>
                                <Text style={styles.text}>
                                    {checklist.title}
                                </Text>
                                {notDone &&
                                <CompassIcon
                                    name='checkbox-blank-outline'
                                    style={styles.icon}
                                    onPress={() => updateChecklist(checklistIdx, {state: 'closed'})}
                                />
                                }
                            </View>
                            {items.map((item: any, itemIdx: number) => {
                                const icon = item.state === 'closed' ? 'checkbox-marked' : 'checkbox-blank-outline';
                                const lastRow = itemIdx === items.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={itemIdx}
                                        disabled={presssed.current}
                                        style={[styles.row, lastRow && styles.lastRow]}
                                        onPress={() => updateChecklistItem(checklistIdx, itemIdx, {state: 'closed'})}
                                    >
                                        <CompassIcon
                                            name={icon}
                                            style={styles.icon}
                                        />
                                        <Text style={styles.title}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    );
                })}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <CompassIcon
                            name='account-group'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {channelDisplayName}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {displayName(creator)}
                        </Text>
                        <FormattedDate
                            format='HH:mm DD/MM/YY'
                            style={styles.date}
                            value={post.createAt}
                        />
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-check'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {confirmed_by ? displayName(confirmedBy) : 'Chưa có thông tin'}
                        </Text>
                        {confirmed_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={confirmed_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-done'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {done_by ? displayName(doneBy) : 'Chưa có thông tin'}
                        </Text>
                        {done_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={done_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-restore'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {restored_by ? displayName(restoredBy) : 'Chưa có thông tin'}
                        </Text>
                        {restored_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={restored_at}
                            />
                        }
                    </View>
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-check-all'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {completed_by ? displayName(completedBy) : 'Chưa có thông tin'}
                        </Text>
                        {completed_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={completed_at}
                            />
                        }
                    </View>
                    {priority &&
                    <View style={styles.row}>
                        <CompassIcon
                            name='alarm-plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {priority_by ? displayName(priorityBy) : 'Chưa có thông tin'}
                        </Text>
                        {priority_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={priority_at}
                            />
                        }
                    </View>
                    }
                    <View style={[styles.row, styles.lastRow]}>
                        <CompassIcon
                            name='money'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>{'Chưa có thông tin'}</Text>
                    </View>
                </View>
            </ScrollView>
            <SafeAreaView
                edges={['bottom', 'left', 'right']}
                style={styles.actions}
            >
                {status !== 'completed' &&
                    <TouchableOpacity
                        disabled={presssed.current}
                        style={styles.action}
                        onPress={() => updateTask({priority: !priority})}
                    >
                        <CompassIcon
                            name='alarm-plus'
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                }
                <TouchableOpacity
                    style={styles.action}
                    onPress={openThread}
                >
                    <CompassIcon
                        name='reply-outline'
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.action}>
                    <CompassIcon
                        name='money'
                        style={styles.icon}
                    />
                </TouchableOpacity>
                {ACTIONS[status].map((action) => (
                    <TouchableOpacity
                        key={action.iconName}
                        disabled={presssed.current}
                        style={styles.action}
                        onPress={() => action.newStatus && updateTask({
                            status: action.newStatus,
                        })}
                    >
                        <CompassIcon
                            name={action.iconName}
                            style={[styles.icon, !action.newStatus && {color: theme.buttonBg}]}
                        />
                    </TouchableOpacity>
                ))}
            </SafeAreaView>
        </View>
    );
};

export default Task;
