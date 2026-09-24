export interface CustomerCareRequestData {
  orderId: string;
  customerName: string;
  vehicleName: string;
  amountDue: number;
}

export async function sendCustomerCareNotification(data: CustomerCareRequestData) {
  const isEnabled = process.env.WHATSAPP_ENABLED === 'true';
  if (!isEnabled) {
    console.log('WhatsApp notification provider is not configured/enabled. Skipping.');
    return { success: false, reason: 'WHATSAPP_ENABLED is not true' };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const destinationNumber = process.env.WHATSAPP_CUSTOMER_CARE_NUMBER;

  if (!token || !phoneNumberId || !destinationNumber) {
    console.warn('WhatsApp environment variables missing. Skipping notification.');
    return { success: false, reason: 'Missing configuration variables' };
  }

  const messageText = `*New Customer Care Request*

Customer: ${data.customerName}
Vehicle: ${data.vehicleName}
Amount Due: $${data.amountDue.toLocaleString()}
Payment Method: Customer Care
Order: ${data.orderId}

The customer has requested assistance completing their payment.
Open the Customer Care dashboard to respond.`;

  try {
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: destinationNumber,
      type: "text",
      text: {
        body: messageText
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', result);
      return { success: false, reason: result.error?.message || 'Unknown WhatsApp API error' };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error: any) {
    console.error('WhatsApp Service Exception:', error);
    return { success: false, reason: error.message || 'Exception during fetch' };
  }
}
