import { LightsailClient, GetInstanceCommand } from '@aws-sdk/client-lightsail';

interface IsCompleteEvent {
  RequestType: 'Create' | 'Update' | 'Delete';
  ResourceProperties: {
    InstanceName: string;
    StaticIpAddress: string;
  };
}

const lightsailClient = new LightsailClient({});

// isComplete side of the Provider framework: one cheap probe per invocation,
// `{ IsComplete: false }` means "poll me again" (every queryInterval, until
// the provider's totalTimeout fails the resource). This is what lets the
// health gate outwait a nano_3_0's first boot — the image's own WordPress
// provisioning plus our setup script can take 15+ minutes, which no single
// Lambda invocation (15-minute hard cap) can cover. Found the hard way
// during the dev blueprint migration, 2026-10-24.
export const handler = async (
  event: IsCompleteEvent
): Promise<{ IsComplete: boolean }> => {
  console.log('WordPress isComplete probe:', JSON.stringify(event, null, 2));

  if (event.RequestType === 'Delete') {
    return { IsComplete: true };
  }

  const { InstanceName, StaticIpAddress } = event.ResourceProperties;

  try {
    const { instance } = await lightsailClient.send(
      new GetInstanceCommand({ instanceName: InstanceName })
    );
    if (instance?.state?.name !== 'running') {
      console.log(`Instance ${InstanceName} state: ${instance?.state?.name ?? 'unknown'} — not ready`);
      return { IsComplete: false };
    }

    const health = await fetch(`http://${StaticIpAddress}/health-check.php`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!health.ok) {
      console.log(`health-check.php returned HTTP ${health.status}`);
      return { IsComplete: false };
    }
    const healthData = (await health.json()) as { status?: string };
    if (healthData.status !== 'ok') {
      console.log(`health-check.php not ok: ${JSON.stringify(healthData)}`);
      return { IsComplete: false };
    }

    const admin = await fetch(`http://${StaticIpAddress}/wp-admin/`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    if (admin.status !== 200 && admin.status !== 302) {
      console.log(`wp-admin returned HTTP ${admin.status}`);
      return { IsComplete: false };
    }

    console.log('WordPress healthy: instance running, health-check ok, wp-admin reachable');
    return { IsComplete: true };
  } catch (error) {
    // Unreachable/refused is the normal early state on a booting instance;
    // report not-complete and let the provider keep polling.
    console.log('Probe failed (will retry):', error instanceof Error ? error.message : error);
    return { IsComplete: false };
  }
};
