// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {DeviceEventEmitter, View} from 'react-native';

import {switchToChannelById} from '@actions/remote/channel';
import ChannelItem from '@components/channel_item';
import {Events} from '@constants';
import {CHANNEL} from '@constants/screens';
import {HOME_PADDING} from '@constants/view';
import {useServerUrl} from '@context/server';

import type ChannelModel from '@typings/database/models/servers/channel';

type Props = {
    channel: ChannelModel;
};

const DefaultChannel = ({channel}: Props) => {
    const serverUrl = useServerUrl();

    const openDefaultChannel = useCallback(async () => {
        DeviceEventEmitter.emit(Events.ACTIVE_SCREEN, CHANNEL);
        switchToChannelById(serverUrl, channel.id);
    }, [serverUrl, channel]);

    return (
        <View style={HOME_PADDING}>
            <ChannelItem
                channel={channel}
                onPress={openDefaultChannel}
            />
        </View>
    );
};

export default DefaultChannel;
