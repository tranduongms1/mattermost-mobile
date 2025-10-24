// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import {showPermalink} from '@actions/remote/permalink';
import {BaseOption} from '@components/common_post_options';
import {useServerUrl} from '@context/server';
import {t} from '@i18n';
import {dismissBottomSheet} from '@screens/navigation';

import type PostModel from '@typings/database/models/servers/post';
import type {AvailableScreens} from '@typings/screens/navigation';

type JumpProps = {
    bottomSheetId: AvailableScreens;
    post: PostModel;
}

const JumpOption = ({bottomSheetId, post}: JumpProps) => {
    const serverUrl = useServerUrl();

    const onPress = useCallback(async () => {
        await dismissBottomSheet(bottomSheetId);
        showPermalink(serverUrl, '', post.id);
    }, [bottomSheetId, post, serverUrl]);

    return (
        <BaseOption
            i18nId={t('mobile.post_info.jump')}
            defaultMessage='Jump to message'
            iconName='timeline-text-outline'
            onPress={onPress}
            testID={'post_options.jump.option'}
        />
    );
};

export default JumpOption;
