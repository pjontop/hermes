import { Client, Databases, Query } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint) {
  console.error('NEXT_PUBLIC_APPWRITE_ENDPOINT is not defined in environment variables');
  throw new Error('Appwrite endpoint is required');
}

if (!projectId) {
  console.error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is not defined in environment variables');
  throw new Error('Appwrite project ID is required');
}

export const clientBrowser = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const clientServer = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

if (process.env.APPWRITE_API_KEY) {
  try {
    if (typeof clientServer.setKey === 'function') {
      clientServer.setKey(process.env.APPWRITE_API_KEY);
    } else {
      clientServer.headers = {
        ...clientServer.headers,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY
      };
    }
  } catch (error) {
    console.log('Could not set API key:', error.message);
  }
}

export const databases = new Databases(clientServer);
export { ID, Query } from 'appwrite';

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID;