import { Client, Databases, Query } from 'appwrite';

export const clientBrowser = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const clientServer = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

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