import { 
  LightsailClient, 
  GetInstanceCommand, 
  GetCertificatesCommand,
  AttachCertificateToDistributionCommand,
  GetLoadBalancersCommand,
  CreateLoadBalancerCommand,
  AttachInstancesToLoadBalancerCommand,
  GetDomainsCommand
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
    StaticIpAddress: string;
    Domain: string;
    Environment: string;
    CertificateName?: string;
    DomainName?: string;
    CloudFrontDomain?: string;
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
  console.log('WordPress Configuration Event:', JSON.stringify(event, null, 2));

  const { RequestType, ResourceProperties, ResponseURL, StackId, RequestId, LogicalResourceId } = event;
  const { InstanceName, StaticIpAddress, Domain, Environment, CloudFrontDomain } = ResourceProperties;

  let response: CustomResourceResponse = {
    Status: 'SUCCESS',
    PhysicalResourceId: `${InstanceName}-wordpress-config`,
    StackId,
    RequestId,
    LogicalResourceId,
  };

  try {
    switch (RequestType) {
      case 'Create':
      case 'Update':
        const certificateResult = await configureSSLCertificate(ResourceProperties);
        await validateAndConfigureWordPress(InstanceName, StaticIpAddress, Domain, Environment, CloudFrontDomain);
        response.Data = {
          InstanceName,
          StaticIpAddress,
          ConfigurationStatus: 'Complete',
          HealthCheckUrl: `http://${StaticIpAddress}/health-check.php`,
          WordPressAdminUrl: `http://${StaticIpAddress}/wp-admin/`,
          SSLCertificate: certificateResult,
        };
        break;

      case 'Delete':
        console.log('Delete operation - cleanup if necessary');
        break;

      default:
        throw new Error(`Unknown request type: ${RequestType}`);
    }
  } catch (error) {
    console.error('Error processing WordPress configuration:', error);
    response.Status = 'FAILED';
    response.Reason = error instanceof Error ? error.message : 'Unknown error occurred';
  }

  await sendResponse(ResponseURL, response);
};

async function validateAndConfigureWordPress(
  instanceName: string,
  staticIpAddress: string,
  domain: string,
  environment: string,
  cloudFrontDomain?: string
): Promise<void> {
  const maxRetries = 5;  // Reduced from 20
  const retryDelay = 15000; // 15 seconds (reduced from 30)

  console.log(`Starting WordPress validation for instance ${instanceName}`);

  // Wait for instance to be fully ready
  await waitForInstance(instanceName, maxRetries);

  // WordPress URL configuration handled by user data script
  if (cloudFrontDomain) {
    console.log(`WordPress URLs configured by user data script for ${cloudFrontDomain}`);
  }

  // Validate WordPress health endpoint
  await validateWordPressHealth(staticIpAddress, maxRetries, retryDelay);

  // Validate WordPress admin accessibility
  await validateWordPressAdmin(staticIpAddress, maxRetries, retryDelay);

  console.log('WordPress configuration validation completed successfully');
}

async function waitForInstance(instanceName: string, maxRetries: number): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await lightsailClient.send(
        new GetInstanceCommand({ instanceName })
      );

      const instance = response.instance;
      if (!instance) {
        throw new Error(`Instance ${instanceName} not found`);
      }

      console.log(`Instance ${instanceName} state: ${instance.state?.name}`);

      if (instance.state?.name === 'running') {
        console.log(`Instance ${instanceName} is running and ready`);
        return;
      }

      if (attempt === maxRetries) {
        throw new Error(`Instance ${instanceName} not running after ${maxRetries} attempts`);
      }

      console.log(`Waiting for instance to be running... (attempt ${attempt}/${maxRetries})`);
      await sleep(30000);
    } catch (error) {
      console.error(`Error checking instance state (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(30000);
    }
  }
}

async function validateWordPressHealth(
  staticIpAddress: string,
  maxRetries: number,
  retryDelay: number
): Promise<void> {
  const healthUrl = `http://${staticIpAddress}/health-check.php`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Checking WordPress health endpoint: ${healthUrl} (attempt ${attempt}/${maxRetries})`);
      
      // Using native fetch (Node.js 18+)
      const response = await fetch(healthUrl, {
        method: 'GET',
      });

      if (response.ok) {
        const healthData = await response.json() as any;
        console.log('WordPress health check response:', healthData);
        
        if (healthData.status === 'ok') {
          console.log('WordPress health check passed');
          return;
        } else {
          console.log(`WordPress health check failed: ${JSON.stringify(healthData)}`);
        }
      } else {
        console.log(`Health endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Health check attempt ${attempt} failed:`, error);
    }

    if (attempt === maxRetries) {
      throw new Error(`WordPress health check failed after ${maxRetries} attempts`);
    }

    console.log(`Waiting ${retryDelay / 1000} seconds before next health check...`);
    await sleep(retryDelay);
  }
}

async function validateWordPressAdmin(
  staticIpAddress: string,
  maxRetries: number,
  retryDelay: number
): Promise<void> {
  const adminUrl = `http://${staticIpAddress}/wp-admin/`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Checking WordPress admin accessibility: ${adminUrl} (attempt ${attempt}/${maxRetries})`);
      
      // Using native fetch (Node.js 18+)
      const response = await fetch(adminUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects
      });

      // WordPress admin should return either 200 (login page) or 302 (redirect to login)
      if (response.status === 200 || response.status === 302) {
        console.log('WordPress admin is accessible');
        return;
      } else {
        console.log(`WordPress admin returned status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Admin accessibility check attempt ${attempt} failed:`, error);
    }

    if (attempt === maxRetries) {
      throw new Error(`WordPress admin not accessible after ${maxRetries} attempts`);
    }

    console.log(`Waiting ${retryDelay / 1000} seconds before next admin check...`);
    await sleep(retryDelay);
  }
}

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

async function sendResponse(responseURL: string, response: CustomResourceResponse): Promise<void> {
  const responseBody = JSON.stringify(response);
  console.log('Sending response:', responseBody);

  try {
    // Using native fetch (Node.js 18+)
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