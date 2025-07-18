// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {type MessageDescriptor, useIntl} from 'react-intl';
import {Keyboard, StyleSheet, View} from 'react-native';

import {useTheme} from '@context/theme';
import useFieldRefs from '@hooks/field_refs';
import {t} from '@i18n';
import {getErrorMessage} from '@utils/errors';
import {logError} from '@utils/log';
import {sortCustomProfileAttributes, formatOptionsForSelector} from '@utils/user';

import DisabledFields from './disabled_fields';
import EmailField from './email_field';
import Field from './field';
import SelectField from './select_field';

import type {CustomProfileFieldModel} from '@database/models/server';
import type UserModel from '@typings/database/models/servers/user';
import type {FieldConfig, FieldSequence, UserInfo} from '@typings/screens/edit_profile';

type Props = {
    canSave: boolean;
    currentUser: UserModel;
    isTablet?: boolean;
    lockedFirstName: boolean;
    lockedLastName: boolean;
    lockedNickname: boolean;
    lockedPosition: boolean;
    onUpdateField: (fieldKey: string, name: string) => void;
    error?: unknown;
    userInfo: UserInfo;
    submitUser: () => void;
    enableCustomAttributes?: boolean;
    customFields?: CustomProfileFieldModel[];
}

const FIELDS: { [id: string]: MessageDescriptor } = {
    firstName: {
        id: t('user.settings.general.firstName'),
        defaultMessage: 'First Name',
    },
    lastName: {
        id: t('user.settings.general.lastName'),
        defaultMessage: 'Last Name',
    },
    username: {
        id: t('user.settings.general.username'),
        defaultMessage: 'Username',
    },
    nickname: {
        id: t('user.settings.general.nickname'),
        defaultMessage: 'Nickname',
    },
    position: {
        id: t('user.settings.general.position'),
        defaultMessage: 'Position',
    },
    email: {
        id: t('user.settings.general.email'),
        defaultMessage: 'Email',
    },
};

const styles = StyleSheet.create({
    footer: {
        height: 40,
        width: '100%',
    },
    separator: {
        height: 15,
    },
});

export const CUSTOM_ATTRS_PREFIX = 'customAttributes';
const FIRST_NAME_FIELD = 'firstName';
const LAST_NAME_FIELD = 'lastName';
const USERNAME_FIELD = 'username';
const EMAIL_FIELD = 'email';
const NICKNAME_FIELD = 'nickname';
const POSITION_FIELD = 'position';

const profileKeys = [LAST_NAME_FIELD, FIRST_NAME_FIELD, USERNAME_FIELD, EMAIL_FIELD, NICKNAME_FIELD, POSITION_FIELD];

