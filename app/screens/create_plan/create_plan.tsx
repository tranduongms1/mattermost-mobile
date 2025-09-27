// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, Keyboard, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

import {addFilesToDraft, removeDraft, updateDraftProps} from '@actions/local/draft';
import {fetchTasksForChannel} from '@actions/remote/task';
import AutoGrowingTextInput from '@components/auto_growing_text_input';
import CompassIcon from '@components/compass_icon';
import DateRangePicker from '@components/date_range_picker';
import ErrorText from '@components/error_text';
import Uploads from '@components/post_draft/uploads';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useFileUploadError from '@hooks/file_upload_error';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import DraftUploadManager from '@managers/draft_upload_manager';
import NetworkManager from '@managers/network_manager';
import {buildNavigationButton, dismissModal, goToScreen, setButtons} from '@screens/navigation';
import {fileMaxWarning, fileSizeWarning, uploadDisabledWarning} from '@utils/file';
import PickerUtil from '@utils/file/file_picker';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type {ErrorHandlers} from '@typings/components/upload_error_handlers';
import type {AvailableScreens} from '@typings/screens/navigation';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
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
        text: {
            color: theme.centerChannelColor,
            flex: 1,
            paddingVertical: 12,
            ...typography('Body', 200, 'Regular'),
        },
        card: {
            backgroundColor: theme.centerChannelBg,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderRadius: 8,
            borderWidth: 1,
            marginVertical: 4,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            borderBottomWidth: 1,
        },
        lastRow: {
            borderBottomWidth: 0,
        },
        icon: {
            fontSize: 20,
            color: theme.centerChannelColor,
        },
        action: {
            padding: 16,
        },
        actionIcon: {
            fontSize: 16,
            color: theme.centerChannelColor,
        },
        input: {
            color: theme.centerChannelColor,
            flex: 1,
            marginLeft: 8,
            paddingVertical: 2,
            ...typography('Body', 100, 'Regular'),
        },
        title: {
            color: theme.centerChannelColor,
            flex: 1,
            marginLeft: 8,
            paddingVertical: 12,
            ...typography('Body', 100, 'Regular'),
        },
    };
});

type Props = {
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
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.create-plan.button', icon);
};

const ATTACH_BUTTON_ID = 'attach-button';
const CLOSE_BUTTON_ID = 'close-create-plan';
const SEND_BUTTON_ID = 'send';

