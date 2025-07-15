// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {Circle, Line, Svg} from 'react-native-svg';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import {Screens} from '@constants';
import {ICON_SIZE} from '@constants/post_draft';
import {useTheme} from '@context/theme';
import {dismissBottomSheet, showModal} from '@screens/navigation';
import {changeOpacity} from '@utils/theme';

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
});

export default function TaskAction() {
    const theme = useTheme();
    const color = changeOpacity(theme.centerChannelColor, 0.64);

    const onPress = useCallback(async () => {
        await dismissBottomSheet();

        showModal(
            Screens.CREATE_TASK,
            'Soạn việc mới',
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
                viewBox='0 0 24 24'
                fill='none'
            >
                <Circle
                    cx='12'
                    cy='12'
                    r='11'
                    stroke={color}
                    strokeWidth='2'
                />
                <Line
                    x1='12'
                    y1='6'
                    x2='12'
                    y2='18'
                    stroke={color}
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <Line
                    x1='6'
                    y1='12'
                    x2='18'
                    y2='12'
                    stroke={color}
                    strokeWidth='2'
                    strokeLinecap='round'
                />
            </Svg>
        </TouchableWithFeedback>
    );
}
