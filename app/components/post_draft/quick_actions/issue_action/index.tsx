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

export default function IssueAction() {
    const onPress = useCallback(async () => {
        await dismissBottomSheet();

        showModal(
            Screens.CREATE_ISSUE,
            'Báo sự cố',
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
                viewBox='0 0 26 26'
                fill='none'
            >
                <Path
                    d='M26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13Z'
                    fill='#FAC300'
                />
                <Path
                    d='M13.9475 15H13.0525C12.7956 15 12.5805 14.8054 12.555 14.5498L11.555 4.54975C11.5255 4.25541 11.7567 4 12.0525 4H14.9475C15.2433 4 15.4745 4.25541 15.445 4.54975L14.445 14.5498C14.4195 14.8054 14.2044 15 13.9475 15Z'
                    fill='#444444'
                />
                <Path
                    d='M16 19C16 20.3807 14.8807 21.5 13.5 21.5C12.1193 21.5 11 20.3807 11 19C11 17.6193 12.1193 16.5 13.5 16.5C14.8807 16.5 16 17.6193 16 19Z'
                    fill='#444444'
                />
            </Svg>
        </TouchableWithFeedback>
    );
}
