
import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "q0xynhos";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";


export default defineCliConfig({
  api: {
    projectId: "q0xynhos",
    dataset: "production"
  },
  studioHost: process.env.SANITY_STUDIO_STUDIO_HOST || "", // Visit https://www.sanity.io/docs/environment-variables to leanr more about using environment variables for local & production.
  deployment: { autoUpdates: true }


});
