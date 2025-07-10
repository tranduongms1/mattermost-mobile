// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {addFilesToDraft, removeDraft} from '@actions/local/draft';
import CompassIcon from '@components/compass_icon';
import DateRangePicker from '@components/date_range_picker';
import ErrorText from '@components/error_text';
import Uploads from '@components/post_draft/uploads';
import {Preferences, Screens} from '@constants';
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
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

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
        textIcon: {
            color: theme.centerChannelColor,
            width: 20,
            ...typography('Heading', 75, 'SemiBold'),
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
    channelDisplayName: string;
    currentChannelId: string;
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
    return buildNavigationButton(CLOSE_BUTTON_ID, 'close.create-task.button', icon);
};

const ATTACH_BUTTON_ID = 'attach-button';
const CLOSE_BUTTON_ID = 'close-create-task';
const SEND_BUTTON_ID = 'send';

function CreateTask({
    canUploadFiles,
    componentId,
    currentChannelId,
    currentUserId,
    channelDisplayName,
    maxFileCount,
    maxFileSize,
    files,
}: Props) {
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const intl = useIntl();
    const styles = getStyleSheet(theme);
    const placeholder = changeOpacity(theme.centerChannelColor, 0.56);
    const [title, setTitle] = useState('');
    const [assignees, setAssignees] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [checklists, setChecklists] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const assigneeNames = assignees.map((u) => displayUsername(u, 'vn', Preferences.DISPLAY_PREFER_NICKNAME)).join(', ');
    const managerNames = managers.map((u) => displayUsername(u, 'vn', Preferences.DISPLAY_PREFER_NICKNAME)).join(', ');

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

        addFilesToDraft(serverUrl, currentChannelId, 'task', newFiles);

        for (const file of newFiles) {
            DraftUploadManager.prepareUpload(serverUrl, file, currentChannelId, 'task');
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

    const selectAssignee = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.INTEGRATION_SELECTOR,
            'Chọn người thực hiện',
            {
                dataSource: 'users',
                isMultiselect: true,
                handleSelect: setAssignees,
            },
        );
    }), []);

    const selectManager = useCallback(preventDoubleTap(() => {
        goToScreen(
            Screens.INTEGRATION_SELECTOR,
            'Chọn người quản lý',
            {
                dataSource: 'users',
                isMultiselect: true,
                handleSelect: setManagers,
            },
        );
    }), []);

    const handleSubmit = useCallback(async () => {
        if (!title) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        if (!assignees.length && !managers.length) {
            setSubmitError('Vui lòng chọn người thực hiện hoặc người quản lý');
            return;
        }
        const cleanItems = (items: any[]) => items.filter((i: any) => i.title);
        const cleanChecklists = checklists.
            map((c) => ({...c, items: cleanItems(c.items)})).
            filter((c) => c.title || c.items.length);

        if (!cleanChecklists.length) {
            setChecklists(cleanChecklists);
            setSubmitError('Vui lòng nhập nội dung trống');
            return;
        }
        for (const c of cleanChecklists) {
            if (!c.title) {
                setChecklists(cleanChecklists);
                setSubmitError('Vui lòng nhập nội dung trống');
                return;
            }
            if (c.items && c.items.some((i: any) => !i.title)) {
                setChecklists(cleanChecklists);
                setSubmitError('Vui lòng nhập chi tiết trống');
                return;
            }
        }
        for (const c of cleanChecklists) {
            c.startDate = c.startDate && c.startDate.getTime();
            c.endDate = c.endDate && c.endDate.getTime();
        }

        setSubmitting(true);
        setSubmitError('');
        const client = NetworkManager.getClient(serverUrl);
        try {
            await client.doFetch(
                client.urlVersion + '/tasks',
                {
                    method: 'post',
                    body: {
                        message: title,
                        channel_id: currentChannelId,
                        file_ids: files.map((f) => f.id),
                        props: {
                            title,
                            assignee_ids: assignees.map((u) => u.id),
                            manager_ids: managers.map((u) => u.id),
                            start_date: startDate && startDate.getTime(),
                            end_date: endDate && endDate.getTime(),
                            checklists: cleanChecklists,
                        },
                    },
                },
            );
            removeDraft(serverUrl, currentChannelId, 'task');
            Alert.alert('Bạn đã giao việc thành công');
            close();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [serverUrl, title, files, assignees, managers, checklists]);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, [close]);
    useNavButtonPressed(ATTACH_BUTTON_ID, componentId, handleAttach, [handleAttach]);
    useNavButtonPressed(SEND_BUTTON_ID, componentId, handleSubmit, [handleSubmit]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <TextInput
                            autoCorrect={false}
                            placeholder='Tiêu đề'
                            placeholderTextColor={placeholder}
                            style={styles.text}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>
                    <View style={[styles.row]}>
                        <CompassIcon
                            name='account-group'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>
                            {channelDisplayName}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.row]}
                        onPress={selectAssignee}
                    >
                        <Text style={styles.textIcon}>{'To:'}</Text>
                        <Text style={styles.title}>
                            {assigneeNames || 'Người thực hiện'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={selectManager}
                    >
                        <Text style={styles.textIcon}>{'CC:'}</Text>
                        <Text style={styles.title}>
                            {managerNames || 'Người quản lý'}
                        </Text>
                    </TouchableOpacity>
                    <DateRangePicker
                        style={[styles.row, styles.lastRow]}
                        startDate={startDate}
                        endDate={endDate}
                        minimumDate={new Date()}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </View>
                <Uploads
                    channelId={currentChannelId}
                    currentUserId={currentUserId}
                    files={files}
                    rootId='task'
                    uploadFileError={uploadError}
                />
                {checklists.map((checklist, checklistIdx) => (
                    <View
                        key={checklistIdx}
                        style={styles.card}
                    >
                        <View style={styles.row}>
                            <TextInput
                                autoCorrect={false}
                                placeholder='Nội dung'
                                placeholderTextColor={placeholder}
                                style={styles.text}
                                value={checklist.title}
                                onChangeText={(v) => {
                                    const s = checklists.slice();
                                    s.splice(checklistIdx, 1, {...checklist, title: v});
                                    setChecklists(s);
                                }}
                            />
                        </View>
                        {Boolean(checklists.length > 1 && startDate && endDate) &&
                        <DateRangePicker
                            style={[styles.row, styles.lastRow]}
                            startDate={checklist.startDate || startDate}
                            endDate={checklist.endDate || endDate}
                            maximumDate={endDate}
                            minimumDate={startDate}
                            onStartDateChange={(v) => {
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {...checklist, startDate: v});
                                setChecklists(s);
                            }}
                            onEndDateChange={(v) => {
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {...checklist, endDate: v});
                                setChecklists(s);
                            }}
                        />
                        }
                        {checklist.items.map((item: any, itemIdx: number) => (
                            <View
                                key={itemIdx}
                                style={[styles.row, {paddingRight: 0}]}
                            >
                                <CompassIcon
                                    name='checkbox-blank-outline'
                                    style={styles.icon}
                                />
                                <TextInput
                                    autoCorrect={false}
                                    placeholder='Chi tiết'
                                    placeholderTextColor={placeholder}
                                    style={styles.input}
                                    value={item.title}
                                    onChangeText={(v) => {
                                        const items = checklist.items.slice();
                                        items.splice(itemIdx, 1, {title: v});
                                        const s = checklists.slice();
                                        s.splice(checklistIdx, 1, {...checklist, items});
                                        setChecklists(s);
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.action}
                                    onPress={() => {
                                        const items = checklist.items.slice();
                                        items.splice(itemIdx, 1);
                                        const s = checklists.slice();
                                        s.splice(checklistIdx, 1, {...checklist, items});
                                        setChecklists(s);
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
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {
                                    ...checklist,
                                    items: [...checklist.items, {title: ''}],
                                });
                                setChecklists(s);
                            }}
                        >
                            <CompassIcon
                                name='plus'
                                style={styles.icon}
                            />
                            <Text style={styles.title}>{'Thêm chi tiết'}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={[styles.row, styles.lastRow]}
                        onPress={() => {
                            setChecklists([...checklists, {title: '', items: []}]);
                        }}
                    >
                        <CompassIcon
                            name='plus'
                            style={styles.icon}
                        />
                        <Text style={styles.title}>{'Thêm nội dung'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {Boolean(submitError) && (
                <ErrorText
                    textStyle={styles.errorContainer}
                    error={submitError}
                />
            )}
        </View>
    );
}

export default CreateTask;
