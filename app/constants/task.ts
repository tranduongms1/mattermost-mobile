// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
type Action = {
    iconName: string;
    text: string;
    newStatus?: string;
}

export const TaskActions: Record<string, Action[]> = {
    new: [
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

export default {
    TaskActions,
};
