// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Platform, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {makeDirectChannel} from '@actions/remote/channel';
import Search from '@components/search';
import UserList from '@components/user_list';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {alertErrorWithFallback} from '@utils/draft';
import {changeOpacity, getKeyboardAppearanceFromTheme} from '@utils/theme';
import {displayUsername, filterProfilesMatchingTerm} from '@utils/user';

const messages = defineMessages({
    dm: {
        id: 'mobile.open_dm.error',
        defaultMessage: "We couldn't open a direct message with {displayName}. Please check your connection and try again.",
    },
});

type Props = {
    contacts: UserProfile[];
    currentUserId: string;
    teammateNameDisplay: string;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        marginLeft: 12,
        marginRight: Platform.select({ios: 4, default: 12}),
        marginVertical: 12,
    },
});

export default function ContactsScreen({
    contacts,
    currentUserId,
    teammateNameDisplay,
}: Props) {
    const serverUrl = useServerUrl();
    const theme = useTheme();
    const intl = useIntl();
    const {formatMessage} = intl;

    const [term, setTerm] = useState('');

    const clearSearch = useCallback(() => {
        setTerm('');
    }, []);

    const onChangeText = useCallback((searchTerm: string) => {
        setTerm(searchTerm);
    }, []);

    const createDirectChannel = useCallback(async (user: UserProfile): Promise<boolean> => {
        const displayName = displayUsername(user, intl.locale, teammateNameDisplay);
        const result = await makeDirectChannel(serverUrl, user.id, displayName);

        if (result.error) {
            alertErrorWithFallback(intl, result.error, messages.dm);
        }

        return !result.error;
    }, [intl.locale, teammateNameDisplay, serverUrl]);

    const profiles = useMemo(() => {
        if (term) {
            const exactMatches: UserProfile[] = [];
            const results = filterProfilesMatchingTerm(contacts, term).filter((p: UserProfile) => {
                if (p.id === currentUserId) {
                    return false;
                }
                if (p.username === term || p.username.startsWith(term)) {
                    exactMatches.push(p);
                    return false;
                }
                return true;
            });
            return [...exactMatches, ...results];
        }
        return contacts;
    }, [currentUserId, term, contacts]);

    return (
        <SafeAreaView
            style={styles.container}
            testID='contacts.screen'
            edges={['top', 'left', 'right']}
        >
            <View style={styles.searchBar}>
                <Search
                    testID='create_direct_message.search_bar'
                    placeholder={formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                    cancelButtonTitle={formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                    onChangeText={onChangeText}
                    onCancel={clearSearch}
                    autoCapitalize='none'
                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                    value={term}
                />
            </View>
            <UserList
                currentUserId={currentUserId}
                handleSelectProfile={createDirectChannel}
                loading={false}
                location='Contacts'
                selectedIds={{}}
                showNoResults={false}
                tutorialWatched={true}
                profiles={profiles}
                term={term}
                testID='contacts.user_list'
            />
        </SafeAreaView>
    );
}
