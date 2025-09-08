// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, Text, View} from 'react-native';

import {getMyTaskCount} from '@actions/remote/task';
import {handleWebSocketEvent} from '@actions/websocket/event';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import WebsocketManager from '@managers/websocket_manager';
import {goToScreen, popTopScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    componentId: AvailableScreens;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
        padding: 16,
    },
    header: {
        paddingVertical: 16,
    },
    title: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 20,
    },
    titleText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 20,
    },
    trouble: {
        backgroundColor: '#FF922D',
    },
    issue: {
        backgroundColor: '#FAC300',
    },
    plan: {
        backgroundColor: '#039990',
    },
    group: {
        backgroundColor: theme.centerChannelBg,
        borderColor: changeOpacity(theme.centerChannelColor, 0.1),
        borderRadius: 16,
        borderWidth: 1,
        transform: [{translateY: -16}],
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 16,
    },
    first: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
        borderBottomWidth: 1,
    },
    last: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
        borderTopWidth: 1,
    },
}));

const TechnicalTasks = ({componentId}: Props) => {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [counts, setCounts] = useState<any>({});

    const fetchData = () => {
        Promise.all([
            getMyTaskCount(serverUrl, 'trouble', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'trouble', ['done']),
            getMyTaskCount(serverUrl, 'trouble', ['completed']),
            getMyTaskCount(serverUrl, 'issue', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'issue', ['done']),
            getMyTaskCount(serverUrl, 'issue', ['completed']),
            getMyTaskCount(serverUrl, 'plan', ['new', 'confirmed']),
            getMyTaskCount(serverUrl, 'plan', ['done']),
            getMyTaskCount(serverUrl, 'plan', ['completed']),
        ]).then((res) => setCounts({
            troubles: res[0],
            doneTroubles: res[1],
            completedTroubles: res[2],
            issues: res[3],
            doneIssues: res[4],
            completedIssues: res[5],
            plans: res[6],
            donePlans: res[7],
            completedPlans: res[8],
        }));
    };

    useEffect(() => {
        fetchData();
        const client = WebsocketManager.getClient(serverUrl);
        client?.setEventCallback((evt: WebSocketMessage) => {
            if (evt.event === 'posted') {
                const post: Post = JSON.parse(evt.data.post);
                if (['custom_trouble', 'custom_issue', 'custom_plan'].includes(post.type)) {
                    fetchData();
                }
            }
            handleWebSocketEvent(serverUrl, evt);
        });
        const listener = DeviceEventEmitter.addListener('TASK_STATUS_UPDATED', fetchData);
        return () => {
            client?.setEventCallback((evt: WebSocketMessage) => handleWebSocketEvent(serverUrl, evt));
            listener.remove();
        };
    }, [serverUrl]);

    const openTroubles = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.MY_TROUBLES,
            title,
            {statuses},
        );
    }, []);

    const openIssues = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.MY_ISSUES,
            title,
            {statuses},
        );
    }, []);

    const openPlans = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.MY_PLANS,
            title,
            {statuses},
        );
    }, []);

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    return (
        <View style={styles.container}>
            <View>
                <View style={[styles.title, styles.trouble]}>
                    <Text style={styles.titleText}>{'Trouble'}</Text>
                </View>
                <View style={styles.group}>
                    <OptionItem
                        type='arrow'
                        label='Chờ xử lý'
                        info={counts.troubles}
                        containerStyle={[styles.option, styles.first]}
                        action={openTroubles(
                            'Trouble chờ xử lý',
                            ['new', 'confirmed'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã xử lý, chờ nghiệm thu'
                        info={counts.doneTroubles}
                        containerStyle={styles.option}
                        action={openTroubles(
                            'Trouble chờ nghiệm thu',
                            ['done'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu kết thúc'
                        info={counts.completedTroubles}
                        containerStyle={[styles.option, styles.last]}
                        action={openTroubles(
                            'Trouble đã nghiệm thu',
                            ['completed'],
                        )}
                    />
                </View>
            </View>
            <View>
                <View style={[styles.title, styles.issue]}>
                    <Text style={styles.titleText}>{'Sự cố'}</Text>
                </View>
                <View style={styles.group}>
                    <OptionItem
                        type='arrow'
                        label='Chờ xử lý'
                        info={counts.issues}
                        containerStyle={[styles.option, styles.first]}
                        action={openIssues(
                            'Sự cố chờ xử lý',
                            ['new', 'confirmed'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã báo xong, chờ nghiệm thu'
                        info={counts.doneIssues}
                        containerStyle={styles.option}
                        action={openIssues(
                            'Sự cố chờ nghiệm thu',
                            ['done'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu xong'
                        info={counts.completedIssues}
                        containerStyle={[styles.option, styles.last]}
                        action={openIssues(
                            'Sự cố đã nghiệm thu',
                            ['completed'],
                        )}
                    />
                </View>
            </View>
            <View>
                <View style={[styles.title, styles.plan]}>
                    <Text style={styles.titleText}>{'Việc kế hoạch'}</Text>
                </View>
                <View style={styles.group}>
                    <OptionItem
                        type='arrow'
                        label='Đang triển khai'
                        info={counts.plans}
                        containerStyle={[styles.option, styles.first]}
                        action={openPlans(
                            'Kế hoạch đang triển khai',
                            ['new', 'confirmed'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã báo xong, chờ nghiệm thu'
                        info={counts.donePlans}
                        containerStyle={styles.option}
                        action={openPlans(
                            'Kế hoạch chờ nghiệm thu',
                            ['done'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu xong'
                        info={counts.completedPlans}
                        containerStyle={[styles.option, styles.last]}
                        action={openPlans(
                            'Kế hoạch đã nghiệm thu',
                            ['completed'],
                        )}
                    />
                </View>
            </View>
        </View>
    );
};

export default TechnicalTasks;
