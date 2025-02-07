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
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Acknowledgements from './acknowledgements';
import AddMembers from './add_members';
import Content from './content';
import Failed from './failed';
import Issue from './issue';
import IssueUpdated from './issue_updated';
import Message from './message';
import Plan from './plan';
import Reactions from './reactions';
import Task from './task';

import type PostModel from '@typings/database/models/servers/post';
import type {SearchPattern} from '@typings/global/markdown';

type BodyProps = {
    appsEnabled: boolean;
    fromMe: boolean;
    hasFiles: boolean;
    hasReactions: boolean;
    highlight: boolean;
    highlightReplyBar: boolean;
    isArticle?: boolean;
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
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            marginLeft: 8,
            marginTop: -4,
        },
        me: {
            alignSelf: 'flex-end',
            backgroundColor: changeOpacity('#009AF9', 0.16),
        },
        messageBody: {
            paddingVertical: 2,
            flex: 1,
        },
        messageContainer: {
            alignSelf: 'flex-start',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderRadius: 12,
            flexDirection: 'row',
            maxWidth: '100%',
            padding: 14,
        },
        reply: {
            borderColor: changeOpacity(theme.linkColor, 0.6),
            borderWidth: 1,
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
        reverse: {flexDirection: 'row-reverse'},
    };
});

const Body = ({
    appsEnabled, fromMe, hasFiles, hasReactions, highlight, highlightReplyBar,
    isArticle, isCRTEnabled, isEphemeral, isFirstReply, isJumboEmoji, isLastReply, isPendingOrFailed, isPostAcknowledgementEnabled, isPostAddChannelMember,
    location, post, searchPatterns, showAddReaction, theme,
}: BodyProps) => {
    const style = getStyleSheet(theme);
    const isEdited = postEdited(post);
    const isFailed = isPostFailed(post);
    const reverse = !isArticle && fromMe;
    const [layoutWidth, setLayoutWidth] = useState(0);
    const hasBeenDeleted = Boolean(post.deleteAt);
    let body;
    let message;

    const isReplyPost = Boolean(post.rootId && (!isEphemeral || !hasBeenDeleted) && location !== THREAD);
    const hasContent = Boolean((post.metadata?.embeds?.length || (appsEnabled && post.props?.app_bindings?.length)) || post.props?.attachments?.length);

    const replyBarStyle = useCallback((): StyleProp<ViewStyle>|undefined => {
        if (!isReplyPost || (isCRTEnabled && location === Screens.PERMALINK)) {
            return undefined;
        }

        const barStyle: StyleProp<ViewStyle> = [style.replyBar];

        if (isFirstReply) {
            barStyle.push(style.replyBarFirst);
        }

        if (isLastReply) {
            barStyle.push(style.replyBarLast);
        }

        if (highlightReplyBar) {
            barStyle.push(style.replyMention);
        }

        return undefined;
    }, []);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        if (isArticle || location === Screens.SAVED_MESSAGES) {
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
        message = (
            <Issue
                location={location}
                post={post}
                theme={theme}
            />
        );
    } else if (post.type === 'custom_issue_updated') {
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
    } else if (post.type === 'custom_plan') {
        message = (
            <Plan
                location={location}
                post={post}
                theme={theme}
            />
        );
    } else if (post.type === 'custom_task') {
        message = (
            <Task
                location={location}
                post={post}
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
            <View style={fromMe && {alignSelf: 'flex-end'}}>
                <JumboEmoji
                    baseTextStyle={style.message}
                    isEdited={isEdited}
                    value={post.message}
                />
            </View>
        );
    } else if (post.message.length) {
        message = (
            <View style={isArticle ? {paddingVertical: 4} : [style.messageContainer, fromMe && style.me, isReplyPost && style.reply]}>
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
            </View>
        );
    }

    const acknowledgementsVisible = isPostAcknowledgementEnabled && post.metadata?.priority?.requested_ack;
    const reactionsVisible = hasReactions && showAddReaction;
    if (!hasBeenDeleted) {
        body = (
            <View style={style.messageBody}>
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
                {hasFiles &&
                <Files
                    failed={isFailed}
                    layoutWidth={layoutWidth}
                    location={location}
                    post={post}
                    isReplyPost={isReplyPost}
                    reverse={reverse}
                />
                }
                {(acknowledgementsVisible || reactionsVisible) && (
                    <View style={[style.ackAndReactionsContainer, reverse && style.reverse]}>
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
            style={[style.messageContainerWithReplyBar, reverse && style.reverse]}
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
