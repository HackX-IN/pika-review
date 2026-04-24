import { initConfig } from "../utils/config.js";

/**
 * CLI Command: init
 * Initializes the global configuration file.
 */
export async function initAction() {
  initConfig();
}
