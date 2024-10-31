// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {Keyboard, ScrollView} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {addFilesToDraft, removeDraft} from '@actions/local/draft';
import {createPost} from '@actions/remote/post';
import Button from '@components/button';
import CompassIcon from '@components/compass_icon';
import ErrorText from '@components/error_text';
import FloatingTextInput from '@components/floating_text_input_label';
import CameraType from '@components/post_draft/quick_actions/camera_quick_action/camera_type';
import Uploads from '@components/post_draft/uploads';
import {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import DraftUploadManager from '@managers/draft_upload_manager';
import {TITLE_HEIGHT} from '@screens/bottom_sheet/content';
import {bottomSheet, buildNavigationButton, dismissModal, setButtons} from '@screens/navigation';
import {fileMaxWarning, fileSizeWarning} from '@utils/file';
import PickerUtil from '@utils/file/file_picker';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {AvailableScreens} from '@typings/screens/navigation';
import type {CameraOptions} from 'react-native-image-picker';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            flex: 1,
            flexDirection: 'column',
        },
        errorContainer: {
            marginTop: 15,
            marginLeft: 15,
            fontSize: 14,
            fontWeight: 'bold',
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 16,
        },
        field: {
            marginTop: 16,
        },
    };
});

type Props = {
    componentId: AvailableScreens;
    channelId: string;
    currentUserId: string;
    maxFileCount: number;
    maxFileSize: number;
    files: FileInfo[];
}

const close = () => {
    Keyboard.dismiss();
    dismissModal();
};

const makeCloseButton = (theme: Theme) => {
    const icon = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.create-post.button', icon);
};

const ATTACH_CAMERA_ID = 'attach-camera';
const ATTACH_IMAGE_ID = 'attach-image';
const CLOSE_BUTTON_ID = 'close-create-post';

type Values = {[name: string]: any}
type ValuesAction = {name: string; value: any}
function valuesReducer(state: Values, action: ValuesAction) {
    if (state[action.name] === action.value) {
        return state;
    }
    return {...state, [action.name]: action.value};
}

type ErrorHandlers = {
    [clientId: string]: (() => void) | null;
}

