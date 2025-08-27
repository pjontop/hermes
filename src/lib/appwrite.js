import { Client, Databases, Query } from 'appwrite';

// Hard-coded values as fallback for Next.js 15 build issues
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68a75dcf0004be62f5c6';

console.log('Appwrite config:', { endpoint: endpoint ? 'set' : 'missing', projectId: projectId ? 'set' : 'missing' });

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

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '68a7792c003a5bc18a0b';
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || '68a7793400264d26f8f2';