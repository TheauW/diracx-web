import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: "test/e2e/**/*.cy.ts",
    supportFile: false,
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
  chromeWebSecurity: false,
  scrollBehavior: "center",
});
