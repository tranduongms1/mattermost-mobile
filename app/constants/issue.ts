// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export const ATTITUDE_IMAGES = [
    require('@assets/images/emojis/attitude_1.png'),
    require('@assets/images/emojis/attitude_2.png'),
    require('@assets/images/emojis/attitude_3.png'),
];

type Action = {
    iconName: string;
    text: string;
    newStatus?: string;
}

export const ACTIONS: Record<string, Action[]> = {
    open: [
        {
            iconName: 'check',
            text: 'Xác nhận',
            newStatus: 'confirmed',
        },
        {
            iconName: 'arrow-right',
            text: 'Báo xong',
            newStatus: 'done',
        },
    ],
    confirmed: [
        {
            iconName: 'check',
            text: 'Xác nhận',
        },
        {
            iconName: 'arrow-right',
            text: 'Báo xong',
            newStatus: 'done',
        },
    ],
    done: [
        {
            iconName: 'restore',
            text: 'Làm lại',
            newStatus: 'confirmed',
        },
        {
            iconName: 'check-all',
            text: 'Nghiệm thu',
            newStatus: 'completed',
        },
    ],
    completed: [
        {
            iconName: 'check-all',
            text: 'Đã nghiệm thu hoàn thành',
        },
    ],
};
