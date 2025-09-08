// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import {Screens} from '@constants';
import {ICON_SIZE} from '@constants/post_draft';
import {useTheme} from '@context/theme';
import {openAsBottomSheet} from '@screens/navigation';
import {changeOpacity} from '@utils/theme';
import {preventDoubleTap} from '@utils/tap';

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 10,
        paddingVertical: 10,
    },
});

type Props = {
    handleEmojiClick: (emoji: string) => void;
}

export default function EmojiAction({
    handleEmojiClick
}: Props) {
    const intl = useIntl();
    const theme = useTheme();

    const openEmojiPicker = useCallback(preventDoubleTap(() => {
        openAsBottomSheet({
            closeButtonId: 'close-emoji-picker',
            screen: Screens.EMOJI_PICKER,
            theme,
            title: intl.formatMessage({id: 'mobile.custom_status.choose_emoji', defaultMessage: 'Choose an emoji'}),
            props: {onEmojiPress: handleEmojiClick},
        });
    }), [theme, intl, handleEmojiClick]);

    const color = changeOpacity(theme.centerChannelColor, 0.64);

    return (
        <TouchableWithFeedback
            onPress={openEmojiPicker}
            style={style.icon}
            type={'opacity'}
        >
            <Svg width={ICON_SIZE} height={ICON_SIZE} fill={color} viewBox="0 0 24 24">
                <Path d="M20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12M22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12M10,9.5C10,10.3 9.3,11 8.5,11C7.7,11 7,10.3 7,9.5C7,8.7 7.7,8 8.5,8C9.3,8 10,8.7 10,9.5M17,9.5C17,10.3 16.3,11 15.5,11C14.7,11 14,10.3 14,9.5C14,8.7 14.7,8 15.5,8C16.3,8 17,8.7 17,9.5M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23Z"/>
            </Svg>
        </TouchableWithFeedback>
    );
}
