import { CsrfOption } from "fresh_csrf/src/type.ts";

export const MSEC = 1000;
export const DEFAULT_KEY = "01234567012345670123456701234567";
export const DEFAULT_SALT = 123;
export const DEFAULT_ENCRYPT_KEY = "01234567012345670123456701234567";

export const DEFAULT_CSRF_OPTION: Required<CsrfOption> = {
  keyExpireIn: 60 * 5,
  salt: DEFAULT_SALT,
  key: DEFAULT_KEY,
  encryptKey: DEFAULT_ENCRYPT_KEY,
  kvParentPath: "csrf_token",
  cookieOptions: {
    name: "csrf_token",
    path: "/",
    sameSite: "Strict",
    secure: true,
    httpOnly: true,
    domain: "",
  },
};
