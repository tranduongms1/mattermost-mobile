// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text, View, type StyleProp, type ViewStyle} from 'react-native';

import ProfilePicture from '@components/profile_picture';
import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';

import type UserModel from '@typings/database/models/servers/user';

type Props = {
    users: UserModel[];
    count: number;
    style: StyleProp<ViewStyle>;
    size: number;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flexDirection: 'row',
            flexWrap: 'wrap-reverse',
            alignItems: 'center',
            justifyContent: 'center',
        },
        count: {
            alignItems: 'center',
            backgroundColor: theme.sidebarText,
            borderColor: 'white',
            borderRadius: 100,
            borderWidth: 2,
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: -8,
            marginLeft: -8,
        },
        text: {
            color: theme.sidebarBg,
        },
    };
});

const GmAvatar = ({
    users,
    count,
    style,
    size,
}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    const authors = count > 4 ? users.slice(0, 3) : users;
    const itemSize = Math.floor(size / 2) + 4;
    const fontSize = Math.floor(0.4 * itemSize);

    return (
        <View
            style={[styles.container, style, {width: size, height: size}]}
        >
            {authors.map((author, i) => {
                return (
                    <ProfilePicture
                        key={author.id}
                        author={author}
                        size={itemSize}
                        showStatus={false}
                        containerStyle={[
                            (i === 1 || i === 3) && {
                                marginLeft: -8,
                            },
                            (i === 2 || i === 3) && {
                                marginBottom: -8,
                            },
                        ]}
                    />
                );
            })}
            {count > 4 &&
                <View
                    key='count'
                    style={[styles.count, {width: itemSize, height: itemSize}]}
                >
                    <Text style={[styles.text, {fontSize}]}>{`+${count - 3}`}</Text>
                </View>
            }
        </View>
    );
};

export default GmAvatar;
