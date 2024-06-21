// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {showModal} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const SavedMessages = () => {
    const intl = useIntl();

    const openSavedMessages = useCallback(preventDoubleTap(() => {
        showModal(
            Screens.SAVED_MESSAGES,
            intl.formatMessage({id: 'screen.saved_messages.title', defaultMessage: 'Saved Messages'}),
        );
    }), []);

    return (
        <OptionItem
            action={openSavedMessages}
            icon='bookmark-outline'
            label={intl.formatMessage({id: 'screen.saved_messages.title', defaultMessage: 'Saved Messages'})}
            testID='account.saved_messages.option'
            type='default'
        />
    );
};

export default SavedMessages;
