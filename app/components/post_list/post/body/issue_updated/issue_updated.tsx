// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Screens} from '@constants';

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

const IssueUpdated = ({location, root, theme, ...props}: Props) => {
    return (
        <>
            <Message
                location={location}
                theme={theme}
                {...props}
            />
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
