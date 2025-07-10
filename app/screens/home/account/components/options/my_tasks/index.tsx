// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {goToScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const MyTasks = () => {
    const openMyTasks = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.MY_TASKS,
            'Công việc của tôi',
        );
    }), []);

    return (
        <OptionItem
            action={openMyTasks}
            icon='product-playbooks'
            label='Công việc của tôi'
            type='default'
        />
    );
};

export default MyTasks;
