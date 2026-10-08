export interface NicConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  gstin: string;
  authUrl: string;
  generateUrl: string;
  isSandbox: boolean;
}

export const nicConfig: NicConfig = {
  clientId: process.env.NIC_CLIENT_ID || '',
  clientSecret: process.env.NIC_CLIENT_SECRET || '',
  username: process.env.NIC_USERNAME || '',
  password: process.env.NIC_PASSWORD || '',
  gstin: process.env.NIC_GSTIN || '24AAACL9999P1Z2',
  authUrl: 'https://einv-apisandbox.nic.in/einvapi/v1.1/auth',
  generateUrl: 'https://einv-apisandbox.nic.in/version1.03/generate',
  isSandbox: process.env.NIC_SANDBOX_MODE !== 'false',
};
