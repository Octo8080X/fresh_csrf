/// <reference lib="deno.unstable" />
import { defineConfig } from "$fresh/server.ts";
import { getCsrfPlugin } from "../../mod.ts";
import { testPlugin } from "../plugins/test_plugin.ts";

export default defineConfig({
  plugins: [
    await getCsrfPlugin(await Deno.openKv(":memory:")),
    testPlugin,
  ],
});
