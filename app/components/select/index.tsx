// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import SlideUpPanelItem, {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {useTheme} from '@context/theme';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

export type Option = {
    text: string;
    value: string;
};

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        input: {
            borderRadius: 4,
            borderWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: changeOpacity(theme.centerChannelBg, 0.9),
            paddingLeft: 10,
            paddingRight: 30,
            paddingVertical: 12,
            height: 50,
        },
        text: {
            fontFamily: 'OpenSans',
            fontSize: 16,
            color: theme.centerChannelColor,
            top: 3,
            marginLeft: 5,
        },
        dropdownPlaceholder: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        dropdownSelected: {
            color: theme.centerChannelColor,
        },
        icon: {
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

export type SelectProps = {
    options: Option[];
    onSelected?: (value: Option) => void;
    placeholder?: string;
    selected?: string;
    containerStyle?: StyleProp<ViewStyle>;
};

const Select = ({
    containerStyle,
    options,
    onSelected,
    placeholder,
    selected,
}: SelectProps) => {
    const intl = useIntl();
    const {bottom} = useSafeAreaInsets();
    const theme = useTheme();
    const [itemText, setItemText] = useState('');
    const style = getStyleSheet(theme);

    const title = placeholder || intl.formatMessage({id: 'mobile.action_menu.select', defaultMessage: 'Select an option'});

    useEffect(() => {
        if (selected) {
            setItemText(options.find((opt) => opt.value === selected)?.text || '');
        }
    }, []);

    const handleSelect = useCallback((option: Option) => {
        setItemText(option.text);

        if (onSelected) {
            onSelected(option);
        }

        dismissBottomSheet();
    }, []);

    const openBottomSheet = useCallback(preventDoubleTap(() => {
        const renderContent = () => (
            <>
                {options.map((opt) => (
                    <SlideUpPanelItem
                        key={opt.value}
                        onPress={() => handleSelect(opt)}
                        text={opt.text}
                        textStyles={style.label}
                    />
                ))}
            </>
        );

        const snapPoint = bottomSheetSnapPoint(options.length, ITEM_HEIGHT);
        bottomSheet({
            closeButtonId: 'close-select',
            renderContent,
            snapPoints: [1, (snapPoint + 24)],
            title,
            theme,
        });
    }), [theme, bottom, options]);

    return (
        <TouchableOpacity
            onPress={openBottomSheet}
            style={containerStyle}
        >
            <View style={style.input}>
                <Text
                    numberOfLines={1}
                    style={[style.text, itemText ? style.dropdownSelected : style.dropdownPlaceholder]}
                >
                    {itemText || title}
                </Text>
                <CompassIcon
                    name='chevron-down'
                    color={changeOpacity(theme.centerChannelColor, 0.5)}
                    size={20}
                    style={style.icon}
                />
            </View>
        </TouchableOpacity>
    );
};

export default Select;
