import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  mediaUrl?: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('Twilio not configured. Skipping WhatsApp message.');
    return false;
  }

  try {
    const messageData: any = {
      from: whatsappNumber,
      to: `whatsapp:${to}`,
      body: message,
    };

    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await twilioClient.messages.create(messageData);
    console.log('WhatsApp message sent:', result.sid);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

export async function initiateCall(
  to: string,
  from?: string
): Promise<boolean> {
  if (!twilioClient || !phoneNumber) {
    console.warn('Twilio not configured. Skipping call initiation.');
    return false;
  }

  try {
    const call = await twilioClient.calls.create({
      from: from || phoneNumber,
      to,
      url: 'http://demo.twilio.com/docs/voice.xml', // Replace with your TwiML URL
    });
    console.log('Call initiated:', call.sid);
    return true;
  } catch (error) {
    console.error('Failed to initiate call:', error);
    return false;
  }
}

export async function sendAlertNotification(
  policeNumber: string,
  storeName: string,
  address: string,
  detectionType: string,
  imageUrl?: string
): Promise<boolean> {
  const message = `🚨 SECURITY ALERT\n\nStore: ${storeName}\nLocation: ${address}\nThreat: ${detectionType} detected\n\nImmediate response required.`;

  return await sendWhatsAppMessage(policeNumber, message, imageUrl);
}
