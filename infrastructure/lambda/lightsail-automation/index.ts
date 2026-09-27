import {
  LightsailClient,
  AttachStaticIpCommand,
  DetachStaticIpCommand,
  GetInstanceCommand,
  GetStaticIpCommand,
} from '@aws-sdk/client-lightsail';

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

const lightsailClient = new LightsailClient({});

// Provider-framework contract (aws-cdk-lib custom-resources `Provider`):
// return on success, throw on failure. The framework sends the
// CloudFormation response — this handler must NOT send its own. It used
// to: a self-sent FAILED followed by the framework's SUCCESS (last write
// wins) let a failed validation register as a successful deploy.
export const handler = async (
  event: CustomResourceEvent
): Promise<{ PhysicalResourceId: string; Data?: Record<string, unknown> }> => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { RequestType, ResourceProperties } = event;
  const { InstanceName, StaticIpName } = ResourceProperties;
  const PhysicalResourceId = `${InstanceName}-${StaticIpName}-attachment`;

  switch (RequestType) {
    case 'Create':
    case 'Update':
      await attachStaticIpWithRetry(InstanceName, StaticIpName);
      return { PhysicalResourceId, Data: { InstanceName, StaticIpName, AttachmentStatus: 'Attached' } };
    case 'Delete':
      // Deleting the stack detaches the static IP with the instance.
      console.log('Delete operation - no action needed');
      return { PhysicalResourceId };
    default:
      throw new Error(`Unknown request type: ${RequestType}`);
  }
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

      // Attached to a different instance: this is an instance *replacement*
      // (CloudFormation creates the new instance before deleting the old
      // one), so move the IP rather than refusing. DNS/CloudFront keep
      // pointing at the same address throughout.
      if (staticIp.isAttached && staticIp.attachedTo !== instanceName) {
        console.log(`Static IP ${staticIpName} is attached to ${staticIp.attachedTo}; moving it to ${instanceName}...`);
        await lightsailClient.send(new DetachStaticIpCommand({ staticIpName }));
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
