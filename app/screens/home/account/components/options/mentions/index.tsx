// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {showModal} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const Mentions = () => {
    const intl = useIntl();

    const openMentions = useCallback(preventDoubleTap(() => {
        showModal(
            Screens.MENTIONS,
            intl.formatMessage({id: 'screen.mentions.title', defaultMessage: 'Recent Mentions'}),
        );
    }), []);

    return (
        <OptionItem
            action={openMentions}
            icon='at'
            label={intl.formatMessage({id: 'screen.mentions.title', defaultMessage: 'Recent Mentions'})}
            testID='account.mentions.option'
            type='default'
        />
    );
};

export default Mentions;
