import axios from "axios";

/**
 * Sends a push notification to an Expo device token.
 *
 * @param {Object} options
 * @param {string} options.token - Expo push token of the recipient.
 * @param {string} options.title - Notification title.
 * @param {string} options.body - Notification message.
 * @param {Object} [options.data] - Optional data to send with the notification.
 * @returns {Promise<Object>} Response from Expo Push service.
 */
export const sendPushToUser = async ({ token, title, body, data = {} }) => {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid Expo push token.");
  }

  if (!token.startsWith("ExponentPushToken")) {
    throw new Error("Invalid Expo push token format.");
  }

  try {
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: token,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return {
      success: true,
      status: response.status,
      response: response.data,
    };
  } catch (error) {
    console.error(
      "[PushService] Failed to send push notification:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
