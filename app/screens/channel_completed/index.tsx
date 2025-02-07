// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {getIssuesCount} from '@actions/remote/issue';
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
    title: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 20,
    },
    titleText: {
        color: theme.centerChannelColor,
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
    },
    last: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
        borderTopWidth: 1,
    },
}));

const ChannelCompleted = ({channelId, componentId, displayName}: Props) => {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [counts, setCounts] = useState<any>({});

    const fetchData = useCallback(async () => {
        const res = await Promise.all([
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['done']}),
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['completed']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['done']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['completed']}),
        ]);
        setCounts({
            troubleDone: res[0],
            troubleCompleted: res[1],
            issueDone: res[2],
            issueCompleted: res[3],
        });
    }, [serverUrl, channelId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const client = WebsocketManager.getClient(serverUrl)!;
        client.on('custom_xerp_issue_status_change', fetchData);
        return () => client.off('custom_xerp_issue_status_change', fetchData);
    }, [fetchData]);

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
                        info={counts.troubleDone}
                        containerStyle={[styles.option, styles.first]}
                        action={() => goToScreen(Screens.ISSUES, '',
                            {channelId, type: 'customer', statuses: ['done']},
                            getOptions('Trouble đã xử lý chờ nghiệm thu'),
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu kết thúc Trouble'
                        info={counts.troubleCompleted}
                        containerStyle={[styles.option, styles.last]}
                        action={() => goToScreen(Screens.ISSUES, '',
                            {channelId, type: 'customer', statuses: ['completed']},
                            getOptions('Trouble đã nghiệm thu'),
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
                        info={counts.issueDone}
                        containerStyle={[styles.option, styles.first]}
                        action={() => goToScreen(Screens.ISSUES, '',
                            {channelId, type: 'technical', statuses: ['done']},
                            getOptions('Sự cố đã báo xong chờ nghiệm thu'),
                        )}
                    />
                    <OptionItem
                        type='arrow'
                        label='Đã nghiệm thu hoàn thành'
                        info={counts.issueCompleted}
                        containerStyle={[styles.option, styles.last]}
                        action={() => goToScreen(Screens.ISSUES, '',
                            {channelId, type: 'technical', statuses: ['completed']},
                            getOptions('Sự cố đã nghiệm thu'),
                        )}
                    />
                </View>
            </View>
        </View>
    );
};

export default ChannelCompleted;
