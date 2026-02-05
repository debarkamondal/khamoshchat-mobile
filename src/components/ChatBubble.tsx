import React from 'react';
import { View } from 'react-native';
import StyledText from '@/src/components/StyledText';
import { useThemedStyles } from '@/src/hooks/useTheme';
import { ChatMessage } from '@/src/utils/chat';

type ChatBubbleProps = {
    message: ChatMessage;
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
        }
    }));

    const isMe = message.sender === 'me';

    return (
        <View style={isMe ? themedStyles.sentBubble : themedStyles.receivedBubble}>
            <StyledText style={isMe ? themedStyles.messageTextSent : themedStyles.messageTextReceived}>
                {message.text}
            </StyledText>
        </View>
    );
};

export default ChatBubble;
