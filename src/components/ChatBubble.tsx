import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledText from '@/src/components/StyledText';
import { useThemedStyles } from '@/src/hooks/useTheme';
import { Message } from '@/src/utils/storage';
import { formatMessageTime } from '@/src/utils/helpers';

type ChatBubbleProps = {
    message: Message;
};

export default function ChatBubble({ message }: ChatBubbleProps) {
    const themedStyles = useThemedStyles((colors) => ({
        sentBubble: {
            alignSelf: 'flex-end',
            backgroundColor: colors.onPrimary,
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
            backgroundColor: colors.surface,
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
            color: colors.onBackground,
            fontSize: 16,
            lineHeight: 22,
            flexShrink: 1,
        },
        timestampRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            marginBottom: -4,
            marginRight: -6,
            marginLeft: 4,
        },
        timestampSent: {
            color: colors.onSurfaceVariant,
            fontSize: 10,
        },
        timestampReceived: {
            color: colors.onSurfaceVariant,
            fontSize: 10,
            marginLeft: 'auto',
            textAlign: 'right',
        },
        failedIndicator: {
        },
    }));

    const isMe = message.sender_id === 'me' || message.sender_id === 'self';

    const statusIcon = isMe ? getStatusIcon(message.status, themedStyles) : null;

    return (
        <View style={isMe ? themedStyles.sentBubble : themedStyles.receivedBubble}>
            <StyledText style={isMe ? themedStyles.messageTextSent : themedStyles.messageTextReceived}>
                {message.content}
            </StyledText>
            <View style={themedStyles.timestampRow}>
                <StyledText style={isMe ? themedStyles.timestampSent : themedStyles.timestampReceived}>
                    {formatMessageTime(message.created_at)}
                </StyledText>
                {statusIcon}
            </View>
        </View>
    );
}

function getStatusIcon(
    status: Message['status'],
    styles: { timestampSent: object; failedIndicator: object }
): React.ReactNode {
    switch (status) {
        case 'pending':
            return (
                <Ionicons
                    name="time-outline"
                    size={12}
                    color="rgba(255,255,255,0.6)"
                    style={styles.timestampSent}
                />
            );
        case 'failed':
            return (
                <Ionicons
                    name="alert-circle"
                    size={14}
                    color="#FF4444"
                    style={styles.failedIndicator}
                />
            );
        case 'sent':
            return (
                <Ionicons
                    name="checkmark"
                    size={13}
                    color="rgba(255,255,255,0.6)"
                    style={styles.timestampSent}
                />
            );
        case 'delivered':
            return (
                <Ionicons
                    name="checkmark-done"
                    size={13}
                    color="rgba(255,255,255,0.6)"
                    style={styles.timestampSent}
                />
            );
        default:
            return null;
    }
}
