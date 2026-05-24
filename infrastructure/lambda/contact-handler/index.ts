import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * Contact form submission interface
 */
interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  recaptcha_score?: number;
}

/**
 * WordPress request payload interface
 */
interface WordPressRequest {
  source: string;
  site_url: string;
  timestamp: string;
  test?: boolean;
  contact: ContactSubmission;
}

/**
 * Lambda response interface
 */
interface LambdaResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

// Initialize AWS SNS client
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Validate contact form submission data
 */
function validateContactData(contact: any): ContactSubmission | null {
  if (!contact || typeof contact !== 'object') {
    return null;
  }

  const { name, email, subject, message } = contact;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return null;
  }

  if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return null;
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return null;
  }

  if (typeof subject !== 'string' || subject.length < 3 || subject.length > 200) {
    return null;
  }

  if (typeof message !== 'string' || message.length < 10 || message.length > 5000) {
    return null;
  }

  return {
    name: sanitizeString(name),
    email: sanitizeString(email),
    subject: sanitizeString(subject),
    message: sanitizeString(message),
    timestamp: contact.timestamp || new Date().toISOString(),
    ip_address: sanitizeString(contact.ip_address || 'unknown'),
    user_agent: sanitizeString(contact.user_agent || 'unknown'),
    recaptcha_score: typeof contact.recaptcha_score === 'number' ? contact.recaptcha_score : undefined,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  return input.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      default: return char;
    }
  }).trim();
}

/**
 * Create email message for SNS
 */
function createEmailMessage(contact: ContactSubmission, isTest: boolean = false): string {
  const testPrefix = isTest ? '[TEST MESSAGE] ' : '';
  
  return `${testPrefix}New contact form submission from RAE Dev Portfolio

From: ${contact.name} <${contact.email}>
Subject: ${contact.subject}
Submitted: ${contact.timestamp}
IP Address: ${contact.ip_address}
User Agent: ${contact.user_agent}
${contact.recaptcha_score ? `reCAPTCHA Score: ${contact.recaptcha_score}` : ''}

Message:
${contact.message}

---
This message was sent via the RAE Dev Portfolio contact form.
To reply, send an email directly to ${contact.email}`;
}

/**
 * Send email via AWS SNS
 */
async function sendEmail(contact: ContactSubmission, isTest: boolean = false): Promise<string> {
  const topicArn = process.env.SNS_TOPIC_ARN;
  
  if (!topicArn) {
    throw new Error('SNS_TOPIC_ARN environment variable not set');
  }

  const testPrefix = isTest ? '[TEST] ' : '';
  const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX || '[Portfolio Contact]';
  const emailSubject = `${testPrefix}${subjectPrefix} ${contact.subject}`;
  const emailMessage = createEmailMessage(contact, isTest);

  const publishCommand = new PublishCommand({
    TopicArn: topicArn,
    Subject: emailSubject,
    Message: emailMessage,
    MessageAttributes: {
      'contact_name': {
        DataType: 'String',
        StringValue: contact.name
      },
      'contact_email': {
        DataType: 'String',
        StringValue: contact.email
      },
      'is_test': {
        DataType: 'String',
        StringValue: isTest.toString()
      },
      'recaptcha_score': {
        DataType: 'Number',
        StringValue: (contact.recaptcha_score || 0).toString()
      }
    }
  });

  const result = await snsClient.send(publishCommand);
  
  if (!result.MessageId) {
    throw new Error('Failed to send email - no message ID returned');
  }

  return result.MessageId;
}

/**
 * Create success response
 */
function createSuccessResponse(data: LambdaResponse, statusCode: number = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
function createErrorResponse(error: string, statusCode: number = 400): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error
    })
  };
}

/**
 * Validate API key if configured
 */
function validateApiKey(event: APIGatewayProxyEvent): boolean {
  const expectedApiKey = process.env.API_KEY;
  
  // If no API key is configured, allow request
  if (!expectedApiKey) {
    return true;
  }

  const providedApiKey = event.headers['X-API-Key'] || event.headers['x-api-key'];
  return providedApiKey === expectedApiKey;
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Log request for debugging (without sensitive data)
  console.log('Contact form submission received', {
    httpMethod: event.httpMethod,
    source: event.headers['User-Agent'],
    timestamp: new Date().toISOString()
  });

  try {
    // Handle preflight OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
      return createSuccessResponse({ success: true, message: 'CORS preflight' });
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Validate API key
    if (!validateApiKey(event)) {
      console.warn('Invalid API key provided');
      return createErrorResponse('Unauthorized', 401);
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse('Request body is required');
    }

    let requestData: WordPressRequest;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body');
    }

    // Validate request structure
    if (!requestData.contact) {
      return createErrorResponse('Contact data is required');
    }

    // Validate contact data
    const validatedContact = validateContactData(requestData.contact);
    if (!validatedContact) {
      return createErrorResponse('Invalid contact form data');
    }

    // Check if this is a test request
    const isTest = requestData.test === true;

    // Send email via SNS
    const messageId = await sendEmail(validatedContact, isTest);

    // Log successful submission
    console.log('Contact form email sent successfully', {
      messageId,
      name: validatedContact.name,
      email: validatedContact.email,
      subject: validatedContact.subject,
      isTest,
      recaptchaScore: validatedContact.recaptcha_score
    });

    return createSuccessResponse({
      success: true,
      message: isTest ? 'Test message sent successfully' : 'Contact form submission processed successfully',
      messageId
    });

  } catch (error) {
    // Log error details
    console.error('Error processing contact form submission:', error);

    // Return generic error to client
    return createErrorResponse('Internal server error', 500);
  }
};