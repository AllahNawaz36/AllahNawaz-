# WhatsApp setup — free-first, approval before sending

## Current implementation

The GitHub Pages dashboard uses WhatsApp Click to Chat (`https://wa.me/`). This works from Android without a backend, access token, paid hosting, or a bank card.

The Communication Hub now has a two-step approval flow:
1. Enter the recipient's phone number in international format and write the message.
2. Save the draft if you want to keep it on this device.
3. Tap **WhatsApp**. The dashboard shows a preview and asks you to review it.
4. Tick the approval checkbox and tap **Approve & open WhatsApp**.
5. WhatsApp opens with a pre-filled draft. Check the chat and tap **Send** in WhatsApp yourself.

**Important:** approving in the dashboard only authorizes opening the WhatsApp draft. It does not send the message. Sending happens only after the user taps Send in WhatsApp.

## Phone number format

Enter the country code and number using digits, without a leading local zero. Example format for Pakistan: `923001234567` (for a local number written as `0300 1234567`, use `923001234567`). If no number is entered, WhatsApp opens a share/chat chooser so you can select a recipient.

Use this only for people you are allowed to contact. Avoid unsolicited bulk messaging.

## Android test

1. Open the live dashboard: https://allahnawaz36.github.io/AllahNawaz-/
2. Open **Communication Hub**.
3. Enter your own number in international format for a safe test and type a short test message.
4. Tap **WhatsApp**; confirm the approval preview appears and WhatsApp does not open yet.
5. Tick the checkbox and tap **Approve & open WhatsApp**.
6. Verify WhatsApp shows the intended recipient and draft. Send only if you intend to.

If WhatsApp does not open, allow the browser to open external apps/pop-ups or copy the message and open WhatsApp manually.

## What is not connected

- No WhatsApp Cloud API is configured in this repository.
- No WhatsApp access token, phone-number ID, WhatsApp Business Account, webhook, or delivery-status tracking is configured.
- Cloudflare Worker deployment is not yet verified. Do not add tokens to `index.html`, GitHub files, or screenshots.
- The free Click-to-Chat path requires a human to press Send. It cannot send in the background or send messages on a schedule.

## Optional API later

If you later need messages sent from the dashboard through an API after a separate approval, set up Meta's official WhatsApp Business Platform Cloud API and a deployed secure backend. You will need a Meta business portfolio, WhatsApp Business Account, registered/verified business number, a Phone Number ID, access token with the relevant WhatsApp permissions, and private backend secrets. The message endpoint must enforce an explicit approval action, recipient consent, WhatsApp messaging rules/templates, rate limits, and logs without exposing tokens to the browser.

Official overview: https://developers.facebook.com/docs/whatsapp/cloud-api/overview

Do not switch to API sending until credentials are configured privately and a test send has been confirmed in Meta's tools.
