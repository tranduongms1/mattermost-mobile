// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, Text, View} from 'react-native';

import {getChannelTaskCount} from '@actions/remote/task';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {goToScreen, popTopScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    channelId: string;
    componentId: AvailableScreens;
    displayName: string;
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

const TechnicalTasks = ({channelId, componentId, displayName}: Props) => {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [counts, setCounts] = useState<any>({});

    const fetchData = () => {
        Promise.all([
            getChannelTaskCount(serverUrl, channelId, 'trouble', ['done']),
            getChannelTaskCount(serverUrl, channelId, 'trouble', ['completed']),
            getChannelTaskCount(serverUrl, channelId, 'issue', ['done']),
            getChannelTaskCount(serverUrl, channelId, 'issue', ['completed']),
            getChannelTaskCount(serverUrl, channelId, 'plan', ['done']),
            getChannelTaskCount(serverUrl, channelId, 'plan', ['completed']),
        ]).then((res) => setCounts({
            doneTroubles: res[0],
            completedTroubles: res[1],
            doneIssues: res[2],
            completedIssues: res[3],
            donePlans: res[4],
            completedPlans: res[5],
        }));
    };

    useEffect(() => {
        fetchData();
        const listener = DeviceEventEmitter.addListener('TASK_STATUS_UPDATED', fetchData);
        return () => {
            listener.remove();
        };
    }, [serverUrl, channelId]);

    const getOptions = (title: string) => ({
        topBar: {
            title: {
                text: title,
            },
            subtitle: {
                color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
                text: displayName,
            },
        },
    });

    const openTroubles = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.CHANNEL_TROUBLES, '',
            {channelId, statuses},
            getOptions(title),
        );
    }, [channelId, displayName]);

    const openIssues = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.CHANNEL_ISSUES, '',
            {channelId, statuses},
            getOptions(title),
        );
    }, [channelId, displayName]);

    const openPlans = useCallback((title: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.CHANNEL_PLANS, '',
            {channelId, statuses},
            getOptions(title),
        );
    }, [channelId, displayName]);

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
                        label='Đã xử lý, chờ nghiệm thu'
                        info={counts.doneTroubles}
                        containerStyle={[styles.option, styles.first]}
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
                        label='Đã báo xong, chờ nghiệm thu'
                        info={counts.doneIssues}
                        containerStyle={[styles.option, styles.first]}
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
                        label='Đã báo xong, chờ nghiệm thu'
                        info={counts.donePlans}
                        containerStyle={[styles.option, styles.first]}
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
