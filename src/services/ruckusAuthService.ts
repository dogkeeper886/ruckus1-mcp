import axios from 'axios';

export async function getRuckusJwtToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  region: string = ''
): Promise<string> {
  const url = `https://${region ? region + '.' : ''}ruckus.cloud/oauth2/token/${tenantId}`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await axios.post(url, params, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  });

  return response.data.access_token;
} 