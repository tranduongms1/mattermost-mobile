// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef, useState} from 'react';
import {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {patchChecklist, patchChecklistItem, patchTask} from '@actions/remote/task';
import {fetchAndSwitchToThread} from '@actions/remote/thread';
import ProgressBar from '@app/components/progress_bar';
import {Screens} from '@app/constants';
import CompassIcon from '@components/compass_icon';
import DisplayName from '@components/display_name';
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

import type PostModel from '@typings/database/models/servers/post';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    componentId: AvailableScreens;
    channelDisplayName: string;
    currentUserId: string;
    post: PostModel;
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
        inlineRow: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
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
        sm: {
            color: changeOpacity(theme.centerChannelColor, 0.56),
            ...typography('Body', 75, 'Regular'),
        },
        skipped: {
            textDecorationLine: 'line-through',
        },
        actionIcon: {
            fontSize: 16,
            color: theme.centerChannelColor,
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
    currentUserId,
    post,
}: Props) => {
    const theme = useTheme();
    const presssed = useRef(false);
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const placeholder = changeOpacity(theme.centerChannelColor, 0.56);
    const [checklistExpand, setChecklistExpand] = useState<any>({});

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    const {
        title,
        assignee_ids,
        manager_ids,
        startDate,
        endDate,
        checklists = [],
        status,
        creator_id,
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
    const isCreator = creator_id === currentUserId;

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

    const color1 = assignee_ids?.length || {color: placeholder};
    const color2 = manager_ids?.length || {color: placeholder};
    const taskItems = checklists.reduce((p: any[], c: any) => (c.items ? p.concat(c.items) : p), []);
    const taskProgress = taskItems.length && (taskItems.filter((i: any) => ['closed', 'skipped'].includes(i.state)).length / taskItems.length);
    const taskColor = endDate && (new Date().getTime() > endDate) ? theme.errorTextColor : '#ffeb3b';

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
                        <DisplayName
                            ids={assignee_ids}
                            emptyText='Người thực hiện'
                            style={[styles.title, color1]}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.row, !startDate && !endDate && styles.lastRow]}>
                        <CompassIcon
                            name='user-check'
                            style={[styles.icon, color2]}
                        />
                        <DisplayName
                            ids={manager_ids}
                            emptyText='Người quản lý'
                            style={[styles.title, color2]}
                        />
                    </TouchableOpacity>
                    {endDate &&
                    <View style={{flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12}}>
                        <Text style={styles.sm}>{'Thời hạn: '}</Text>
                        <FormattedDate
                            format='DD/MM/YY'
                            style={styles.sm}
                            value={endDate}
                        />
                    </View>
                    }
                    {taskItems.length > 0 ?
                        <View style={[styles.row, {paddingBottom: 12, paddingTop: endDate ? 2 : 12}]}>
                            <ProgressBar
                                progress={taskProgress}
                                color={theme.buttonBg}
                                style={{height: 10, borderRadius: 5, backgroundColor: taskColor}}
                            />
                        </View> :
                        <View style={{height: 12}}/>
                    }
                </View>
                <Files
                    isReplyPost={false}
                    location={Screens.TASK}
                    post={post}
                />
                {checklists.map((checklist: any, checklistIdx: number) => {
                    const expanded = checklistExpand[checklistIdx];
                    const items = checklist.items || [];
                    const hasItems = items.length > 0;
                    const progress = hasItems ? (items.filter((i: any) => ['closed', 'skipped'].includes(i.state)).length / items.length) : 0;
                    const notDone = items.some((i: any) => i.state !== 'closed');
                    const overdue = checklist.endDate && (new Date().getTime() > checklist.endDate);
                    const color = overdue ? theme.errorTextColor : '#ffeb3b';
                    return (
                        <View
                            key={checklistIdx}
                            style={styles.card}
                        >
                            <TouchableOpacity
                                style={[styles.row, {borderBottomWidth: 0}]}
                                onPress={() => setChecklistExpand({...checklistExpand, [checklistIdx]: !expanded})}
                            >
                                <Text style={styles.text}>
                                    {checklist.title}
                                </Text>
                                {hasItems &&
                                <CompassIcon
                                    name={expanded ? 'chevron-up' : 'chevron-down'}
                                    style={styles.icon}
                                />
                                }
                            </TouchableOpacity>
                            <View style={{flexDirection: 'row', paddingHorizontal: 16}}>
                                {hasItems && (checklist.endDate || endDate) &&
                                <View style={styles.inlineRow}>
                                    <Text style={styles.sm}>{'Thời hạn: '}</Text>
                                    <FormattedDate
                                        format='DD/MM/YY'
                                        style={styles.sm}
                                        value={checklist.endDate || endDate}
                                    />
                                </View>
                                }
                                <View style={styles.inlineRow}/>
                                {notDone &&
                                <CompassIcon
                                    name='checkbox-blank-outline'
                                    style={styles.icon}
                                    onPress={() => updateChecklist(checklistIdx, {state: 'closed'})}
                                />
                                }
                            </View>
                            {hasItems &&
                            <View style={[styles.row, !expanded && styles.lastRow, {paddingBottom: 12, paddingTop: 2}]}>
                                <ProgressBar
                                    progress={progress}
                                    color={theme.buttonBg}
                                    style={{height: 6, borderRadius: 3, backgroundColor: color}}
                                />
                            </View>
                            }
                            {expanded && items.map((item: any, itemIdx: number) => {
                                const closed = item.state === 'closed';
                                const skip = item.state === 'skip';
                                const skipped = item.state === 'skipped';
                                const icon = closed ? 'checkbox-marked' : 'checkbox-blank-outline';
                                const lastRow = itemIdx === items.length - 1;
                                return (
                                    <View key={itemIdx}>
                                        <TouchableOpacity
                                            disabled={presssed.current}
                                            style={[styles.row, (closed || lastRow) && styles.lastRow, {paddingRight: 0}]}
                                            onPress={() => updateChecklistItem(checklistIdx, itemIdx, {state: 'closed'})}
                                        >
                                            <CompassIcon
                                                name={icon}
                                                style={styles.icon}
                                            />
                                            <Text style={[styles.title, (skip || skipped) && styles.skipped]}>
                                                {item.title}
                                            </Text>
                                            {!closed && !skipped &&
                                            <TouchableOpacity
                                                style={styles.action}
                                                onPress={() => {
                                                    if (skip && isCreator) {
                                                        Alert.alert(
                                                            'Phê duyệt đề xuất hủy đầu việc',
                                                            undefined,
                                                            [
                                                                {
                                                                    text: 'Hủy',
                                                                    style: 'cancel',
                                                                },
                                                                {
                                                                    text: 'Đồng ý',
                                                                    style: 'destructive',
                                                                    onPress: () => {
                                                                        updateChecklistItem(checklistIdx, itemIdx, {state: 'skipped'});
                                                                    },
                                                                },
                                                            ], {cancelable: false},
                                                        );
                                                        return;
                                                    }
                                                    updateChecklistItem(checklistIdx, itemIdx, {state: skip ? '' : 'skip'});
                                                }}
                                            >
                                                <CompassIcon
                                                    name={skip && isCreator ? 'check' : 'close'}
                                                    style={styles.actionIcon}
                                                />
                                            </TouchableOpacity>
                                            }
                                        </TouchableOpacity>
                                        {closed &&
                                        <View style={[styles.row, lastRow && styles.lastRow, {paddingBottom: 12}]}>
                                            <CompassIcon
                                                name='user-check'
                                                style={styles.icon}
                                            />
                                            <DisplayName
                                                ids={[item.updated_by]}
                                                style={[styles.sm, {flex: 1, marginLeft: 8}]}
                                            />
                                            {item.updated_at &&
                                                <FormattedDate
                                                    format='HH:mm DD/MM/YY'
                                                    style={styles.sm}
                                                    value={item.updated_at}
                                                />
                                            }
                                        </View>
                                        }
                                    </View>
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
                        <DisplayName
                            ids={[creator_id]}
                            style={styles.title}
                        />
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
                        <DisplayName
                            ids={[confirmed_by]}
                            style={styles.title}
                        />
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
                        <DisplayName
                            ids={[done_by]}
                            style={styles.title}
                        />
                        {done_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={done_at}
                            />
                        }
                    </View>
                    {restored_at &&
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-restore'
                            style={styles.icon}
                        />
                        <DisplayName
                            ids={[restored_by]}
                            style={styles.title}
                        />
                        {restored_at &&
                            <FormattedDate
                                format='HH:mm DD/MM/YY'
                                style={styles.date}
                                value={restored_at}
                            />
                        }
                    </View>
                    }
                    <View style={styles.row}>
                        <CompassIcon
                            name='user-check-all'
                            style={styles.icon}
                        />
                        <DisplayName
                            ids={[completed_by]}
                            style={styles.title}
                        />
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
                        <DisplayName
                            ids={[priority_by]}
                            style={styles.title}
                        />
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
