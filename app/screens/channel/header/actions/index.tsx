// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {getIssuesCount} from '@actions/remote/issue';
import {General, Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import WebsocketManager from '@managers/websocket_manager';
import {goToScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

type ChannelProps = {
    channelId: string;
    channelType: ChannelType;
    displayName: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        borderBottomWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.20),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    text: {
        color: theme.centerChannelColor,
        fontSize: 16,
    },
    count: {
        backgroundColor: 'red',
        borderRadius: 8,
        color: 'white',
        fontSize: 10,
        lineHeight: 14,
        minWidth: 14,
        paddingHorizontal: 2,
        position: 'absolute',
        textAlign: 'center',
        top: 5,
        right: 6,
    },
}));

const ChannelActions = ({
    channelId,
    channelType,
    displayName,
}: ChannelProps) => {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [counts, setCounts] = useState<any>({});

    const fetchData = useCallback(async () => {
        const res = await Promise.all([
            getIssuesCount(serverUrl, {channelId, type: 'customer', statuses: ['open', 'confirmed']}),
            getIssuesCount(serverUrl, {channelId, type: 'technical', statuses: ['open', 'confirmed']}),
            getIssuesCount(serverUrl, {channelId, statuses: ['done']}),
        ]);
        setCounts({
            trouble: res[0],
            issue: res[1],
            done: res[2],
        });
    }, [serverUrl, channelId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const client = WebsocketManager.getClient(serverUrl)!;
        const onPosted = async (data: any) => {
            const post = JSON.parse(data.post);
            if (post.type === 'custom_issue') {
                const type = post.props.issue_type;
                const key = type === 'customer' ? 'trouble' : 'issue';
                const res = await getIssuesCount(serverUrl, {channelId, type, statuses: ['open', 'confirmed']});
                setCounts((s: any) => ({...s, [key]: res}));
            }
        };
        client.on('posted', onPosted);
        client.on('custom_xerp_issue_status_change', fetchData);
        return () => {
            client.off('posted', onPosted);
            client.off('custom_xerp_issue_status_change', fetchData);
        };
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

    if (channelType === General.PRIVATE_CHANNEL) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => goToScreen(Screens.ISSUES, '',
                        {channelId, type: 'customer', statuses: ['open', 'confirmed']},
                        getOptions('Trouble'),
                    )}
                >
                    <Text style={styles.text}>{'Trouble'}</Text>
                    {Boolean(counts.trouble) &&
                    <Text style={styles.count}>{counts.trouble}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => goToScreen(Screens.ISSUES, '',
                        {channelId, type: 'technical', statuses: ['open', 'confirmed']},
                        getOptions('Sự cố'),
                    )}
                >
                    <Text style={styles.text}>{'Sự cố'}</Text>
                    {Boolean(counts.issue) &&
                    <Text style={styles.count}>{counts.issue}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.text}>{'Định kỳ'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.text}>{'Kế hoạch'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => goToScreen(Screens.CHANNEL_COMPLETED, '',
                        {channelId, displayName},
                        getOptions('Xong'),
                    )}
                >
                    <Text style={styles.text}>{'Xong'}</Text>
                    {Boolean(counts.done) &&
                    <Text style={styles.count}>{counts.done}</Text>
                    }
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

export default ChannelActions;
