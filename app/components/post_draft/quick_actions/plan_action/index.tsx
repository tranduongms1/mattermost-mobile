// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {Path, Svg} from 'react-native-svg';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import {Screens} from '@constants';
import {ICON_SIZE} from '@constants/post_draft';
import {dismissBottomSheet, showModal} from '@screens/navigation';

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
});

export default function PlanAction() {
    const onPress = useCallback(async () => {
        await dismissBottomSheet();

        showModal(
            Screens.CREATE_PLAN,
            'Soạn kế hoạch mới',
        );
    }, []);

    return (
        <TouchableWithFeedback
            onPress={onPress}
            style={style.icon}
            type={'opacity'}
        >
            <Svg
                width={ICON_SIZE}
                height={ICON_SIZE}
                viewBox='0 0 16 16'
                fill='none'
            >
                <Path
                    d='M13.642 1.6H10.3393C10.0074 0.672 9.13827 0 8.11111 0C7.08395 0 6.21482 0.672 5.88296 1.6H2.58025C1.71111 1.6 1 2.32 1 3.2V14.4C1 15.28 1.71111 16 2.58025 16H13.642C14.5111 16 15.2222 15.28 15.2222 14.4V3.2C15.2222 2.32 14.5111 1.6 13.642 1.6ZM8.11111 1.6C8.54568 1.6 8.90124 1.96 8.90124 2.4C8.90124 2.84 8.54568 3.2 8.11111 3.2C7.67654 3.2 7.32099 2.84 7.32099 2.4C7.32099 1.96 7.67654 1.6 8.11111 1.6ZM9.69136 12.8H4.16049V11.2H9.69136V12.8ZM12.0617 9.6H4.16049V8H12.0617V9.6ZM12.0617 6.4H4.16049V4.8H12.0617V6.4Z'
                    fill='#039990'
                />
            </Svg>
        </TouchableWithFeedback>
    );
}
