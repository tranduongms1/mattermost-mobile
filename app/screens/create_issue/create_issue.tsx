// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, Keyboard, ScrollView} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {addFilesToDraft, removeDraft, updateDraftProps} from '@actions/local/draft';
import AssetId from '@components/asset_id';
import Button from '@components/button';
import CompassIcon from '@components/compass_icon';
import ErrorText from '@components/error_text';
import FloatingTextInput from '@components/floating_text_input_label';
import CameraType from '@components/post_draft/quick_actions/camera_quick_action/camera_type';
import Uploads from '@components/post_draft/uploads';
import Select from '@components/select';
import {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useFileUploadError from '@hooks/file_upload_error';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import DraftUploadManager from '@managers/draft_upload_manager';
import NetworkManager from '@managers/network_manager';
import {TITLE_HEIGHT} from '@screens/bottom_sheet/content';
import {bottomSheet, buildNavigationButton, dismissModal, setButtons} from '@screens/navigation';
import {fileMaxWarning, fileSizeWarning, uploadDisabledWarning} from '@utils/file';
import PickerUtil from '@utils/file/file_picker';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {ErrorHandlers} from '@typings/components/upload_error_handlers';
import type ChannelModel from '@typings/database/models/servers/channel';
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
    channels: ChannelModel[];
    canUploadFiles: boolean;
    componentId: AvailableScreens;
    currentChannelId: string;
    currentUserId: string;
    maxFileCount: number;
    maxFileSize: number;
    files: FileInfo[];
    props: any;
}

const close = () => {
    Keyboard.dismiss();
    dismissModal();
};

const makeCloseButton = (theme: Theme) => {
    const icon = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.create-issue.button', icon);
};

const ATTACH_CAMERA_ID = 'attach-camera';
const ATTACH_IMAGE_ID = 'attach-image';
const CLOSE_BUTTON_ID = 'close-create-issue';

type Values = {[name: string]: any}
type ValuesAction = {name: string; value: any}
function valuesReducer(state: Values, action: ValuesAction) {
    if (state[action.name] === action.value) {
        return state;
    }
    return {...state, [action.name]: action.value};
}

function CreateIssue({
    channels,
    canUploadFiles,
    componentId,
    currentChannelId,
    currentUserId,
    maxFileCount,
    maxFileSize,
    files,
    props,
}: Props) {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const intl = useIntl();
    const style = getStyleSheet(theme);
    const {bottom} = useSafeAreaInsets();
    const [values, dispatchValues] = useReducer(valuesReducer, props);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

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
        updateDraftProps(serverUrl, currentChannelId, 'issue', {[name]: value});
    }, [serverUrl, currentChannelId]);

    const uploadErrorHandlers = useRef<ErrorHandlers>({});
    const {uploadError, newUploadError} = useFileUploadError();

    const addFiles = useCallback((newFiles: FileInfo[]) => {
        if (!newFiles.length) {
            return;
        }

        if (!canUploadFiles) {
            newUploadError(uploadDisabledWarning(intl));
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

        addFilesToDraft(serverUrl, currentChannelId, 'issue', newFiles);

        for (const file of newFiles) {
            DraftUploadManager.prepareUpload(serverUrl, file, currentChannelId, 'issue');
            uploadErrorHandlers.current[file.clientId!] = DraftUploadManager.registerErrorHandler(file.clientId!, newUploadError);
        }

        newUploadError(null);
    }, [intl, newUploadError, maxFileSize, serverUrl, files?.length, currentChannelId]);

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
            snapPoints: [1, bottomSheetSnapPoint(2, ITEM_HEIGHT) + TITLE_HEIGHT],
            theme,
            closeButtonId: 'camera-close-id',
        });
    }, [intl, theme, renderContent, maxFileCount, bottom]);

    const handleAttachImage = useCallback(() => {
        const picker = new PickerUtil(intl, addFiles);

        picker.attachFileFromPhotoGallery(maxFileCount - files.length);
    }, [addFiles, files.length, maxFileCount]);

    const handleSubmit = useCallback(async () => {
        const {channel_id, title, description} = values;
        if (!title) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        if (channels.length > 1 && !channel_id) {
            setSubmitError('Vui lòng chọn nhóm muốn gửi');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        const client = NetworkManager.getClient(serverUrl);
        try {
            await client.doFetch(
                client.urlVersion + '/issues',
                {
                    method: 'post',
                    body: {
                        message: title,
                        channel_id: channel_id || channels[0].id,
                        file_ids: files.map((f) => f.id),
                        props: {
                            title,
                            description,
                        },
                    },
                },
            );
            removeDraft(serverUrl, currentChannelId, 'issue');
            Alert.alert('Bạn đã báo sự cố thành công');
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
                    disableFullscreenUI={true}
                    multiline={true}
                    label={'Mô tả sự cố'}
                    onChangeText={(v) => onChange('description', v)}
                    theme={theme}
                    value={values.description}
                />
                <AssetId/>
                {channels.length > 1 &&
                    <Select
                        containerStyle={style.field}
                        placeholder='Gửi tới nhóm'
                        options={channels.map((c) => ({text: c.displayName, value: c.id}))}
                        selected={values.channel_id}
                        onSelected={(opt) => onChange('channel_id', opt.value)}
                    />
                }
                <Uploads
                    channelId={currentChannelId}
                    currentUserId={currentUserId}
                    files={files}
                    rootId='issue'
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
                text='Gửi'
                theme={theme}
                backgroundStyle={{margin: 16}}
                onPress={handleSubmit}
            />
        </SafeAreaView>
    );
}

export default CreateIssue;
