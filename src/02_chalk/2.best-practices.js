import chalk from "chalk";

const styles = {
  error: chalk.bold.red,
  warning: chalk.hex('#FFA500'),
  success: chalk.bold.green,
  dim: chalk.dim,
};

export function logError(msg) {
  console.error(styles.error('Error:'), msg);
}
export function logSuccess(msg) {
  console.log(styles.success('✔'), msg);
}

logError('这是一个错误信息');
logSuccess('这是一个成功信息');