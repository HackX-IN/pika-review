import chalk from "chalk";

/**
 * Senior Logger: Standardized output with clear visual hierarchy.
 */
export const logger = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  error: (msg: string) => console.error(chalk.red(`❌ ${msg}`)),
  critical: (msg: string) => console.error(chalk.bgRed.white.bold(` ⚡ ${msg} `)),
  dim: (msg: string) => console.log(chalk.gray(msg)),
};
