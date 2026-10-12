import { Linking } from "react-native";

/**
 * Tell a winner by email that their prize has been released — no backend needed.
 *
 * Option A (automatic, recommended): EmailJS (free tier ~200 emails/month).
 *   1. Create an account at emailjs.com, connect your Gmail/Outlook as an "Email Service".
 *   2. Create an "Email Template" that uses these variables:
 *        {{to_email}}  {{to_name}}  {{prize_name}}  {{prize_value}}  {{prize_type}}  {{message}}
 *      (set the template's "To Email" field to {{to_email}}).
 *   3. Add these three env vars in Vercel (Project → Settings → Environment Variables) and redeploy:
 *        EXPO_PUBLIC_EMAILJS_SERVICE_ID, EXPO_PUBLIC_EMAILJS_TEMPLATE_ID, EXPO_PUBLIC_EMAILJS_PUBLIC_KEY
 *   Then "Mark settled" sends the email by itself.
 *
 * Option B (fallback, zero setup): if EmailJS isn't set up, your email app opens with the
 * message already written — you just press Send.
 */

const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

export type WinnerEmailInfo = {
  email: string;
  name?: string | null;
  prizeName?: string | null;
  prizeType?: string | null;
  prizeValue?: string | number | null;
};

export function isAutoEmailConfigured() {
  return !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

function buildMessage(info: WinnerEmailInfo) {
  const name = (info.name || "Egg Hunter").split(" ")[0];
  const value = info.prizeValue && Number(info.prizeValue) > 0 ? `₦${Number(info.prizeValue).toLocaleString()} ` : "";
  const type = String(info.prizeType || "prize").toLowerCase();
  const prize = info.prizeName || `${value}${type}`;
  const how =
    type === "airtime"
      ? "It has been sent to the phone number on your Tap2Crack account."
      : type === "cash"
        ? "The payment has been sent using the details on your account."
        : "You can find it in My Prizes on tap2crackgame.com.";
  const subject = "🎉 Your Tap2Crack prize has been released!";
  const body = `Hi ${name},

Great news — your Tap2Crack prize has been released! 🥚🎉

Prize: ${prize}${value && !String(prize).includes("₦") ? ` (${value.trim()})` : ""}
${how}

Thanks for cracking with us. Clucky says: bok bok, see you in the next round! 🐔

— Team Tap2Crack
tap2crackgame.com`;
  return { subject, body, prize, name };
}

/** Returns "sent" (EmailJS), "opened" (email app opened) or "failed". */
export async function notifyWinnerEmail(info: WinnerEmailInfo): Promise<"sent" | "opened" | "failed"> {
  if (!info.email) return "failed";
  const { subject, body, prize, name } = buildMessage(info);

  if (isAutoEmailConfigured()) {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: {
            to_email: info.email,
            to_name: name,
            prize_name: prize,
            prize_value: info.prizeValue ?? "",
            prize_type: info.prizeType ?? "",
            subject,
            message: body,
          },
        }),
      });
      if (res.ok) return "sent";
      console.warn("EmailJS failed:", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.warn("EmailJS error:", e);
    }
  }

  try {
    const url = `mailto:${encodeURIComponent(info.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await Linking.openURL(url);
    return "opened";
  } catch {
    return "failed";
  }
}
