// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react';
import {TextInput, type TextInputProps} from 'react-native';

export default function AutoGrowingTextInput(props: TextInputProps) {
    const [height, setHeight] = useState(40);

    return (
        <TextInput
            {...props}
            multiline={true}
            style={[props.style, {textAlignVertical: 'top', height}]}
            onContentSizeChange={(event) => {
                setHeight(event.nativeEvent.contentSize.height);
            }}
        />
    );
}
