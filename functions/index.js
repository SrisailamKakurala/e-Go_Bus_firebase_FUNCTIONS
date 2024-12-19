const functions = require("firebase-functions");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
require("dotenv").config();


// Nodemailer transport configuration (update with your SMTP credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Function to send a push notification
async function sendPushNotification(token, title, body) {
  const message = {
    to: token,
    sound: "default",
    title,
    body,
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.errors?.[0]?.message || "Failed to send notification via Expo.");
  }
  return result;
}

// Function to send an email
async function sendEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: "egobusgsc@gmail.com",
    to,
    subject,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// Endpoint 1: Send notification to one person
exports.sendNotificationToOne = functions.https.onRequest(async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({
      success: false,
      message: "Missing token, title, or body for notification.",
    });
  }

  try {
    const result = await sendPushNotification(token, title, body);
    res.status(200).json({
      success: true,
      message: "Notification sent successfully!",
      result,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending notification.",
      error: error.message,
    });
  }
});

// Endpoint 2: Send notification to multiple persons
exports.sendNotificationToMany = functions.https.onRequest(async (req, res) => {
  const { tokens, title, body } = req.body;

  if (!tokens || !title || !body || !Array.isArray(tokens)) {
    return res.status(400).json({
      success: false,
      message: "Missing tokens (array), title, or body for notification.",
    });
  }

  try {
    const results = await Promise.all(tokens.map((token) => sendPushNotification(token, title, body)));
    res.status(200).json({
      success: true,
      message: "Notifications sent successfully!",
      results,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending notifications.",
      error: error.message,
    });
  }
});

// Endpoint 3: Send an email
exports.sendEmail = functions.https.onRequest(async (req, res) => {
  const { email, subject, htmlContent } = req.body;

  if (!email || !subject || !htmlContent) {
    return res.status(400).json({
      success: false,
      message: "Missing email, subject, or content for email.",
    });
  }

  try {
    const result = await sendEmail(email, subject, htmlContent);
    res.status(200).json({
      success: true,
      message: "Email sent successfully!",
      result,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending email.",
      error: error.message,
    });
  }
});
