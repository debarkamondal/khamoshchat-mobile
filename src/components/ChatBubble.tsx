import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/src/components/StyledText';
import { useThemedStyles } from '@/src/hooks/useTheme';
import { Message } from '@/src/utils/db';
import { formatMessageTime } from '@/src/utils/chat';

type ChatBubbleProps = {
    message: Message;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const themedStyles = useThemedStyles((colors) => ({
        sentBubble: {
            alignSelf: 'flex-end',
            backgroundColor: colors.accentPrimary,
            borderRadius: 16,
            borderBottomRightRadius: 4,
            padding: 12,
            marginVertical: 4,
            maxWidth: '80%',
        },
        receivedBubble: {
            alignSelf: 'flex-start',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            padding: 12,
            marginVertical: 4,
            maxWidth: '80%',
        },
        messageTextSent: {
            color: 'white',
            fontSize: 16,
        },
        messageTextReceived: {
            color: colors.textPrimary,
            fontSize: 16,
        },
        timestampSent: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 10,
            alignSelf: 'flex-end',
            marginTop: 4,
        },
        timestampReceived: {
            color: colors.textSecondary,
            fontSize: 10,
            alignSelf: 'flex-end',
            marginTop: 4,
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
