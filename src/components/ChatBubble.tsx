import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/src/components/StyledText';
import { useThemedStyles } from '@/src/hooks/useTheme';
import { Message } from '@/src/utils/storage';
import { formatMessageTime } from '@/src/utils/helpers';

type ChatBubbleProps = {
    message: Message;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const themedStyles = useThemedStyles((colors) => ({
        sentBubble: {
            alignSelf: 'flex-end',
            backgroundColor: colors.systemAccent,
            borderRadius: 20,
            borderCurve: 'continuous',
            borderBottomRightRadius: 4,
            padding: 10,
            paddingHorizontal: 12,
            marginVertical: 4,
            maxWidth: '80%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            gap: 6,
        },
        receivedBubble: {
            alignSelf: 'flex-start',
            position: 'relative',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 20,
            borderCurve: 'continuous',
            borderBottomLeftRadius: 4,
            padding: 10,
            paddingHorizontal: 12,
            marginVertical: 4,
            maxWidth: '80%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 6,
        },
        messageTextSent: {
            color: 'white',
            fontSize: 16,
            lineHeight: 22,
            flexShrink: 1,
        },
        messageTextReceived: {
            color: colors.textPrimary,
            fontSize: 16,
            lineHeight: 22,
            flexShrink: 1,
        },
        timestampSent: {
            color: colors.textSecondary,
            fontSize: 10,
            marginBottom: 2, // Align with baseline of text roughly
        },
        timestampReceived: {
            color: colors.textSecondary,
            fontSize: 10,
            marginBottom: 2,
            marginLeft: 'auto', // Push to right if wrapped, but don't force growth
            textAlign: 'right',
        }
    }));

    const isMe = message.sender_id === 'me' || message.sender_id === 'self'; // Handling 'me' or potential future uses

    return (
        <View style={isMe ? themedStyles.sentBubble : themedStyles.receivedBubble}>
            <StyledText style={isMe ? themedStyles.messageTextSent : themedStyles.messageTextReceived}>
                {message.content}
            </StyledText>
            <StyledText style={isMe ? themedStyles.timestampSent : themedStyles.timestampReceived}>
                {formatMessageTime(message.created_at)}
            </StyledText>
        </View>
    );
};

export default ChatBubble;
