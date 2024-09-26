// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import OptionItem from '@components/option_item';
import Screens from '@constants/screens';
import {goToScreen} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const Tasks = () => {
    const openTasks = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.TASKS,
            'Công việc của tôi',
        );
    }), []);

    return (
        <OptionItem
            action={openTasks}
            icon='product-playbooks'
            label='Công việc của tôi'
            type='default'
        />
    );
};

export default Tasks;
