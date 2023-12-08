import { PageProps, Plugin } from "$fresh/server.ts";
import TestComponent, { handler } from "../routes/test_route.tsx";
import { ComponentType } from "preact";

export const testPlugin: Plugin = {
  name: "TestPlugin",
  routes: [
    {
      handler,
      component: TestComponent as ComponentType<PageProps>,
      path: "/csrf",
    },
  ],
};
