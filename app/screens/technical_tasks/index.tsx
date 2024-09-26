// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, Text, View} from 'react-native';

import {getIssuesCount} from '@actions/remote/issue';
import ChannelSelector from '@components/channel_selector';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
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
        paddingHorizontal: 16,
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
    const [channelId, setChannelId] = useState('');
    const [counts, setCounts] = useState<any>({});

    const fetch = () => {
        Promise.all([
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['open', 'confirmed']}),
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['done']}),
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['completed']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['open', 'confirmed']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['done']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['completed']}),
        ]).then((res) => setCounts({
            troubles: res[0],
            troubleDone: res[1],
            troubleCompleted: res[2],
            issues: res[3],
            issueDone: res[4],
            issueCompleted: res[5],
        }));
    };

    useEffect(() => {
        fetch();
        const listener = DeviceEventEmitter.addListener('ISSUE_UPDATED', fetch);
        return () => listener.remove();
    }, [serverUrl, channelId]);

    const openIssues = useCallback((title: string, type: string, statuses: string[]) => {
        return () => goToScreen(
            Screens.ISSUES,
            title,
            {channelId, type, statuses},
        );
    }, [channelId]);

    const handleBack = useCallback(() => {
        popTopScreen(componentId);
    }, [componentId]);

    useAndroidHardwareBackHandler(componentId, handleBack);

    return (
        <View style={styles.container}>
            <ChannelSelector
                containerStyle={styles.header}
                placeholder='Chọn nhóm kỹ thuật'
                onSelected={(opt) => setChannelId(opt.value)}
                noneOption={{
                    text: 'Tất cả các nhóm',
                    value: '',
                }}
            />
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
                        action={openIssues(
                            'Trouble',
                            'customer', ['open', 'confirmed'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã xử lý, chờ nghiệm thu'
                        info={counts.troubleDone}
                        containerStyle={styles.option}
                        action={openIssues(
                            'Trouble đã xử lý chờ nghiệm thu',
                            'customer', ['done'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu kết thúc Trouble'
                        info={counts.troubleCompleted}
                        containerStyle={[styles.option, styles.last]}
                        action={openIssues(
                            'Trouble đã nghiệm thu',
                            'customer', ['completed'],
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
                            'Sự cố',
                            'technical', ['open', 'confirmed'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã báo xong, chờ nghiệm thu'
                        info={counts.issueDone}
                        containerStyle={styles.option}
                        action={openIssues(
                            'Sự cố đã báo xong chờ nghiệm thu',
                            'technical', ['done'],
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu hoàn thành'
                        info={counts.issueCompleted}
                        containerStyle={[styles.option, styles.last]}
                        action={openIssues(
                            'Sự cố đã nghiệm thu',
                            'technical', ['completed'],
                        )}
                    />
                </View>
            </View>
        </View>
    );
};

export default TechnicalTasks;
