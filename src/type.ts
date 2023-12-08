import { type Cookie } from "../deps.ts";

export type CookieOptions = Omit<
  Cookie,
  "value" | "expires" | "unparsed" | "maxAge"
>;

export interface CsrfOption {
  keyExpireIn: number;
  salt: number;
  key: string;
  encryptKey: string;
  kvParentPath: string;
  cookieOptions: CookieOptions;
}

export interface WithCsrf extends Record<string, unknown> {
  csrf: {
    csrfVerifyFunction: { (token: string | null): boolean };
    getCookieStr: { (): Promise<string> };
    getTokenStr: { (): string };
    updateKeyPair: { (): void };
  };
}
