// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {type LayoutChangeEvent, type StyleProp, View, type ViewStyle} from 'react-native';

import Files from '@components/files';
import FormattedText from '@components/formatted_text';
import JumboEmoji from '@components/jumbo_emoji';
import {Screens} from '@constants';
import {THREAD} from '@constants/screens';
import {isEdited as postEdited, isPostFailed} from '@utils/post';
import {makeStyleSheetFromTheme} from '@utils/theme';

import Acknowledgements from './acknowledgements';
import AddMembers from './add_members';
import Content from './content';
import Failed from './failed';
import Issue from './issue';
import IssueUpdated from './issue_updated';
import Message from './message';
import Reactions from './reactions';

import type PostModel from '@typings/database/models/servers/post';
import type {SearchPattern} from '@typings/global/markdown';

type BodyProps = {
    appsEnabled: boolean;
    fromMe: boolean;
    hasFiles: boolean;
    hasReactions: boolean;
    highlight: boolean;
    highlightReplyBar: boolean;
    isCRTEnabled?: boolean;
    isEphemeral: boolean;
    isFirstReply?: boolean;
    isJumboEmoji: boolean;
    isLastReply?: boolean;
    isPendingOrFailed: boolean;
    isPostAcknowledgementEnabled?: boolean;
    isPostAddChannelMember: boolean;
    location: string;
    post: PostModel;
    searchPatterns?: SearchPattern[];
    showAddReaction?: boolean;
    theme: Theme;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        ackAndReactionsContainer: {
            position: 'absolute',
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignContent: 'flex-start',
            bottom: 0,
            left: 12,
        },
        messageBody: {
            paddingVertical: 2,
        },
        replyBar: {
            backgroundColor: theme.centerChannelColor,
            opacity: 0.1,
            marginLeft: 1,
            marginRight: 7,
            width: 3,
            flexBasis: 3,
        },
        replyBarFirst: {paddingTop: 10},
        replyBarLast: {paddingBottom: 10},
        replyMention: {
            backgroundColor: theme.mentionHighlightBg,
            opacity: 1,
        },
        message: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
        },
        messageContainerWithReplyBar: {
            flexDirection: 'row',
            width: '100%',
        },
    };
});

const Body = ({
    appsEnabled, fromMe, hasFiles, hasReactions, highlight, highlightReplyBar,
    isCRTEnabled, isEphemeral, isFirstReply, isJumboEmoji, isLastReply, isPendingOrFailed, isPostAcknowledgementEnabled, isPostAddChannelMember,
    location, post, searchPatterns, showAddReaction, theme,
}: BodyProps) => {
    const style = getStyleSheet(theme);
    const isEdited = postEdited(post);
    const isFailed = isPostFailed(post);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const hasBeenDeleted = Boolean(post.deleteAt);
    let body;
    let message;

    const bodyStyle: StyleProp<ViewStyle> = {};
    const isReplyPost = Boolean(post.rootId && (!isEphemeral || !hasBeenDeleted) && location !== THREAD);
    const hasContent = (post.metadata?.embeds?.length || (appsEnabled && post.props?.app_bindings?.length)) || post.props?.attachments?.length;

    const replyBarStyle = useCallback((): StyleProp<ViewStyle>|undefined => {
        if (!isReplyPost || (isCRTEnabled && location === Screens.PERMALINK)) {
            return undefined;
        }

        const barStyle: StyleProp<ViewStyle> = [style.replyBar];

        if (fromMe) {
            barStyle.push({marginLeft: 7, marginRight: 1});
        }

        if (isFirstReply) {
            barStyle.push(style.replyBarFirst);
        }

        if (isLastReply) {
            barStyle.push(style.replyBarLast);
        }

        if (highlightReplyBar) {
            barStyle.push(style.replyMention);
        }

        return barStyle;
    }, [fromMe]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        if (location === Screens.SAVED_MESSAGES) {
            setLayoutWidth(e.nativeEvent.layout.width);
        }
    }, [location]);

    if (hasBeenDeleted) {
        body = (
            <FormattedText
                style={style.message}
                id='post_body.deleted'
                defaultMessage='(message deleted)'
            />
        );
    } else if (post.type === 'custom_issue') {
        bodyStyle.flex = 1;
        message = (
            <Issue
                location={location}
                post={post}
                theme={theme}
            />
        );
    } else if (post.type === 'custom_issue_updated') {
        bodyStyle.flex = 1;
        message = (
            <IssueUpdated
                highlight={highlight}
                isEdited={isEdited}
                isPendingOrFailed={isPendingOrFailed}
                isReplyPost={isReplyPost}
                layoutWidth={layoutWidth}
                location={location}
                post={post}
                searchPatterns={searchPatterns}
                theme={theme}
            />
        );
    } else if (isPostAddChannelMember) {
        message = (
            <AddMembers
                location={location}
                post={post}
                theme={theme}
            />
        );
    } else if (isJumboEmoji) {
        message = (
            <JumboEmoji
                baseTextStyle={style.message}
                isEdited={isEdited}
                value={post.message}
            />
        );
    } else if (post.message.length) {
        message = (
            <Message
                highlight={highlight}
                isEdited={isEdited}
                isPendingOrFailed={isPendingOrFailed}
                isReplyPost={isReplyPost}
                layoutWidth={layoutWidth}
                location={location}
                post={post}
                searchPatterns={searchPatterns}
                theme={theme}
            />
        );
    }

    const acknowledgementsVisible = isPostAcknowledgementEnabled && post.metadata?.priority?.requested_ack;
    const reactionsVisible = hasReactions && showAddReaction;
    if (acknowledgementsVisible || reactionsVisible) {
        bodyStyle.paddingBottom = 30;
    }
    if (!hasBeenDeleted) {
        body = (
            <View style={[style.messageBody, bodyStyle]}>
                {message}
                {hasContent &&
                <Content
                    isReplyPost={isReplyPost}
                    layoutWidth={layoutWidth}
                    location={location}
                    post={post}
                    theme={theme}
                />
                }
                {hasFiles && location !== 'IssueList' &&
                <Files
                    failed={isFailed}
                    layoutWidth={layoutWidth}
                    location={location}
                    post={post}
                    isReplyPost={isReplyPost}
                />
                }
                {(acknowledgementsVisible || reactionsVisible) && (
                    <View style={[style.ackAndReactionsContainer, fromMe && {left: undefined, right: 0, flexDirection: 'row-reverse'}]}>
                        {acknowledgementsVisible && (
                            <Acknowledgements
                                hasReactions={hasReactions}
                                location={location}
                                post={post}
                                theme={theme}
                            />
                        )}
                        {reactionsVisible && (
                            <Reactions
                                location={location}
                                post={post}
                                theme={theme}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View
            style={[style.messageContainerWithReplyBar, fromMe && {flexDirection: 'row-reverse'}]}
            onLayout={onLayout}
        >
            <View style={replyBarStyle()}/>
            {body}
            {isFailed &&
            <Failed
                post={post}
                theme={theme}
            />
            }
        </View>
    );
};

export default Body;
