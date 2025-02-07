// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text, View} from 'react-native';

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

type Props = {
    currentUser?: UserModel;
    root: PostModel;
    rootAuthor: UserModel;
    post: PostModel;
    teammateNameDisplay: string;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            marginBottom: 4,
            paddingVertical: 4,
        },
        message: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
            maxWidth: '100%',
        },
        left: {
            alignSelf: 'flex-start',
            borderLeftColor: changeOpacity(theme.linkColor, 0.6),
            borderLeftWidth: 3,
            paddingLeft: 11,
            paddingRight: 14,
        },
        right: {
            alignSelf: 'flex-end',
            borderRightColor: changeOpacity(theme.linkColor, 0.6),
            borderRightWidth: 3,
            paddingLeft: 14,
            paddingRight: 11,
        },
        textRight: {
            textAlign: 'right',
        },
        title: {
            color: theme.centerChannelColor,
            opacity: 0.5,
            ...typography('Body', 75, 'Regular'),
        },
    };
});

const CommentedOn = ({currentUser, post, root, rootAuthor, teammateNameDisplay, theme}: Props) => {
    const style = getStyleSheet(theme);
    const displayName = rootAuthor ? displayUsername(rootAuthor, currentUser?.locale, teammateNameDisplay, true) : undefined;
    const fromMe = post.userId === currentUser?.id;
    const text = root && (root.message || '[Hình ảnh]');

    return (
        <View style={[style.container, fromMe ? style.right : style.left]}>
            <Text style={[style.title, fromMe && style.textRight]}>{displayName}</Text>
            <Text style={[style.message, fromMe && style.textRight]}>{text}</Text>
        </View>
    );
};

export default CommentedOn;
