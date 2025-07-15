// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';

import {Preferences} from '@constants';
import {displayUsername} from '@utils/user';

import type UserModel from '@typings/database/models/servers/user';

type Props = {
    style: StyleProp<TextStyle>;
    users: UserModel[];
    emptyText?: string;
}

const DisplayName = ({
    style,
    users,
    emptyText = 'Chưa có thông tin',
}: Props) => {
    const displayName = (user: any) => displayUsername(user, 'vi', Preferences.DISPLAY_PREFER_NICKNAME);

    return (
        <Text style={style}>
            {users.length ? users.map(displayName).join(', ') : emptyText}
        </Text>
    );
};

export default DisplayName;
