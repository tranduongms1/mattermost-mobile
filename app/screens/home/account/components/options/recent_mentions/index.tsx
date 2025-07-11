// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {showModal} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const RecentMentions = () => {
    const intl = useIntl();

    const openRecentMentions = useCallback(preventDoubleTap(() => {
        showModal(
            Screens.MENTIONS,
            intl.formatMessage({id: 'screen.mentions.title', defaultMessage: 'Recent Mentions'}),
        );
    }), []);

    return (
        <OptionItem
            action={openRecentMentions}
            icon='at'
            label={intl.formatMessage({id: 'screen.mentions.title', defaultMessage: 'Recent Mentions'})}
            testID='account.recent_mentions.option'
            type='default'
        />
    );
};

export default RecentMentions;
