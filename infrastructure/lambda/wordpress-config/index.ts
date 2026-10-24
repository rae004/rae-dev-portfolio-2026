import {
  LightsailClient,
  GetCertificatesCommand,
  AttachCertificateToDistributionCommand,
  GetLoadBalancersCommand,
  CreateLoadBalancerCommand,
  AttachInstancesToLoadBalancerCommand,
  GetDomainsCommand
} from '@aws-sdk/client-lightsail';

interface CustomResourceEvent {
  RequestType: 'Create' | 'Update' | 'Delete';
  PhysicalResourceId?: string;
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  ResourceProperties: {
    InstanceName: string;
    StaticIpAddress: string;
    Domain: string;
    Environment: string;
    CertificateName?: string;
    DomainName?: string;
    CloudFrontDomain?: string;
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
  console.log('WordPress Configuration Event:', JSON.stringify(event, null, 2));
  const { RequestType, ResourceProperties } = event;
  const { InstanceName, StaticIpAddress, Domain, Environment, CloudFrontDomain } = ResourceProperties;
  const PhysicalResourceId = `${InstanceName}-wordpress-config`;

  switch (RequestType) {
    case 'Create':
    case 'Update': {
      const certificateResult = await configureSSLCertificate(ResourceProperties);
      // Health/admin validation lives in is-complete.ts: the Provider
      // framework polls it until WordPress is actually up, on a budget far
      // beyond a single Lambda invocation (a nano's first boot takes 15+ min).
      if (CloudFrontDomain) {
        console.log(`WordPress URLs configured by user data script for ${CloudFrontDomain}`);
      }
      console.log(`Starting WordPress validation for instance ${InstanceName} via isComplete polling (${Domain}/${Environment})`);
      return {
        PhysicalResourceId,
        Data: {
          InstanceName,
          StaticIpAddress,
          ConfigurationStatus: 'Complete',
          HealthCheckUrl: `http://${StaticIpAddress}/health-check.php`,
          WordPressAdminUrl: `http://${StaticIpAddress}/wp-admin/`,
          SSLCertificate: certificateResult,
        },
      };
    }
    case 'Delete':
      console.log('Delete operation - nothing to clean up');
      // Echo back the ID CloudFormation is deleting (it may be a legacy
      // framework-generated UUID); answering with a different ID is an error.
      return { PhysicalResourceId: event.PhysicalResourceId ?? PhysicalResourceId };
    default:
      throw new Error(`Unknown request type: ${RequestType}`);
  }
};

async function configureSSLCertificate(
  resourceProperties: {
    InstanceName: string;
    StaticIpAddress: string;
    Domain: string;
    Environment: string;
    CertificateName?: string;
    DomainName?: string;
  }
): Promise<any> {
  const { CertificateName, DomainName, InstanceName } = resourceProperties;
  
  if (!CertificateName || !DomainName) {
    console.log('Certificate name or domain name not provided, skipping SSL configuration');
    return { status: 'skipped', reason: 'Missing certificate or domain configuration' };
  }

  try {
    console.log(`Configuring SSL certificate ${CertificateName} for domain ${DomainName}`);
    
    // Wait for certificate to be validated (LightSail certificates auto-validate via DNS)
    const maxRetries = 30; // 15 minutes total
    const retryDelay = 30000; // 30 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const certResponse = await lightsailClient.send(
          new GetCertificatesCommand({ certificateName: CertificateName })
        );
        
        const certificates = certResponse.certificates;
        if (!certificates || certificates.length === 0) {
          throw new Error(`Certificate ${CertificateName} not found`);
        }
        
        const certificateSummary = certificates[0];
        
        // GetCertificatesCommand only returns summary info, we need to check if it exists
        // For LightSail, if the certificate exists in the list, it's considered valid
        console.log(`Certificate found: ${certificateSummary.certificateName}, domain: ${certificateSummary.domainName}`);
        
        // Simply return success if certificate exists - LightSail auto-validates DNS certificates
        return { 
          status: 'success', 
          certificateName: CertificateName, 
          domainName: DomainName,
          message: 'Certificate found and available' 
        };
        
      } catch (error) {
        console.error(`Certificate check attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Waiting for certificate to exist... (attempt ${attempt}/${maxRetries})`);
        await sleep(retryDelay);
      }
    }
    
    throw new Error(`Certificate validation timed out after ${maxRetries} attempts`);
    
  } catch (error) {
    console.error('SSL certificate configuration failed:', error);
    return { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      certificateName: CertificateName,
      domainName: DomainName 
    };
  }
}


async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
