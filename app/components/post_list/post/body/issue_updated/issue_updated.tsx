// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import {Screens} from '@constants';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Issue from '../issue';
import Message from '../message/message';

import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';
import type {SearchPattern} from '@typings/global/markdown';

type Props = {
    currentUser?: UserModel;
    isHighlightWithoutNotificationLicensed?: boolean;
    highlight: boolean;
    isEdited: boolean;
    isPendingOrFailed: boolean;
    isReplyPost: boolean;
    layoutWidth?: number;
    location: string;
    post: PostModel;
    searchPatterns?: SearchPattern[];
    theme: Theme;
    root: PostModel;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        messageContainer: {
            alignSelf: 'flex-start',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderRadius: 12,
            flexDirection: 'row',
            maxWidth: '100%',
            padding: 14,
        },
    };
});

const IssueUpdated = ({location, root, theme, ...props}: Props) => {
    const style = getStyleSheet(theme);

    return (
        <>
            <View style={style.messageContainer}>
                <Message
                    location={location}
                    theme={theme}
                    {...props}
                />
            </View>
            {location === Screens.CHANNEL && root &&
            <Issue
                location={location}
                post={root}
                theme={theme}
            />
            }
        </>
    );
};

export default IssueUpdated;
