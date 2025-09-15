declare module 'expo-auth-session' {
  import { Platform } from 'react-native';
  export type ResponseType = 'token' | 'id_token' | 'code';
  export interface AuthRequestConfig {
    clientId: string;
    scopes?: string[];
    redirectUri?: string;
    responseType?: ResponseType;
  // Whether to use PKCE. For implicit flows like id_token, this must be false.
  usePKCE?: boolean;
    extraParams?: Record<string, string>;
  }
  export class AuthRequest {
    constructor(config: AuthRequestConfig);
    state?: string;
    idToken?: string;
    code?: string;
    accessToken?: string;
    promptAsync(discovery: { authorizationEndpoint: string; tokenEndpoint?: string }, options?: { useProxy?: boolean }): Promise<any>;
  }
  export const ResponseType: { IdToken: 'id_token'; Token: 'token'; Code: 'code' };
  export function makeRedirectUri(opts?: { useProxy?: boolean }): string;
}
