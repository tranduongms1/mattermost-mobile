// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo} from 'react';
import {useIntl} from 'react-intl';

import CompassIcon from '@components/compass_icon';
import SettingContainer from '@components/settings/container';
import SettingItem from '@components/settings/item';
import {Screens} from '@constants';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import {dismissModal, goToScreen, setButtons} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

import type {AvailableScreens} from '@typings/screens/navigation';

const CLOSE_BUTTON_ID = 'close-settings';

type SettingsProps = {
    componentId: AvailableScreens;
    helpLink: string;
    showHelp: boolean;
    siteName: string;
}

//todo: Profile the whole feature - https://mattermost.atlassian.net/browse/MM-39711

const Settings = ({componentId}: SettingsProps) => {
    const theme = useTheme();
    const intl = useIntl();

    const closeButton = useMemo(() => {
        return {
            id: CLOSE_BUTTON_ID,
            icon: CompassIcon.getImageSourceSync('close', 24, theme.centerChannelColor),
            testID: 'close.settings.button',
        };
    }, [theme.centerChannelColor]);

    const close = useCallback(() => {
        dismissModal({componentId});
    }, [componentId]);

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [closeButton],
        });
    }, []);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, []);

    const goToNotifications = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_NOTIFICATION;
        const title = intl.formatMessage({id: 'settings.notifications', defaultMessage: 'Notifications'});

        goToScreen(screen, title);
    });

    const goToDisplaySettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_DISPLAY;
        const title = intl.formatMessage({id: 'settings.display', defaultMessage: 'Display'});

        goToScreen(screen, title);
    });

    const goToAdvancedSettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_ADVANCED;
        const title = intl.formatMessage({id: 'settings.advanced_settings', defaultMessage: 'Advanced Settings'});

        goToScreen(screen, title);
    });

    return (
        <SettingContainer testID='settings'>
            <SettingItem
                onPress={goToNotifications}
                optionName='notification'
                testID='settings.notifications.option'
            />
            <SettingItem
                onPress={goToDisplaySettings}
                optionName='display'
                testID='settings.display.option'
            />
            <SettingItem
                onPress={goToAdvancedSettings}
                optionName='advanced_settings'
                testID='settings.advanced_settings.option'
            />
        </SettingContainer>
    );
};

export default Settings;
