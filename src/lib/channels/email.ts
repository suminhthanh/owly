import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";

interface EmailConfig {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

let imapConnection: Imap | null = null;
let isListening = false;

async function getEmailConfig(): Promise<EmailConfig | null> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.imapHost || !settings?.smtpHost) return null;

  return {
    imapHost: settings.imapHost,
    imapPort: settings.imapPort,
    imapUser: settings.imapUser,
    imapPass: settings.imapPass,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom || settings.smtpUser,
  };
}

function createImapConnection(config: EmailConfig): Imap {
  return new Imap({
    user: config.imapUser,
    password: config.imapPass,
    host: config.imapHost,
    port: config.imapPort,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });
}

function getSmtpTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

async function processEmail(parsed: ParsedMail, config: EmailConfig) {
  const fromAddress = parsed.from?.value?.[0]?.address;
  const fromName =
    parsed.from?.value?.[0]?.name || fromAddress || "Unknown";
  const subject = parsed.subject || "No Subject";
  const textBody = parsed.text || "";

  if (!fromAddress) return;

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel: "email",
      customerContact: fromAddress,
      status: { in: ["active", "escalated"] },
    },
  });

  if (!conversation) {
    conversation = await createNewConversation(
      "email",
      fromName,
      fromAddress
    );
  }

  // Get AI response
  const messageContent = `Subject: ${subject}\n\n${textBody}`;
  const aiResponse = await chat(conversation.id, messageContent);

  // Send reply
  const transporter = getSmtpTransporter(config);
  await transporter.sendMail({
    from: config.smtpFrom,
    to: fromAddress,
    subject: `Re: ${subject}`,
    text: aiResponse,
    html: buildEmailHtml(aiResponse),
    inReplyTo: parsed.messageId,
    references: parsed.messageId,
  });
}

function buildEmailHtml(text: string): string {
  const settings_name = "Owly Support";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 20px;">
        ${text
          .split("\n")
          .map((line) => `<p style="margin: 0 0 10px 0; color: #1E293B;">${line}</p>`)
          .join("")}
      </div>
      <div style="border-top: 1px solid #E2E8F0; padding: 15px 20px; color: #64748B; font-size: 12px;">
        Powered by ${settings_name}
      </div>
    </div>
  `;
}

export async function startEmailListener() {
  if (isListening) return;

  const config = await getEmailConfig();
  if (!config) {
    console.log("[Email] Not configured, skipping listener start");
    return;
  }

  const imap = createImapConnection(config);

  imap.once("ready", () => {
    console.log("[Email] IMAP connected");
    isListening = true;

    imap.openBox("INBOX", false, (err) => {
      if (err) {
        console.error("[Email] Error opening inbox:", err);
        return;
      }

      imap.on("mail", () => {
        imap.search(["UNSEEN"], (err, results) => {
          if (err || !results.length) return;

          const fetch = imap.fetch(results, { bodies: "" });
          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              simpleParser(stream as any, (err: Error | null, parsed: ParsedMail) => {
                if (err) {
                  console.error("[Email] Parse error:", err);
                  return;
                }
                processEmail(parsed, config);
              });
            });
          });
        });
      });
    });
  });

  imap.once("error", (err: Error) => {
    console.error("[Email] IMAP error:", err);
    isListening = false;
  });

  imap.once("end", () => {
    console.log("[Email] IMAP disconnected");
    isListening = false;
  });

  imapConnection = imap;
  imap.connect();
}

export async function stopEmailListener() {
  if (imapConnection) {
    imapConnection.end();
    imapConnection = null;
    isListening = false;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  const config = await getEmailConfig();
  if (!config) return false;

  const transporter = getSmtpTransporter(config);
  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text: body,
    html: buildEmailHtml(body),
  });

  return true;
}

export function getEmailStatus() {
  return {
    connected: isListening,
    status: isListening ? "connected" : "disconnected",
  };
}
