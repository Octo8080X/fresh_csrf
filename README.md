# Fresh Csrf 🍋

Dead simple csrf for [Deno Csrf](https://deno.land/x/deno_csrf).

# Usage

## fresh.config.ts

```ts
/// <reference lib="deno.unstable" />
import { defineConfig } from "$fresh/server.ts";
import { getCsrfPlugin } from "https://deno.land/x/fresh_csrf/mod.ts";

export default defineConfig({
  plugins: [
    await getCsrfPlugin(await Deno.openKv(), {
      encryptKey: Deno.env.get("FRESH_CSRF_ENCRYPT_KEY")!, // <= string length of 32, ex. 12345678901234567890123456789012
      key: Deno.env.get("FRESH_CSRF_KEY")!, // <= string length of 32, ex. 01234567012345670123456701234567
      salt: Number(Deno.env.get("FRESH_CSRF_SALT!")!), // ex. 123
    }),
  ],
});
```

⚠ Recommend managing each key and salt using environment variables.

## Using the functionality provided by the plugin

Methods are provided.

- `csrfVerifyFunction()`
- `updateKeyPair()`
- `getTokenStr()`

```ts
import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";
import type { WithCsrf } from "https://deno.land/x/fresh_csrf/mod.ts";

export const handler: Handlers<unknown, WithCsrf> = {
  async GET(_req: Request, ctx: FreshContext) {
    const res = await ctx.render();

    return res;
  },
  async POST(
    req: Request,
    ctx: FreshContext<WithCsrf>,
  ) {
    const form = await req.formData();
    const token = form.get("csrf");
    const text = form.get("text");

    if (!ctx.state.csrf.csrfVerifyFunction(token?.toString() ?? null)) {
      const res = new Response(null, {
        status: 302,
        headers: {
          Location: "/csrf",
        },
      });

      return res;
    }
    ctx.state.csrf.updateKeyPair();

    const res = await ctx.render({ text });

    return res;
  },
};

export default function Test(
  props: PageProps<{ text: string }, WithCsrf>,
) {
  return (
    <div>
      <p>{props?.data?.text || "NO SET"}</p>
      <form method="post">
        <input
          type="hidden"
          name="csrf"
          value={props.state.csrf.getTokenStr()}
        />
        <input type="text" name="text" />
        <button class="button border">Submit</button>
      </form>
    </div>
  );
}
```
