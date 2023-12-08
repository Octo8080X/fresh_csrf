/// <reference lib="deno.unstable" />
import { defineConfig } from "$fresh/server.ts";
import { getCsrfPlugin } from "fresh_csrf/mod.ts";

export default defineConfig({
  plugins: [
    await getCsrfPlugin(await Deno.openKv(":memory:")),
  ],
});