function CreatePlan({
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
    const styles = getStyleSheet(theme);
    const placeholder = changeOpacity(theme.centerChannelColor, 0.56);
    const [title, setTitle] = useState(props.title || '');
    const [startDate, setStartDate] = useState<Date | undefined>(props.startDate ? new Date(props.startDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(props.endDate ? new Date(props.endDate) : undefined);
    const [troubles, setTroubles] = useState<any[]>(props.troubles || []);
    const [issues, setIssues] = useState<any[]>(props.issues || []);
    const [checklists, setChecklists] = useState<any[]>(props.checklists || []);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const attachButton = useMemo(() => {
        const icon = CompassIcon.getImageSourceSync('paperclip', 24, theme.sidebarHeaderTextColor);
        const base = buildNavigationButton(ATTACH_BUTTON_ID, 'attach.button', icon);
        base.enabled = !submitting;
        return base;
    }, [submitting, theme]);

    const sendButton = useMemo(() => {
        const icon = CompassIcon.getImageSourceSync('send', 24, theme.sidebarHeaderTextColor);
        const base = buildNavigationButton(SEND_BUTTON_ID, 'send.button', icon);
        base.enabled = !submitting;
        return base;
    }, [submitting, theme]);

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [makeCloseButton(theme)],
            rightButtons: [sendButton, attachButton],
        });
    }, [componentId, theme, sendButton, attachButton]);

    const updateTroubles = useCallback((value: any[]) => {
        setTroubles(value);
        updateDraftProps(serverUrl, currentChannelId, 'plan', {troubles: value});
    }, [serverUrl, currentChannelId]);

    const updateIssues = useCallback((value: any[]) => {
        setIssues(value);
        updateDraftProps(serverUrl, currentChannelId, 'plan', {issues: value});
    }, [serverUrl, currentChannelId]);

    const updateChecklists = useCallback((value: any[]) => {
        setChecklists(value);
        updateDraftProps(serverUrl, currentChannelId, 'plan', {checklists: value});
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

        addFilesToDraft(serverUrl, currentChannelId, 'plan', newFiles);

        for (const file of newFiles) {
            DraftUploadManager.prepareUpload(serverUrl, file, currentChannelId, 'plan');
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

    const handleAttach = useCallback(() => {
        const picker = new PickerUtil(intl, addFiles);

        picker.attachFileFromFiles(undefined, true);
    }, [addFiles, files.length, maxFileCount]);

    const handleSubmit = useCallback(async () => {
        if (!title) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }

        setSubmitting(true);
        setSubmitError('');
        const client = NetworkManager.getClient(serverUrl);
        try {
            await client.doFetch(
                client.urlVersion + '/plans',
                {
                    method: 'post',
                    body: {
                        message: title,
                        channel_id: currentChannelId,
                        file_ids: files.map((f) => f.id),
                        props: {
                            title,
                            start_date: startDate && startDate.getTime(),
                            end_date: endDate && endDate.getTime(),
                            troubles: troubles.map((item) => item.value),
                            issues: issues.map((item) => item.value),
                            checklists: checklists.filter((item) => item.title),
                        },
                    },
                },
            );
            removeDraft(serverUrl, currentChannelId, 'plan');
            Alert.alert('Bạn đã giao việc thành công');
            close();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [serverUrl, title, files, troubles, issues, checklists]);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, [close]);
    useNavButtonPressed(ATTACH_BUTTON_ID, componentId, handleAttach, [handleAttach]);
    useNavButtonPressed(SEND_BUTTON_ID, componentId, handleSubmit, [handleSubmit]);

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView style={styles.scrollView}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <TextInput
                            autoCorrect={false}
                            placeholder='Tiêu đề'
                            placeholderTextColor={placeholder}
                            style={styles.text}
                            value={title}
                            onChangeText={(v) => {
                                setTitle(v);
                                updateDraftProps(serverUrl, currentChannelId, 'plan', {title: v});
                            }}
                        />
                    </View>
                    <DateRangePicker
                        style={[styles.row, styles.lastRow]}
                        startDate={startDate}
                        endDate={endDate}
                        minimumDate={new Date()}
                        onStartDateChange={(v) => {
                            setStartDate(v);
                            updateDraftProps(serverUrl, currentChannelId, 'plan', {startDate: v});
                        }}
                        onEndDateChange={(v) => {
                            setEndDate(v);
                            updateDraftProps(serverUrl, currentChannelId, 'plan', {endDate: v});
                        }}
                    />
                </View>
                <Uploads
                    channelId={currentChannelId}
                    currentUserId={currentUserId}
                    files={files}
                    rootId='plan'
                    uploadFileError={uploadError}
                />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc trouble'}</Text>
                    </View>
                    {troubles.map((item: any, idx: number) => (
                        <View
                            key={idx}
                            style={[styles.row, {paddingRight: 0}]}
                        >
                            <CompassIcon
                                name='checkbox-blank-outline'
                                style={styles.icon}
                            />
                            <Text style={styles.input}>{item.text}</Text>
                            <TouchableOpacity
                                style={styles.action}
                                onPress={() => {
                                    const s = troubles.slice();
                                    s.splice(idx, 1);
                                    updateTroubles(s);
                                }}
                            >
                                <CompassIcon
                                    name='close'
                                    style={styles.actionIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.row, styles.lastRow]}
                        onPress={() => {
                            goToScreen(
                                Screens.INTEGRATION_SELECTOR,
                                'Chọn trouble',
                                {
                                    dataSource: 'troubles',
                                    getDynamicOptions: async () => {
                                        const res = await fetchTasksForChannel(serverUrl, currentChannelId, 'trouble', ['new', 'confirmed']);
                                        if (!res.posts) {
                                            return [];
                                        }
                                        const selectedFilter = (p: any) => !troubles.some((t) => t.value === p.id);
                                        return res.posts.filter(selectedFilter).map((p: any) => ({
                                            text: p.props.title || p.message,
                                            value: p.id,
                                        }));
                                    },
                                    handleSelect: (item: any) => updateTroubles([...troubles, item]),
                                },
                            );
                        }}
                    >
                        <CompassIcon
                            name='plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>{'Thêm trouble'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc sự cố'}</Text>
                    </View>
                    {issues.map((item: any, idx: number) => (
                        <View
                            key={idx}
                            style={[styles.row, {paddingRight: 0}]}
                        >
                            <CompassIcon
                                name='checkbox-blank-outline'
                                style={styles.icon}
                            />
                            <Text style={styles.input}>{item.text}</Text>
                            <TouchableOpacity
                                style={styles.action}
                                onPress={() => {
                                    const s = issues.slice();
                                    s.splice(idx, 1);
                                    updateIssues(s);
                                }}
                            >
                                <CompassIcon
                                    name='close'
                                    style={styles.actionIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.row, styles.lastRow]}
                        onPress={() => {
                            goToScreen(
                                Screens.INTEGRATION_SELECTOR,
                                'Chọn sự cố',
                                {
                                    dataSource: 'issues',
                                    getDynamicOptions: async () => {
                                        const res = await fetchTasksForChannel(serverUrl, currentChannelId, 'issue', ['new', 'confirmed']);
                                        if (!res.posts) {
                                            return [];
                                        }
                                        const selectedFilter = (p: any) => !issues.some((t) => t.value === p.id);
                                        return res.posts.filter(selectedFilter).map((p: any) => ({
                                            text: p.props.title || p.message,
                                            value: p.id,
                                        }));
                                    },
                                    handleSelect: (item: any) => updateIssues([...issues, item]),
                                },
                            );
                        }}
                    >
                        <CompassIcon
                            name='plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>{'Thêm sự cố'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.text}>{'Công việc khác'}</Text>
                    </View>
                    {checklists.map((item: any, idx: number) => (
                        <View
                            key={idx}
                            style={[styles.row, {paddingRight: 0}]}
                        >
                            <CompassIcon
                                name='checkbox-blank-outline'
                                style={styles.icon}
                            />
                            <AutoGrowingTextInput
                                autoCorrect={false}
                                placeholder='Nội dung chi tiết'
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={item.title}
                                onChangeText={(v) => {
                                    const s = checklists.slice();
                                    s.splice(idx, 1, {title: v});
                                    updateChecklists(s);
                                }}
                            />
                            <TouchableOpacity
                                style={styles.action}
                                onPress={() => {
                                    const s = checklists.slice();
                                    s.splice(idx, 1);
                                    updateChecklists(s);
                                }}
                            >
                                <CompassIcon
                                    name='close'
                                    style={styles.actionIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.row, styles.lastRow]}
                        onPress={() => {
                            updateChecklists([...checklists, {title: ''}]);
                        }}
                    >
                        <CompassIcon
                            name='plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>{'Thêm nội dung'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
            {Boolean(submitError) && (
                <ErrorText
                    textStyle={styles.errorContainer}
                    error={submitError}
                />
            )}
        </View>
    );
}

export default CreatePlan;