const ProfileForm = ({
    canSave, currentUser, isTablet,
    lockedFirstName, lockedLastName, lockedNickname, lockedPosition,
    onUpdateField, userInfo, submitUser, error, enableCustomAttributes, customFields,
}: Props) => {
    const theme = useTheme();
    const intl = useIntl();
    const [getRef, setRef] = useFieldRefs();

    const {formatMessage} = intl;
    const errorMessage = error == null ? undefined : getErrorMessage(error, intl) as string;

    const total_custom_attrs = useMemo(() => (
        enableCustomAttributes ? Object.keys(userInfo.customAttributes).length : 0
    ), [enableCustomAttributes, userInfo.customAttributes]);

    const formKeys = useMemo(() => {
        const newKeys = Object.keys(userInfo.customAttributes).sort(
            (a: string, b: string): number => {
                return sortCustomProfileAttributes(userInfo.customAttributes[a], userInfo.customAttributes[b]);
            }).map((k) => `${CUSTOM_ATTRS_PREFIX}.${k}`);

        return total_custom_attrs === 0 ? profileKeys : [...profileKeys, ...newKeys];
    }, [userInfo.customAttributes, total_custom_attrs]);

    // Create a map of field definitions for quick lookup
    const customFieldsMap = useMemo(() => {
        const map = new Map<string, CustomProfileFieldModel>();
        customFields?.forEach((field) => {
            map.set(field.id, field);
        });
        return map;
    }, [customFields]);

    const userProfileFields: FieldSequence = useMemo(() => {
        const fields: FieldSequence = {};
        formKeys.forEach((element) => {
            switch (element) {
                case FIRST_NAME_FIELD:
                    fields[FIRST_NAME_FIELD] = {
                        isDisabled: true,
                    };
                    break;
                case LAST_NAME_FIELD:
                    fields[LAST_NAME_FIELD] = {
                        isDisabled: true,
                    };
                    break;
                case USERNAME_FIELD:
                    fields[USERNAME_FIELD] = {
                        isDisabled: true,
                        maxLength: 22,
                        error: errorMessage,
                    };
                    break;
                case EMAIL_FIELD:
                    fields[EMAIL_FIELD] = {
                        isDisabled: true,
                    };
                    break;
                case NICKNAME_FIELD:
                    fields[NICKNAME_FIELD] = {
                        isDisabled: true,
                        maxLength: 64,
                    };
                    break;
                case POSITION_FIELD:
                    fields[POSITION_FIELD] = {
                        isDisabled: true,
                        maxLength: 128,
                    };
                    break;
                default:
                    fields[element] = {
                        isDisabled: false,
                        maxLength: 64,
                    };
            }
        });
        return fields;
    }, [lockedFirstName, lockedLastName, lockedNickname, lockedPosition, currentUser.authService, formKeys, errorMessage]);

    const onFocusNextField = useCallback(((fieldKey: string) => {
        const findNextField = () => {
            const fields = Object.keys(userProfileFields);
            const curIndex = fields.indexOf(fieldKey);
            const searchIndex = curIndex + 1;
            if (curIndex === -1 || searchIndex > fields.length) {
                return undefined;
            }

            const remainingFields = fields.slice(searchIndex);

            const nextFieldIndex = remainingFields.findIndex((f: string) => {
                const field = userProfileFields[f];
                return !field.isDisabled;
            });

            if (nextFieldIndex === -1) {
                return {isLastEnabledField: true, nextField: undefined};
            }

            const fieldName = remainingFields[nextFieldIndex];

            return {isLastEnabledField: false, nextField: fieldName};
        };

        const next = findNextField();
        if (next?.isLastEnabledField && canSave) {
            // performs form submission
            Keyboard.dismiss();
            submitUser();
        } else if (next?.nextField) {
            getRef(next?.nextField)?.focus();
        } else {
            Keyboard.dismiss();
        }
    }), [canSave, userProfileFields, submitUser, getRef]);

    const hasDisabledFields = Object.values(userProfileFields).filter((field) => field.isDisabled).length > 0;

    const fieldConfig: FieldConfig = {
        blurOnSubmit: false,
        enablesReturnKeyAutomatically: true,
        onFocusNextField,
        onTextChange: onUpdateField,
        returnKeyType: 'next',
    };

    const getFieldID = (key: string) => key.slice(CUSTOM_ATTRS_PREFIX.length + 1);

    const getValue = (key: string): string => {
        const val = userInfo[key as keyof UserInfo];
        if (typeof val === 'string') {
            return val;
        }
        try {
            const customKey = getFieldID(key);
            return userInfo.customAttributes[customKey].value;
        } catch {
            logError('Attempted to access unknown user property: ', key);
            return '';
        }
    };

    const renderStandardAttribute = (key: string, notLast: boolean) => (
        <Field
            {...fieldConfig}
            fieldKey={key}
            fieldRef={setRef(key)}
            isDisabled={userProfileFields[key].isDisabled}
            label={formatMessage(FIELDS[key])}
            testID={`edit_profile_form.${key}`}
            value={getValue(key)}
            maxLength={userProfileFields[key].maxLength}
            returnKeyType={notLast ? 'next' : 'done'}
            error={userProfileFields[key].error}
        />);

    const renderEmailAttribute = () => (userInfo.email &&
        <EmailField
            authService={currentUser.authService}
            isDisabled={userProfileFields.email.isDisabled}
            email={userInfo.email}
            label={formatMessage(FIELDS.email)}
            fieldRef={setRef(EMAIL_FIELD)}
            onChange={onUpdateField}
            onFocusNextField={onFocusNextField}
            theme={theme}
            isTablet={Boolean(isTablet)}
        />);

    const renderCustomAttribute = (key: string, notLast: boolean) => {
        const fieldID = getFieldID(key);
        const customAttribute = userInfo.customAttributes[fieldID];
        const fieldDefinition = customFieldsMap.get(fieldID);

        // Check if this is a select or multiselect field
        if (fieldDefinition && (fieldDefinition.type === 'select' || fieldDefinition.type === 'multiselect')) {
            const options = formatOptionsForSelector(fieldDefinition);

            return (
                <SelectField
                    fieldKey={key}
                    label={customAttribute.name}
                    value={getValue(key)}
                    options={options}
                    isDisabled={userProfileFields[key].isDisabled}
                    onValueChange={onUpdateField}
                    onFocusNextField={onFocusNextField}
                    testID={`edit_profile_form.${key}`}
                    isMultiselect={fieldDefinition.type === 'multiselect'}
                />
            );
        }

        // Default to text field for other types
        return (
            <Field
                fieldKey={key}
                isDisabled={userProfileFields[key].isDisabled}
                fieldRef={setRef(key)}
                label={customAttribute.name}
                maxLength={128}
                testID={`edit_profile_form.${key}`}
                {...fieldConfig}
                returnKeyType={notLast ? 'next' : 'done'}
                value={getValue(key)}
            />);
    };

    const renderAttribute = (key: string, notLast: boolean) => {
        if (key.startsWith(CUSTOM_ATTRS_PREFIX)) {
            return renderCustomAttribute(key, notLast);
        }
        if (key === EMAIL_FIELD) {
            return renderEmailAttribute();
        }
        return renderStandardAttribute(key, notLast);
    };

    const renderAllAttributes = formKeys.map((key, index) => {
        const notLast = index < (formKeys.length - 1);
        return (
            <View key={key}>
                {renderAttribute(key, notLast)}
                {notLast && <View style={styles.separator}/>}
            </View>);
    });

    return (
        <>
            {false && hasDisabledFields && <DisabledFields isTablet={isTablet}/>}
            {renderAllAttributes}
            <View style={styles.footer}/>
        </>
    );
};

export default ProfileForm;
