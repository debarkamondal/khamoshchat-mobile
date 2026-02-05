import { v4 as uuidv4 } from 'uuid';

export type ChatMessage = {
    id: string; // uuid
    text: string;
    sender: 'me' | 'them';
    timestamp: number;
};

// In-memory storage: phoneNumber -> Message[]
// Phone number key should probably be formatted (e.g. "+919876543210")
export const messages: Record<string, ChatMessage[]> = {};

// Simple subscription pattern
const listeners = new Set<() => void>();

export const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
};

const notifyListeners = () => {
    listeners.forEach(l => l());
};

export const addMessage = (phone: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!messages[phone]) {
        messages[phone] = [];
    }

    const newMessage: ChatMessage = {
        id: uuidv4(),
        timestamp: Date.now(),
        ...msg
    };

    messages[phone].push(newMessage);
    notifyListeners();
};

export const getMessages = (phone: string) => {
    return messages[phone] || [];
};
