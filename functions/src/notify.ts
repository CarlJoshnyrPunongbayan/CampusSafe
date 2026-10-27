import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";

// FCM topics. The mobile app subscribes students to ALL_USERS and responders to RESPONDERS;
// security office devices subscribe to SECURITY_OFFICE.
export const TOPICS = {
  ALL_USERS: "all-users",
  RESPONDERS: "responders",
  SECURITY_OFFICE: "security-office",
} as const;

export interface Notice {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// There is no FCM emulator, so messages are only logged when running locally.
const emulated = process.env.FUNCTIONS_EMULATOR === "true";

function message(notice: Notice) {
  return {
    notification: { title: notice.title, body: notice.body },
    data: notice.data ?? {},
    android: { priority: "high" as const },
  };
}

export async function notifyTopic(topic: string, notice: Notice): Promise<void> {
  if (emulated) {
    logger.info(`[FCM skipped in emulator] topic=${topic}`, notice);
    return;
  }
  try {
    await getMessaging().send({ topic, ...message(notice) });
  } catch (err) {
    logger.error(`FCM send to topic ${topic} failed`, err);
  }
}

export async function notifyUser(uid: string | null | undefined, notice: Notice): Promise<void> {
  if (!uid) return;
  const token = (await getFirestore().doc(`users/${uid}`).get()).get("fcmToken") as string | undefined;
  if (!token) return;
  if (emulated) {
    logger.info(`[FCM skipped in emulator] user=${uid}`, notice);
    return;
  }
  try {
    await getMessaging().send({ token, ...message(notice) });
  } catch (err) {
    logger.error(`FCM send to user ${uid} failed`, err);
  }
}
