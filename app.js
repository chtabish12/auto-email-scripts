const fs = require("fs");
const puppeteer = require("puppeteer");
const navigationTimeout = 60000;

async function sendEmail(
  username,
  password,
  fromName,
  recipient,
  subject,
  message
) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    timeout: 60000,
    args: ["--start-maximized"],
    slowMo: 50,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    waitUntil: "networkidle0",
    protocolTimeout: 0,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36"
  );

  try {
    console.log("Navigating to the email portal...");
    await page.goto("https://messagerie.ac-aix-marseille.fr/plog/public/login");

    console.log("Entering username and password...");
    await page.type("#form_identifiant", username);
    await page.type("#form_motdepasse", password);

    console.log("Submitting the login form...");
    await Promise.all([
      page.click("#form_Valider"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    console.log("Composing a new email...");
    await page.goto(
      "https://messagerie.ac-aix-marseille.fr/roundcube/?_task=mail&_action=compose&_id=",
      { waitUntil: "networkidle0" }
    );

    console.log("Entering recipient, subject, and message...");
    await page.select("#_from", fromName);
    await page.$eval(
      'li.input input[type="text"]',
      (element, recipient) => {
        element.value = recipient;
      },
      recipient
    );
    await page.type("#compose-subject", subject);
    await page.frames().forEach(async (frame) => {
      if (frame.name() === "messagecompose") {
        const elementHandle = await frame.$("#tinymce");
        if (elementHandle) {
          await frame.evaluate(
            (element, message) => {
              element.innerHTML = message;
            },
            elementHandle,
            message
          );
        }
      }
    });

    console.log("Finding and clicking the send button...");
    await page.evaluate(() => {
      const sendButton = document.getElementById("rcmbtn110");
      if (sendButton) {
        return rcmail.command("send", "", this, event);
      } else {
        console.log("Error: Send button not found.");
      }
    });

    console.log("Waiting for the email to be sent...");
    await page.waitForTimeout(60000); // Delay before closing the browser

    console.log(`Email sent successfully to ${recipient}`);
  } catch (error) {
    console.error(`Failed to send email to ${recipient}:`, error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
  }
}

// Read email leads from leads.txt
const leads = fs.readFileSync("leads.txt", "utf8").split("\n").filter(Boolean);

// Read configuration from config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

// Read email body from letter.txt
const message = fs.readFileSync("letter.txt", "utf8");

// Send emails to each lead
async function sendEmails() {
  for (const lead of leads) {
    const { username, password, fromName, subject, delay } = config;

    // const message = `Dear ${lead},\n\nThis is a test email.`;
    try {
      await sendEmail(username, password, fromName, lead, subject, message);
      console.log(`Email sent successfully to ${lead}`);
    } catch (error) {
      console.error(`Failed to send email to ${lead}:`, error);
    }

    // Delay before sending the next email
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

sendEmails();
