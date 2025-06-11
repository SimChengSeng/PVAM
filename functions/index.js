const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();
/**
 * @gcfv1
 */
exports.notifyByPlate = functions.https.onRequest(async (req, res) => {
  const { plateNumber, message = "Someone is contacting you." } = req.body;

  if (!plateNumber) {
    return res.status(400).json({ error: "plateNumber is required" });
  }

  try {
    const querySnapshot = await db
      .collection("vehicles")
      .where("plateNumber", "==", plateNumber.toUpperCase())
      .where("isContactable", "==", true)
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: "No contactable vehicle found." });
    }

    const results = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (!data.pushToken) continue;

      const pushResponse = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        {
          to: data.pushToken,
          title: "Vehicle Alert",
          body: `${message} (Plate: ${plateNumber})`,
          data: {
            screen: "NotificationInbox",
            plate: plateNumber,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      results.push({ vehicleId: doc.id, pushResponse: pushResponse.data });
    }

    return res.status(200).json({ success: true, notified: results });
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
