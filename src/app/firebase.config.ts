import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

const app = getApps().length ? getApp() : initializeApp(environment.firebase);
const auth = getAuth(app);

export { app, auth };