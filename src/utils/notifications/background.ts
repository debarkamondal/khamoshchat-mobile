import * as TaskManager from 'expo-task-manager';
import { saveToInbox, markInboxProcessed } from '@/src/utils/storage';
import useSession, { Session } from '@/src/store/useSession';
import { processIncomingMessage } from '@/src/utils/messaging';
import { showMessageNotification } from './local';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

/**
 * Registering background tasks must happen synchronously outside a React component.
 * We extract the payload, save it to the inbox so the main sync flow knows about it,
 * we try to decrypt, and if successful, display a local notification with the real content.
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error(`[Background Task] ${BACKGROUND_NOTIFICATION_TASK} error:`, error);
    return;
  }

  if (data) {
    try {
      const pushEvent = data as { notification?: any; data?: any };
      let payloadData = pushEvent.notification?.request?.content?.data || pushEvent.data;

      if (!payloadData) {
        return;
      }

      const { topic, payload, sender } = payloadData;
      
      if (!topic || !payload) {
        if (sender) {
          await showMessageNotification(sender, 'New message', { topic });
        } else {
           await showMessageNotification('Unknown', 'New message');
        }
        return;
      }

      const session = useSession.getState() as Session;

      if (!session || !session.iKey || session.iKey.length === 0) {
         await showMessageNotification(sender || 'Unknown', 'New message', { topic });
        return;
      }

      const inboxId = await saveToInbox(topic, payload);
      
      try {
        const decryptedPlaintext = await processIncomingMessage(session, topic, payload);
        if (inboxId) {
          await markInboxProcessed(inboxId);
        }

        await showMessageNotification(sender || topic, decryptedPlaintext, { topic });
      } catch {
          await showMessageNotification(sender || topic, 'New message received', { topic });
      }

    } catch (err) {
      console.error('[Background Task] Error executing processing:', err);
    }
  }
});
