// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {Image, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import SlideUpPanelItem, {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {AttitudeImages} from '@constants/image';
import {useTheme} from '@context/theme';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 32,
        },
        chevron: {
            position: 'absolute',
            top: 14,
            right: 12,
        },
        label: {
            color: theme.centerChannelColor,
            ...typography('Body', 200),
            textAlignVertical: 'center',
            includeFontPadding: false,
        },
    };
});

type Props = {
    onSelected: (value: number) => void;
    selected?: number;
};

const CustomerAttitude = ({
    onSelected,
    selected = 1,
}: Props) => {
    const {bottom} = useSafeAreaInsets();
    const theme = useTheme();
    const style = getStyleSheet(theme);

    const handleSelect = useCallback((value: number) => {
        onSelected(value);
        dismissBottomSheet();
    }, []);

    const openBottomSheet = useCallback(preventDoubleTap(() => {
        const renderContent = () => (
            <>
                <SlideUpPanelItem
                    text='Khách góp ý'
                    textStyles={style.label}
                    onPress={() => handleSelect(1)}
                />
                <SlideUpPanelItem
                    text='Khách không hài lòng'
                    textStyles={style.label}
                    onPress={() => handleSelect(2)}
                />
                <SlideUpPanelItem
                    text='Khách tức giận'
                    textStyles={style.label}
                    onPress={() => handleSelect(3)}
                />
            </>
        );

        const snapPoint = bottomSheetSnapPoint(3, ITEM_HEIGHT);
        bottomSheet({
            closeButtonId: 'close-select',
            title: 'Thái độ khách hàng',
            renderContent,
            snapPoints: [1, (snapPoint + 24)],
            theme,
        });
    }), [theme, bottom]);

    return (
        <TouchableOpacity
            onPress={openBottomSheet}
            style={style.container}
        >
            <Image
                resizeMode='contain'
                source={AttitudeImages[selected - 1]}
                style={{width: 32, height: 32}}
            />
            <CompassIcon
                name='chevron-down'
                color={changeOpacity(theme.centerChannelColor, 0.5)}
                size={20}
                style={style.chevron}
            />
        </TouchableOpacity>
    );
};

export default CustomerAttitude;
