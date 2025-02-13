// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef} from 'react';
import {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {patchIssue} from '@actions/remote/issue';
import {patchChecklist, patchTask} from '@actions/remote/task';
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
import {goToScreen, popTopScreen} from '@screens/navigation';
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
    troubles: PostModel[];
    issues: PostModel[];
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

const Plan = ({
    componentId,
    channelDisplayName,
    currentUserId,
    post,
    troubles,
    issues,
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
        end_date,
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
    const doneFilter = (i: any) => ['closed', 'skipped'].includes(i.state) || ['done', 'completed'].includes(i.props?.status);
    const items: any[] = troubles.concat(issues).concat(checklists || []);
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;
    const overdue = end_date && (new Date().getTime() > end_date);
    const progressColor = overdue ? theme.errorTextColor : '#FAC300';

    const openThread = useCallback(preventDoubleTap(() => {
        fetchAndSwitchToThread(serverUrl, post.id);
    }), [serverUrl]);

    const openIssue = useCallback((item: any) => {
        const name = item.props.issue_type === 'customer' ? 'trouble' : 'sự cố';
        goToScreen(Screens.ISSUE, '', {id: item.id}, {
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
    }, [channelDisplayName, theme]);

    const updateTask = useCallback(preventDoubleTap((data) => {
        if (data.status === 'done' && progress !== 1) {
            Alert.alert('Không thể báo xong do chưa hoàn thành hết việc');
            return;
        }
        if (!presssed.current) {
            presssed.current = true;
            patchTask(serverUrl, post.id, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id, progress]);

    const updateIssueStatus = useCallback(preventDoubleTap((item, newStatus) => {
        if (!presssed.current) {
            Alert.alert(
                `Báo xong ${item.props.issue_type === 'customer' ? 'trouble' : 'sự cố'}`,
                item.props.title || item.message,
                [{
                    text: 'Hủy',
                    style: 'cancel',
                }, {
                    text: 'Đồng ý',
                    style: 'destructive',
                    onPress: () => {
                        presssed.current = true;
                        patchIssue(serverUrl, item.id, {status: newStatus}).
                            finally(() => {
                                presssed.current = false;
                            });
                    },
                }], {cancelable: true},
            );
        }
    }), [serverUrl]);

    const updateChecklist = useCallback(preventDoubleTap((index, data) => {
        if (!presssed.current) {
            presssed.current = true;
            patchChecklist(serverUrl, post.id, index, data).
                finally(() => {
                    presssed.current = false;
                });
        }
    }), [serverUrl, post.id]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.header}>{title}</Text>
                    </View>
                    {Boolean(end_date) &&
                    <View style={{flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12}}>
                        <Text style={styles.sm}>{'Thời hạn: '}</Text>
                        <FormattedDate
                            format='DD/MM/YY'
                            style={styles.sm}
                            value={end_date}
                        />
                    </View>
                    }
                    {items.length > 0 &&
                    <View style={[styles.row, styles.lastRow, {paddingBottom: 12, paddingTop: end_date ? 2 : 12}]}>
                        <ProgressBar
                            color='#009AF9'
                            progress={progress}
                            style={{height: 10, borderRadius: 5, backgroundColor: progressColor}}
                        />
                    </View>
                    }
                </View>
                <Files
                    isReplyPost={false}
                    location={Screens.TASK}
                    post={post}
                />
                {troubles &&
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc trouble'}</Text>
                    </View>
                    {troubles.map((item: any, itemIdx: number) => {
                        const done = ['done', 'completed'].includes(item.props.status);
                        const icon = done ? 'checkbox-marked' : 'checkbox-blank-outline';
                        const lastRow = itemIdx === items.length - 1;
                        return (
                            <View key={itemIdx}>
                                <TouchableOpacity
                                    style={[styles.row, (done || lastRow) && styles.lastRow]}
                                    onPress={() => openIssue(item)}
                                >
                                    <TouchableOpacity
                                        disabled={presssed.current}
                                        onPress={done ? undefined : () => updateIssueStatus(item, 'done')}
                                    >
                                        <CompassIcon
                                            name={icon}
                                            style={styles.icon}
                                        />
                                    </TouchableOpacity>
                                    <Text style={{...styles.title, color: theme.linkColor}}>
                                        {item.props.title || item.message}
                                    </Text>
                                </TouchableOpacity>
                                {done &&
                                <View style={[styles.row, lastRow && styles.lastRow, {paddingBottom: 12}]}>
                                    <CompassIcon
                                        name='account-outline'
                                        style={styles.icon}
                                    />
                                    <DisplayName
                                        ids={[item.props.completed_by || item.props.done_by]}
                                        style={[styles.sm, {flex: 1, marginLeft: 8}]}
                                    />
                                    {item.updated_at &&
                                        <FormattedDate
                                            format='HH:mm DD/MM/YY'
                                            style={styles.sm}
                                            value={item.props.completed_at || item.props.done_at}
                                        />
                                    }
                                </View>
                                }
                            </View>
                        );
                    })}
                </View>
                }
                {issues &&
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc sự cố'}</Text>
                    </View>
                    {issues.map((item: any, itemIdx: number) => {
                        const done = ['done', 'completed'].includes(item.props.status);
                        const icon = done ? 'checkbox-marked' : 'checkbox-blank-outline';
                        const lastRow = itemIdx === items.length - 1;
                        return (
                            <View key={itemIdx}>
                                <TouchableOpacity
                                    style={[styles.row, (done || lastRow) && styles.lastRow]}
                                    onPress={() => openIssue(item)}
                                >
                                    <TouchableOpacity
                                        disabled={presssed.current}
                                        onPress={done ? undefined : () => updateIssueStatus(item, 'done')}
                                    >
                                        <CompassIcon
                                            name={icon}
                                            style={styles.icon}
                                        />
                                    </TouchableOpacity>
                                    <Text style={{...styles.title, color: theme.linkColor}}>
                                        {item.props.title || item.message}
                                    </Text>
                                </TouchableOpacity>
                                {done &&
                                <View style={[styles.row, lastRow && styles.lastRow, {paddingBottom: 12}]}>
                                    <CompassIcon
                                        name='account-outline'
                                        style={styles.icon}
                                    />
                                    <DisplayName
                                        ids={[item.props.completed_by || item.props.done_by]}
                                        style={[styles.sm, {flex: 1, marginLeft: 8}]}
                                    />
                                    {item.updated_at &&
                                        <FormattedDate
                                            format='HH:mm DD/MM/YY'
                                            style={styles.sm}
                                            value={item.props.completed_at || item.props.done_at}
                                        />
                                    }
                                </View>
                                }
                            </View>
                        );
                    })}
                </View>
                }
                {checklists &&
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc khác'}</Text>
                    </View>
                    {checklists.map((item: any, itemIdx: number) => {
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
                                    onPress={closed ? undefined : () => updateChecklist(itemIdx, {state: 'closed'})}
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
                                                            onPress: () => updateChecklist(itemIdx, {state: 'skipped'}),
                                                        },
                                                    ], {cancelable: false},
                                                );
                                                return;
                                            }
                                            updateChecklist(itemIdx, {state: skip ? '' : 'skip'});
                                        }}
                                    >
                                        <CompassIcon
                                            name={skip && isCreator ? 'check' : 'close'}
                                            style={styles.actionIcon}
                                        />
                                    </TouchableOpacity>
                                    }
                                </TouchableOpacity>
                                {Boolean(item.updated_at && item.updated_by) &&
                                <View style={[styles.row, lastRow && styles.lastRow, {paddingBottom: 12}]}>
                                    <CompassIcon
                                        name='account-outline'
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
                }
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

export default Plan;
