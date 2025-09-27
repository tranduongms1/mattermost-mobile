// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DateTimePicker from '@react-native-community/datetimepicker';
import React, {useState} from 'react';
import {Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderBottomWidth: 1,
        },
        inlineRow: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        icon: {
            fontSize: 20,
            color: theme.centerChannelColor,
        },
        title: {
            color: theme.centerChannelColor,
            flex: 1,
            marginLeft: 8,
            paddingVertical: 12,
            ...typography('Body', 100, 'Regular'),
        },
    };
});

type Props = {
    style?: StyleProp<ViewStyle>;
    startDate?: Date;
    endDate?: Date;
    maximumDate?: Date;
    minimumDate?: Date;
    onStartDateChange: (date?: Date) => void;
    onEndDateChange: (date?: Date) => void;
}

function DateRangePicker({
    style,
    startDate,
    endDate,
    maximumDate,
    minimumDate,
    onStartDateChange,
    onEndDateChange,
}: Props) {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    return (
        <View style={style || styles.row}>
            <TouchableOpacity
                style={styles.inlineRow}
                onPress={() => setShowStartDatePicker(true)}
            >
                <CompassIcon
                    name='clock-outline'
                    style={styles.icon}
                />
                <Text style={styles.title}>
                    {startDate?.toLocaleDateString() || 'Bắt đầu'}
                </Text>
            </TouchableOpacity>
            {showStartDatePicker &&
                <DateTimePicker
                    mode='date'
                    locale='vn'
                    textColor={theme.centerChannelColor}
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    value={startDate || new Date()}
                    onChange={(_, selected) => {
                        onStartDateChange(selected);
                        setShowStartDatePicker(false);
                    }}
                />
            }
            <TouchableOpacity
                style={styles.inlineRow}
                onPress={() => setShowEndDatePicker(true)}
            >
                <CompassIcon
                    name='clock-outline'
                    style={styles.icon}
                />
                <Text style={styles.title}>
                    {endDate?.toLocaleDateString() || 'Kết thúc'}
                </Text>
            </TouchableOpacity>
            {showEndDatePicker &&
                <DateTimePicker
                    mode='date'
                    locale='vn'
                    textColor={theme.centerChannelColor}
                    minimumDate={startDate}
                    maximumDate={maximumDate}
                    value={endDate || startDate || new Date()}
                    onChange={(_, selected) => {
                        onEndDateChange(selected);
                        setShowEndDatePicker(false);
                    }}
                />
            }
        </View>
    );
}

export default DateRangePicker;