function CreatePost({
    componentId,
    channelId,
    currentUserId,
    maxFileCount,
    maxFileSize,
    files,
}: Props) {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const intl = useIntl();
    const style = getStyleSheet(theme);
    const {bottom} = useSafeAreaInsets();
    const [submitError, setSubmitError] = useState('');
    const [values, dispatchValues] = useReducer(valuesReducer, {});
    const [submitting, setSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState<React.ReactNode>(null);

    const cameraButton = useMemo(() => {
        const icon = CompassIcon.getImageSourceSync('camera-outline', 24, theme.sidebarHeaderTextColor);
        const base = buildNavigationButton(ATTACH_CAMERA_ID, 'attach-camera.button', icon);
        base.enabled = !submitting;
        return base;
    }, [submitting, theme]);

    const imageButton = useMemo(() => {
        const icon = CompassIcon.getImageSourceSync('image-outline', 24, theme.sidebarHeaderTextColor);
        const base = buildNavigationButton(ATTACH_IMAGE_ID, 'attach-image.button', icon);
        base.enabled = !submitting;
        return base;
    }, [submitting, theme]);

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [makeCloseButton(theme)],
            rightButtons: [cameraButton, imageButton],
        });
    }, [componentId, cameraButton, imageButton, theme]);

    const onChange = useCallback((name: string, value: any) => {
        dispatchValues({name, value});
    }, []);

    const uploadErrorTimeout = useRef<NodeJS.Timeout>();
    const uploadErrorHandlers = useRef<ErrorHandlers>({});

    const newUploadError = useCallback((error: React.ReactNode) => {
        if (uploadErrorTimeout.current) {
            clearTimeout(uploadErrorTimeout.current);
        }
        setUploadError(error);

        uploadErrorTimeout.current = setTimeout(() => {
            setUploadError(null);
        }, 5000);
    }, []);

    const addFiles = useCallback((newFiles: FileInfo[]) => {
        if (!newFiles.length) {
            return;
        }

        const currentFileCount = files?.length || 0;
        const availableCount = maxFileCount - currentFileCount;
        if (newFiles.length > availableCount) {
            newUploadError(fileMaxWarning(intl, maxFileCount));
            return;
        }

        const largeFile = newFiles.find((file) => file.size > maxFileSize);
        if (largeFile) {
            newUploadError(fileSizeWarning(intl, maxFileSize));
            return;
        }

        addFilesToDraft(serverUrl, channelId, '', newFiles);

        for (const file of newFiles) {
            DraftUploadManager.prepareUpload(serverUrl, file, channelId, '');
            uploadErrorHandlers.current[file.clientId!] = DraftUploadManager.registerErrorHandler(file.clientId!, newUploadError);
        }

        newUploadError(null);
    }, [intl, newUploadError, maxFileSize, serverUrl, files?.length, channelId]);

    const handleCameraPress = useCallback((options: CameraOptions) => {
        const picker = new PickerUtil(intl, addFiles);

        picker.attachFileFromCamera(options);
    }, [intl, addFiles]);

    const renderContent = useCallback(() => {
        return (
            <CameraType
                onPress={handleCameraPress}
            />
        );
    }, [handleCameraPress]);

    const handleAttachCamera = useCallback(() => {
        bottomSheet({
            title: intl.formatMessage({id: 'mobile.camera_type.title', defaultMessage: 'Camera options'}),
            renderContent,
            snapPoints: [1, bottomSheetSnapPoint(2, ITEM_HEIGHT, bottom) + TITLE_HEIGHT],
            theme,
            closeButtonId: 'camera-close-id',
        });
    }, [intl, theme, renderContent, maxFileCount, bottom]);

    const handleAttachImage = useCallback(() => {
        const picker = new PickerUtil(intl, addFiles);

        picker.attachFileFromPhotoGallery(maxFileCount - files.length);
    }, [addFiles, files.length, maxFileCount]);

    useEffect(() => {
        let loadingFiles: FileInfo[] = [];
        if (files) {
            loadingFiles = files.filter((v) => v.clientId && DraftUploadManager.isUploading(v.clientId));
        }

        for (const key of Object.keys(uploadErrorHandlers.current)) {
            if (!loadingFiles.find((v) => v.clientId === key)) {
                uploadErrorHandlers.current[key]?.();
                delete (uploadErrorHandlers.current[key]);
            }
        }

        for (const file of loadingFiles) {
            if (!uploadErrorHandlers.current[file.clientId!]) {
                uploadErrorHandlers.current[file.clientId!] = DraftUploadManager.registerErrorHandler(file.clientId!, newUploadError);
            }
        }
    }, [files]);

    const handleSubmit = useCallback(async () => {
        const {title, content} = values;
        const postFiles = files.filter((f) => !f.failed);
        if (!content && postFiles.length === 0) {
            setSubmitError('Vui lòng nhập nội dung');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            const post = {
                user_id: currentUserId,
                channel_id: channelId,
                message: `${title ? `**${title}**\n` : ''}${content}`,
            } as Partial<Post>;
            createPost(serverUrl, post, postFiles);
            removeDraft(serverUrl, channelId);
            close();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [serverUrl, values, files]);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, [close]);
    useNavButtonPressed(ATTACH_CAMERA_ID, componentId, handleAttachCamera, [handleAttachCamera]);
    useNavButtonPressed(ATTACH_IMAGE_ID, componentId, handleAttachImage, [handleAttachImage]);

    return (
        <SafeAreaView style={style.container}>
            <ScrollView style={style.scrollView}>
                <FloatingTextInput
                    autoCorrect={false}
                    containerStyle={style.field}
                    disableFullscreenUI={true}
                    label='Tiêu đề'
                    onChangeText={(v) => onChange('title', v)}
                    theme={theme}
                    value={values.title}
                />
                <FloatingTextInput
                    autoCorrect={false}
                    containerStyle={style.field}
                    multilineInputHeight={320}
                    multiline={true}
                    label='Nội dung'
                    onChangeText={(v) => onChange('content', v)}
                    theme={theme}
                    value={values.content}
                />
                <Uploads
                    channelId={channelId}
                    currentUserId={currentUserId}
                    files={files}
                    rootId=''
                    uploadFileError={uploadError}
                />
            </ScrollView>
            {Boolean(submitError) && (
                <ErrorText
                    textStyle={style.errorContainer}
                    error={submitError}
                />
            )}
            <Button
                iconName='send'
                iconSize={24}
                text='Gửi'
                theme={theme}
                backgroundStyle={{margin: 16}}
                onPress={handleSubmit}
            />
        </SafeAreaView>
    );
}

export default CreatePost;
