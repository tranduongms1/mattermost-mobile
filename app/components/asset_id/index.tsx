// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React from 'react';
import {Text, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FloatingTextInput from '@components/floating_text_input_label';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 16,
        },
        inputContainer: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
        input: {
            backgroundColor: 'transparent',
            borderBottomRightRadius: 0,
            borderTopRightRadius: 0,
        },
        button: {
            borderBottomRightRadius: 4,
            borderTopRightRadius: 4,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderLeftWidth: 0,
        },
        icon: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
        },
        text: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            fontFamily: 'OpenSans',
            fontSize: 16,
            marginLeft: 8,
            marginRight: 4,
        },
    };
});

export default function AssetId() {
    const theme = useTheme();
    const style = getStyleSheet(theme);

    return (
        <View style={style.container}>
            <FloatingTextInput
                containerStyle={style.inputContainer}
                label='Id tài sản'
                readOnly={true}
                textInputStyle={style.input}
                theme={theme}
            />
            <Button
                size='lg'
                type='outline'
                buttonStyle={style.button}
            >
                <CompassIcon
                    size={24}
                    name='arrow-left'
                    style={style.icon}
                />
                <Text style={style.text}>
                    {'Chưa có ID'}
                </Text>
            </Button>
        </View>
    );
}
