import ora from 'ora'

// const spinner = ora('loading...').start()
// setTimeout(() => {
//   spinner.succeed('done')
// }, 1000);
//动态修改文案

const spinner = ora('Loading unicorns').start();

setTimeout(() => {
  spinner.color = 'yellow';
  spinner.text = 'Loading rainbows';
}, 1000);

setTimeout(() => {
  spinner.succeed('All done!');
}, 2000);