// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Platform} from 'react-native';

import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {goToScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

type Props = {
    channelId: string;
}

const RenameChannel = ({channelId}: Props) => {
    const title = 'Đặt tên nhóm';

    const goToRenameChannel = preventDoubleTap(async () => {
        goToScreen(Screens.CREATE_OR_EDIT_CHANNEL, title, {channelId, headerOnly: true});
    });

    return (
        <OptionItem
            action={goToRenameChannel}
            label={title}
            icon='pencil-outline'
            type={Platform.select({ios: 'arrow', default: 'default'})}
        />
    );
};

export default RenameChannel;
