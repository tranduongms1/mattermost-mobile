// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, View} from 'react-native';

import CameraAction from './camera_quick_action';
import FileAction from './file_quick_action';
import ImageAction from './image_quick_action';
import InputAction from './input_quick_action';
import IssueAction from './issue_action';
import PlanAction from './plan_action';
import PostPriorityAction from './post_priority_action';
import TaskAction from './task_action';
import TroubleAction from './trouble_action';

type Props = {
    testID?: string;
    canUploadFiles: boolean;
    fileCount: number;
    isPostPriorityEnabled: boolean;
    canCreatePlan?: boolean;
    canShowPostPriority?: boolean;
    canShowSlashCommands?: boolean;
    maxFileCount: number;

    // Draft Handler
    value: string;
    updateValue: (value: string) => void;
    addFiles: (file: FileInfo[]) => void;
    postPriority: PostPriority;
    updatePostPriority: (postPriority: PostPriority) => void;
    focus: () => void;
}

export const QUICK_ACTIONS_HEIGHT = 44;

const style = StyleSheet.create({
    quickActionsContainer: {
        display: 'flex',
        flexDirection: 'row',
        height: QUICK_ACTIONS_HEIGHT,
    },
});

export default function QuickActions({
    testID,
    canUploadFiles,
    value,
    fileCount,
    isPostPriorityEnabled,
    canCreatePlan,
    canShowSlashCommands = true,
    canShowPostPriority,
    maxFileCount,
    updateValue,
    addFiles,
    postPriority,
    updatePostPriority,
    focus,
}: Props) {
    const atDisabled = value[value.length - 1] === '@';
    const slashDisabled = value.length > 0;

    const atInputActionTestID = `${testID}.at_input_action`;
    const slashInputActionTestID = `${testID}.slash_input_action`;
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
            {false &&
            <InputAction
                testID={atInputActionTestID}
                disabled={atDisabled}
                inputType='at'
                updateValue={updateValue}
                focus={focus}
            />
            }
            {false && canShowSlashCommands && (
                <InputAction
                    testID={slashInputActionTestID}
                    disabled={slashDisabled}
                    inputType='slash'
                    updateValue={updateValue}
                    focus={focus}
                />
            )}
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
            {false && isPostPriorityEnabled && canShowPostPriority && (
                <PostPriorityAction
                    testID={postPriorityActionTestID}
                    postPriority={postPriority}
                    updatePostPriority={updatePostPriority}
                />
            )}
            <TroubleAction/>
            <IssueAction/>
            {canCreatePlan &&
                <PlanAction/>
            }
            <TaskAction/>
        </View>
    );
}
