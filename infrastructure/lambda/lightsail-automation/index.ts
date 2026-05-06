import { LightsailClient, AttachStaticIpCommand, GetInstanceCommand, GetStaticIpCommand } from '@aws-sdk/client-lightsail';

interface CustomResourceEvent {
  RequestType: 'Create' | 'Update' | 'Delete';
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  ResourceProperties: {
    InstanceName: string;
    StaticIpName: string;
    Region: string;
  };
}

interface CustomResourceResponse {
  Status: 'SUCCESS' | 'FAILED';
  Reason?: string;
  PhysicalResourceId: string;
  StackId: string;
  RequestId: string;
  LogicalResourceId: string;
  Data?: Record<string, any>;
}

const lightsailClient = new LightsailClient({});

export const handler = async (event: CustomResourceEvent): Promise<void> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const { RequestType, ResourceProperties, ResponseURL, StackId, RequestId, LogicalResourceId } = event;
  const { InstanceName, StaticIpName, Region } = ResourceProperties;

  let response: CustomResourceResponse = {
    Status: 'SUCCESS',
    PhysicalResourceId: `${InstanceName}-${StaticIpName}-attachment`,
    StackId,
    RequestId,
    LogicalResourceId,
  };

  try {
    switch (RequestType) {
      case 'Create':
      case 'Update':
        await attachStaticIpWithRetry(InstanceName, StaticIpName);
        response.Data = {
          InstanceName,
          StaticIpName,
          AttachmentStatus: 'Attached',
        };
        break;

      case 'Delete':
        // For deletion, we don't need to do anything as deleting the stack
        // will automatically detach the static IP
        console.log('Delete operation - no action needed');
        break;

      default:
        throw new Error(`Unknown request type: ${RequestType}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    response.Status = 'FAILED';
    response.Reason = error instanceof Error ? error.message : 'Unknown error occurred';
  }

  await sendResponse(ResponseURL, response);
};

async function attachStaticIpWithRetry(instanceName: string, staticIpName: string, maxRetries = 10): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Checking instance and static IP status...`);

      // Check if instance is running
      const instanceResponse = await lightsailClient.send(
        new GetInstanceCommand({ instanceName })
      );

      const instance = instanceResponse.instance;
      if (!instance) {
        throw new Error(`Instance ${instanceName} not found`);
      }

      console.log(`Instance ${instanceName} state: ${instance.state?.name}`);

      if (instance.state?.name !== 'running') {
        if (attempt === maxRetries) {
          throw new Error(`Instance ${instanceName} is not running after ${maxRetries} attempts. Current state: ${instance.state?.name}`);
        }
        console.log(`Instance not running yet, waiting 30 seconds before retry...`);
        await sleep(30000);
        continue;
      }

      // Check if static IP exists and is available
      const staticIpResponse = await lightsailClient.send(
        new GetStaticIpCommand({ staticIpName })
      );

      const staticIp = staticIpResponse.staticIp;
      if (!staticIp) {
        throw new Error(`Static IP ${staticIpName} not found`);
      }

      console.log(`Static IP ${staticIpName} status: ${staticIp.isAttached ? 'attached' : 'available'}`);

      // If already attached to the same instance, we're done
      if (staticIp.isAttached && staticIp.attachedTo === instanceName) {
        console.log(`Static IP ${staticIpName} is already attached to instance ${instanceName}`);
        return;
      }

      // If attached to a different instance, this is an error
      if (staticIp.isAttached && staticIp.attachedTo !== instanceName) {
        throw new Error(`Static IP ${staticIpName} is already attached to instance ${staticIp.attachedTo}`);
      }

      // Attach the static IP
      console.log(`Attaching static IP ${staticIpName} to instance ${instanceName}...`);
      await lightsailClient.send(
        new AttachStaticIpCommand({
          staticIpName,
          instanceName,
        })
      );

      console.log(`Successfully attached static IP ${staticIpName} to instance ${instanceName}`);
      return;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      const waitTime = Math.min(30000 * attempt, 180000); // Exponential backoff, max 3 minutes
      console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
      await sleep(waitTime);
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendResponse(responseURL: string, response: CustomResourceResponse): Promise<void> {
  const responseBody = JSON.stringify(response);
  console.log('Sending response:', responseBody);

  try {
    const fetch = (await import('node-fetch')).default;
    const result = await fetch(responseURL, {
      method: 'PUT',
      headers: {
        'Content-Type': '',
        'Content-Length': responseBody.length.toString(),
      },
      body: responseBody,
    });

    console.log('Response sent successfully:', result.status);
  } catch (error) {
    console.error('Failed to send response:', error);
    throw error;
  }
}