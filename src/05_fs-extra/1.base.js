import fs from 'fs-extra'

const data = await fs.readFileSync('package.json', 'utf-8')
// 若目录不存在则创建，包括所有父级目录；若已存在则不报错。
// await fs.ensureDir('dist/subdir');
// await fs.copy('src', 'dist');
const pathExists = await fs.pathExists('package.json');
console.log(pathExists)

// execa   listr2   progress / cli-progress  dotenv-expand  cross-env  semver  changesets  standard-version / release-please  shelljs  dotenv-cli  cosmiconfig  joi  zod

// execa semver listr2 progress  cli-progress   dotenv-expand  cross-env  @changesets/git  standard-version   shelljs dotenv-cli  cosmiconfig joi zod consola  svgo   path-browserify
