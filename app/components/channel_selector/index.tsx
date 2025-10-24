// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import Select, {type Option, type SelectProps} from '@components/select';
import {useServerUrl} from '@context/server';
import NetworkManager from '@managers/network_manager';

type Props = {
    onSelected: (option: Option) => void;
    placeholder: string;
    containerStyle?: SelectProps['containerStyle'];
    noneOption?: Option;
}

const ChannelSelector = ({
    containerStyle,
    noneOption,
    onSelected,
    placeholder,
}: Props) => {
    const serverUrl = useServerUrl();
    const [opts, setOpts] = useState<Option[]>([]);
    const [selected, setSelected] = useState<string>();

    useEffect(() => {
        const getOption = (c: Channel) => ({text: c.display_name, value: c.id});
        const client = NetworkManager.getClient(serverUrl);
        client.doFetch(
            `${client.getUserRoute('me')}/tasks/channels`,
            {method: 'get'},
        ).
            then((r) => (r as any).map(getOption)).
            then(setOpts);
    }, [serverUrl]);

    if (opts.length < 2) {
        return <View style={containerStyle}/>;
    }

    const options = opts.slice();
    if (noneOption) {
        options.unshift(noneOption);
    }

    return (
        <Select
            containerStyle={containerStyle}
            placeholder={placeholder}
            options={options}
            selected={selected}
            onSelected={(opt) => {
                setSelected(opt.value);
                onSelected(opt);
            }}
        />
    );
};

export default ChannelSelector;
