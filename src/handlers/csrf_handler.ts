import {
  computeHmacTokenPair,
  computeVerifyHmacTokenPair,
  type FreshContext,
  getCookies,
  Iron,
  setCookie,
} from "../../deps.ts";
import type { CsrfOption } from "../type.ts";
import { DEFAULT_CSRF_OPTION, MSEC } from "../consts.ts";

async function getCsrf(
  req: Request,
  kv: Deno.Kv,
  options: CsrfOption,
): Promise<{
  csrfVerifyFunction: { (token: string | null): boolean };
  getCookieStr: { (): Promise<string> };
  getTokenStr: { (): string };
  updateKeyPair: { (): void };
}> {
  const { [options.cookieOptions.name]: encryptCookieToken } = getCookies(
    req.headers,
  );

  let entry: {
    key: Deno.KvKey | null;
    value: { token: string; expireIn: number } | null;
    versionstamp: string | null;
  } = {
    key: null,
    value: null,
    versionstamp: null,
  };

  let cookieToken = "";
  if (typeof encryptCookieToken === "string") {
    try {
      cookieToken = await Iron.unseal(
        globalThis.crypto,
        encryptCookieToken,
        options.encryptKey,
        Iron.defaults,
      ) as string;
    } catch (e) {
      console.error(e);
      cookieToken = "";
    }

    entry = await kv.get<{ token: string; expireIn: number }>([
      options.kvParentPath,
      cookieToken,
    ]);
  }

  let newTokenStr = "";
  let newCookieStr = "";

  if (!entry.value || (entry.value.expireIn < (new Date()).getTime())) {
    const pair = computeHmacTokenPair(options.key, options.salt);
    newTokenStr = pair.tokenStr;
    newCookieStr = pair.cookieStr;
    await kv.set([options.kvParentPath, pair.cookieStr], {
      expireIn: (new Date()).getTime() + options.keyExpireIn * MSEC,
      token: pair.tokenStr,
    }, {
      expireIn: options.keyExpireIn * MSEC,
    });
  } else {
    newTokenStr = entry.value.token;
    newCookieStr = cookieToken;
  }

  const updateKeyPair = async () => {
    const pair = computeHmacTokenPair(options.key, options.salt);
    newTokenStr = pair.tokenStr;
    newCookieStr = pair.cookieStr;
    await kv.set([options.kvParentPath, pair.cookieStr], {
      expireIn: (new Date()).getTime() + options.keyExpireIn * MSEC,
      token: pair.tokenStr,
    }, {
      expireIn: options.keyExpireIn * MSEC,
    });
  };

  const csrfVerifyFunction = function (token: string | null): boolean {
    if (
      !token || !cookieToken || entry.value?.token != token ||
      (entry.value.expireIn < (new Date()).getTime())
    ) {
      return false;
    }

    return computeVerifyHmacTokenPair(
      options.key,
      token,
      cookieToken,
    );
  };

  return {
    csrfVerifyFunction,
    getCookieStr: async () =>
      await Iron.seal(
        globalThis.crypto,
        newCookieStr,
        options.encryptKey,
        Iron.defaults,
      ),
    getTokenStr: () => newTokenStr,
    updateKeyPair,
  };
}

const WORN_MASSAGE = `\u001b[33m
+---------------------------------------------------------------+
[FRESH CSRF] Warning: You should change the key and salt of csrf.
+---------------------------------------------------------------+
\u001b[0m`;

export function getHandler(kv: Deno.Kv, options: Partial<CsrfOption> = {}) {
  if (!options?.key || !options?.salt || options?.encryptKey) {
    console.warn(WORN_MASSAGE);
  }

  const mergedOptions: Required<CsrfOption> = {
    ...DEFAULT_CSRF_OPTION,
    ...options,
    cookieOptions: {
      ...DEFAULT_CSRF_OPTION.cookieOptions,
      ...options.cookieOptions,
    },
  };

  return async (req: Request, ctx: FreshContext) => {
    if (ctx.destination != "route") {
      return ctx.next();
    }

    const { csrfVerifyFunction, getCookieStr, getTokenStr, updateKeyPair } =
      await getCsrf(
        req,
        kv,
        mergedOptions,
      );

    ctx.state.csrf = { csrfVerifyFunction, getTokenStr, updateKeyPair };

    const res = await ctx.next();

    setCookie(res.headers, {
      value: await getCookieStr(),
      name: mergedOptions.cookieOptions.name,
    });

    return res;
  };
}
