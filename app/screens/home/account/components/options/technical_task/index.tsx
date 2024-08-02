// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {goToScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const TechnicalTask = () => {
    const openTechnicalTask = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.TECHNICAL_TASK,
            'Công việc kỹ thuật',
        );
    }), []);

    return (
        <OptionItem
            action={openTechnicalTask}
            icon='technical'
            label='Công việc kỹ thuật'
            type='default'
        />
    );
};

export default TechnicalTask;
