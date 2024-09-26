// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, View} from 'react-native';

import CameraAction from './camera_quick_action';
import FileAction from './file_quick_action';
import ImageAction from './image_quick_action';
import IssueAction from './issue_action';
import PostPriorityAction from './post_priority_action';
import TaskAction from './task_action';
import TroubleAction from './trouble_action';

type Props = {
    testID?: string;
    canUploadFiles: boolean;
    fileCount: number;
    isPostPriorityEnabled: boolean;
    canShowPostPriority?: boolean;
    maxFileCount: number;

    // Draft Handler
    value: string;
    updateValue: (value: string) => void;
    addFiles: (file: FileInfo[]) => void;
    postPriority: PostPriority;
    updatePostPriority: (postPriority: PostPriority) => void;
    focus: () => void;
}

const style = StyleSheet.create({
    quickActionsContainer: {
        display: 'flex',
        flexDirection: 'row',
        height: 44,
    },
});

export default function QuickActions({
    testID,
    canUploadFiles,
    fileCount,
    isPostPriorityEnabled,
    canShowPostPriority,
    maxFileCount,
    addFiles,
    postPriority,
    updatePostPriority,
}: Props) {
    const fileActionTestID = `${testID}.file_action`;
    const imageActionTestID = `${testID}.image_action`;
    const cameraActionTestID = `${testID}.camera_action`;
    const postPriorityActionTestID = `${testID}.post_priority_action`;

    const uploadProps = {
        disabled: !canUploadFiles,
        fileCount,
        maxFileCount,
        maxFilesReached: fileCount >= maxFileCount,
        onUploadFiles: addFiles,
    };

    return (
        <View
            testID={testID}
            style={style.quickActionsContainer}
        >
            <FileAction
                testID={fileActionTestID}
                {...uploadProps}
            />
            <ImageAction
                testID={imageActionTestID}
                {...uploadProps}
            />
            <CameraAction
                testID={cameraActionTestID}
                {...uploadProps}
            />
            {isPostPriorityEnabled && canShowPostPriority && (
                <PostPriorityAction
                    testID={postPriorityActionTestID}
                    postPriority={postPriority}
                    updatePostPriority={updatePostPriority}
                />
            )}
            <TroubleAction/>
            <IssueAction/>
            <TaskAction/>
        </View>
    );
}
