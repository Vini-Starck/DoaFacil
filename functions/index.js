const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// HTTP function example
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Scheduled function: reverts expired donations every 5 minutes
exports.revertExpiredDonations = onSchedule(
    {schedule: "every 5 minutes", timeZone: "America/Sao_Paulo"},
    async () => {
      logger.info("Starting expired donations check...");
      try {
        const now = admin.firestore.Timestamp.now();
        // Fetch all donations in progress
        const statusSnap = await db
            .collection("donationItems")
            .where("status", "==", "em andamento")
            .get();
        // Filter locally for expired items
        const expiredDocs = statusSnap.docs.filter((docSnap) => {
          const exp = docSnap.data().expirationAt;
          return exp && exp.toMillis() < now.toMillis();
        });
        if (expiredDocs.length === 0) {
          logger.info("No expired donations found.");
          return;
        }
        // Batch update expired donations
        const batch = db.batch();
        expiredDocs.forEach((docSnap) => {
          batch.update(docSnap.ref, {
            status: "disponível",
            beneficiary: admin.firestore.FieldValue.delete(),
            acceptedAt: admin.firestore.FieldValue.delete(),
            expirationAt: admin.firestore.FieldValue.delete(),
          });
        });
        await batch.commit();
        // Close related chats for expired donations
        const donationIds = expiredDocs.map((docSnap) => docSnap.id);
        if (donationIds.length > 0) {
          const chatsSnap = await db
              .collection("chats")
              .where("donationId", "in", donationIds)
              .get();
          const chatBatch = db.batch();
          chatsSnap.forEach((chatSnap) => {
            chatBatch.update(chatSnap.ref, {closed: "true"});
          });
          await chatBatch.commit();
          logger.info(`Closed ${chatsSnap.size} related chats.`);
        }
        logger.info(`Reverted ${expiredDocs.length} expired donations.`);
      } catch (error) {
        logger.error("Error reverting expired donations:", error);
      }
    },
);
