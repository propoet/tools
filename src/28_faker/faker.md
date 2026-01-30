# @faker-js/faker 从零开始学习指南

## 📚 目录
1. [什么是 @faker-js/faker](#什么是-faker-jsfaker)
2. [原理：模板与随机数据生成](#原理模板与随机数据生成)
3. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [常用模块速览](#常用模块速览)
5. [本地化与多语言](#本地化与多语言)
6. [可复现结果（seed）](#可复现结果seed)
7. [simpleFaker 轻量用法](#simplefaker-轻量用法)
8. [复杂对象与工厂函数](#复杂对象与工厂函数)
9. [Helpers 辅助方法](#helpers-辅助方法)
10. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 @faker-js/faker

**@faker-js/faker** 是用于**生成大量假数据**的库，适用于测试、开发、演示等场景，可生成人名、地址、邮箱、日期、金额、公司名、产品名、UUID、Lorem 文本等，数据逼真、API 简单。

### 为什么选择 @faker-js/faker？
- ✅ 模块丰富：person、location、date、finance、commerce、internet、lorem、helpers 等
- ✅ 支持 70+ 语言/地区（locale），可切换中文、英文等
- ✅ TypeScript 支持
- ✅ 可设置 seed，便于测试可复现
- ✅ simpleFaker 可只生成数字/字符串/UUID，不加载语言包，体积更小
- ✅ 零依赖

### 典型场景
- 单元测试、E2E 测试：填充用户、订单、地址等假数据
- 开发环境：Mock 接口、填充列表页
- 演示/原型：快速生成示例数据
- 数据库种子：生成 seed 数据

---

## 原理：模板与随机数据生成

**核心思路**：假数据不是「随便乱写」，而是基于**模板 + 随机组合**：预置大量符合语境的词库（如人名、街道名、城市名），再通过随机数从中抽取、拼接，必要时加上简单规则（如邮箱 = 名 + 姓 + 域名）。

- **模块化词库**：person、location、company、lorem 等模块各自维护本地化词库（如中文名、英文名），locale 切换时加载对应词库，保证生成的人名、地址符合该语言习惯。
- **随机与 seed**：底层用伪随机数（如 Mersenne Twister），调用 `faker.seed(123)` 后，同一环境下的调用序列固定，便于测试可复现。
- **simpleFaker**：只提供数字、字符串、UUID 等基础随机能力，不加载语言包，体积更小，适合只需要「任意字符串」而不需要「像真人名」的场景。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add @faker-js/faker
# 或 npm install @faker-js/faker
# 开发/测试用可装 dev：pnpm add -D @faker-js/faker
```

### 2. ESM 引入

```javascript
import { faker } from '@faker-js/faker';

const name = faker.person.fullName();
const email = faker.internet.email();
```

### 3. 指定语言（可选）

```javascript
// 使用德语
import { fakerDE as faker } from '@faker-js/faker';

// 使用中文
import { fakerZH_CN as faker } from '@faker-js/faker';
```

---

## 基础用法

### Person（人名、性别、职位等）

```javascript
import { faker } from '@faker-js/faker';

faker.person.firstName();      // 名
faker.person.lastName();       // 姓
faker.person.fullName();       // 全名
faker.person.middleName();     // 中间名
faker.person.sex();            // 性别（字符串）
faker.person.gender();         // 性别（更细）
faker.person.jobTitle();       // 职位
faker.person.jobArea();        // 部门/领域
faker.person.jobType();        // 工作类型
faker.person.bio();            // 简短简介
faker.person.zodiacSign();     // 星座
// 可按性别生成名：faker.person.firstName('female')
```

### Internet（邮箱、URL、IP、用户名等）

```javascript
faker.internet.email();              // 随机邮箱
faker.internet.email({ firstName: 'John', lastName: 'Doe' }); // 指定姓名
faker.internet.userName();           // 用户名
faker.internet.displayName();       // 显示名
faker.internet.url();               // URL
faker.internet.domainName();        // 域名
faker.internet.ip();                // IP
faker.internet.ipv4();              // IPv4
faker.internet.ipv6();              // IPv6
faker.internet.password();          // 密码
faker.internet.userAgent();         // User-Agent
```

### Location（地址、城市、国家等）

```javascript
faker.location.city();           // 城市
faker.location.country();       // 国家
faker.location.countryCode();   // 国家代码
faker.location.street();        // 街道
faker.location.streetAddress(); // 完整街道地址
faker.location.buildingNumber(); // 门牌号
faker.location.zipCode();        // 邮编
faker.location.state();          // 州/省
faker.location.latitude();      // 纬度
faker.location.longitude();     // 经度
faker.location.timeZone();      // 时区
```

### Date（日期）

```javascript
faker.date.past();              // 过去某日
faker.date.future();            // 未来某日
faker.date.recent();            // 最近几天
faker.date.soon();              // 即将到来
faker.date.birthdate();         // 生日（可设 min/max 年龄）
faker.date.anytime();           // 任意时间
faker.date.between({ from: '2020-01-01', to: '2024-12-31' });
faker.date.weekday();           // 星期几
faker.date.month();             // 月份
```

### String / Number（字符串、数字）

```javascript
faker.string.uuid();            // UUID
faker.string.nanoid();          // NanoID
faker.string.ulid();            // ULID
faker.string.alpha(10);        // 10 个字母
faker.string.alphanumeric(10);  // 10 个字母数字
faker.string.numeric(6);       // 6 位数字串

faker.number.int();             // 随机整数
faker.number.int({ min: 1, max: 100 });
faker.number.float();           // 随机小数
faker.number.float({ min: 0, max: 1, fractionDigits: 2 });
faker.number.bigInt({ min: 0n, max: 1000n });
```

### Commerce（商品、价格）

```javascript
faker.commerce.productName();     // 商品名
faker.commerce.productAdjective(); // 商品形容词
faker.commerce.productMaterial();  // 材质
faker.commerce.department();       // 部门/分类
faker.commerce.price();            // 价格字符串，如 "12.99"
faker.commerce.price({ min: 10, max: 100 });
```

### Finance（金融）

```javascript
faker.finance.amount();           // 金额字符串
faker.finance.accountNumber();    // 账号
faker.finance.iban();             // IBAN
faker.finance.creditCardNumber(); // 信用卡号（假）
faker.finance.currencyCode();    // 货币代码
faker.finance.bitcoinAddress();  // 比特币地址
faker.finance.ethereumAddress(); // 以太坊地址
```

### Lorem（段落、句子、词）

```javascript
faker.lorem.word();           // 一个词
faker.lorem.words(5);         // 5 个词
faker.lorem.sentence();       // 一句
faker.lorem.sentences(3);     // 3 句
faker.lorem.paragraph();      // 一段
faker.lorem.paragraphs(2);    // 2 段
faker.lorem.text();           // 多段文本
faker.lorem.lines(3);         // 3 行
```

### 其他常用模块

| 模块 | 示例 |
|------|------|
| **Company** | `faker.company.name()`、`faker.company.catchPhrase()` |
| **Image** | `faker.image.avatar()`、`faker.image.url()` |
| **Phone** | `faker.phone.number()` |
| **Database** | `faker.database.mongodbObjectId()`、`faker.database.column()` |
| **Hacker** | `faker.hacker.phrase()`、`faker.hacker.abbreviation()` |
| **Git** | `faker.git.commitMessage()`、`faker.git.commitSha()` |
| **Music** | `faker.music.genre()`、`faker.music.songName()` |
| **Vehicle** | `faker.vehicle.vehicle()`、`faker.vehicle.vin()` |
| **Animal** | `faker.animal.dog()`、`faker.animal.petName()` |
| **Color** | `faker.color.rgb()`、`faker.color.human()` |
| **Book** | `faker.book.title()`、`faker.book.author()` |
| **Food** | `faker.food.dish()`、`faker.food.fruit()` |
| **System** | `faker.system.fileName()`、`faker.system.mimeType()`、`faker.system.semver()` |

---

## 常用模块速览

| 需求 | 写法 |
|------|------|
| 人名 | `faker.person.fullName()`、`faker.person.firstName()`、`faker.person.lastName()` |
| 邮箱 | `faker.internet.email()` |
| 地址 | `faker.location.streetAddress()`、`faker.location.city()`、`faker.location.zipCode()` |
| 日期 | `faker.date.past()`、`faker.date.birthdate()` |
| UUID | `faker.string.uuid()` |
| 整数 | `faker.number.int({ min, max })` |
| 价格 | `faker.commerce.price()` |
| 段落 | `faker.lorem.paragraph()` |
| 公司名 | `faker.company.name()` |
| 头像 URL | `faker.image.avatar()` |

---

## 本地化与多语言

Faker 支持多语言，通过导入对应 locale 的 faker 使用：

```javascript
// 中文
import { fakerZH_CN as faker } from '@faker-js/faker';
faker.person.fullName();  // 中文名
faker.location.city();   // 中文城市

// 德语
import { fakerDE as faker } from '@faker-js/faker';

// 日语
import { fakerJA as faker } from '@faker-js/faker';
```

也可在已有 faker 实例上切换 locale（见官方 [Localization Guide](https://fakerjs.dev/guide/localization)）。

---

## 可复现结果（seed）

测试时若希望每次运行得到相同数据，可设置 **seed**：

```javascript
import { faker } from '@faker-js/faker';

faker.seed(123);
const a = faker.person.fullName();
const b = faker.number.int();

faker.seed(123);  // 再次设置相同 seed，序列重置
const c = faker.person.fullName();
const d = faker.number.int();
// a === c, b === d
```

**注意**：`faker.date.past()`、`faker.date.future()`、`faker.date.birthdate()` 等依赖「当前时间」，仅设 seed 可能无法完全复现。可指定 **refDate** 或使用 `faker.setDefaultRefDate('2023-01-01')` 固定参考日期。

```javascript
faker.setDefaultRefDate('2023-01-01T00:00:00.000Z');
faker.date.past();  // 相对 2023-01-01 的过去
```

---

## simpleFaker 轻量用法

若只需要 **UUID、数字、字符串** 等与语言无关的数据，可用 **simpleFaker**，不加载语言包，体积更小（约 500KB+ 差异）：

```javascript
import { simpleFaker } from '@faker-js/faker';

simpleFaker.string.uuid();
simpleFaker.string.nanoid();
simpleFaker.number.int({ min: 1, max: 100 });
simpleFaker.number.float();
// 无 person、location、lorem 等需要 locale 的模块
```

适合：只生成 ID、随机数、随机字符串的测试环境。

---

## 复杂对象与工厂函数

Faker 主要生成「原始值」，复杂对象需要自己写**工厂函数**，并在内部保证字段一致（如性别与名字一致、邮箱与姓名一致）。

### 示例：用户工厂

```javascript
import { faker } from '@faker-js/faker';

function createUser(overwrites = {}) {
  const sex = faker.person.sexType();
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email,
    sex,
    avatar: faker.image.avatar(),
    birthday: faker.date.birthdate(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    ...overwrites,
  };
}

const user = createUser();
const userWithFixedEmail = createUser({ email: 'fixed@example.com' });
```

### 生成多个

```javascript
const users = Array.from({ length: 10 }, () => createUser());
// 或
const users = faker.helpers.multiple(createUser, { count: 10 });
```

---

## Helpers 辅助方法

| 方法 | 说明 |
|------|------|
| **faker.helpers.arrayElement(arr)** | 从数组中随机取一个元素 |
| **faker.helpers.arrayElements(arr, count?)** | 从数组中随机取多个（不重复） |
| **faker.helpers.multiple(fn, { count })** | 多次调用 fn，返回结果数组 |
| **faker.helpers.shuffle(arr)** | 打乱数组 |
| **faker.helpers.uniqueArray(fn, count)** | 调用 fn 直到得到 count 个不重复值 |
| **faker.helpers.maybe(fn, { probability })** | 以一定概率执行 fn，否则返回 undefined |
| **faker.helpers.fake(template)** | 按模板生成字符串，如 `faker.helpers.fake('{{person.firstName}} {{person.lastName}}')` |
| **faker.helpers.weightedArrayElement(arr, weights)** | 按权重从数组中取元素 |

### 示例

```javascript
faker.helpers.arrayElement(['a', 'b', 'c']);           // 'a' | 'b' | 'c'
faker.helpers.arrayElements(['a', 'b', 'c'], 2);      // 2 个不重复
faker.helpers.multiple(() => faker.person.fullName(), { count: 3 });
faker.helpers.shuffle([1, 2, 3]);
faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.7 });
faker.helpers.fake('{{person.firstName}} {{person.lastName}}');
```

---

## 最佳实践与参考

### 实践建议

1. **测试用 seed**：单测里 `faker.seed(固定值)` 保证可复现。
2. **日期可复现**：需要可复现时用 `setDefaultRefDate` 或传 `refDate`。
3. **前端慎用**：完整 faker 体积较大（>5MB minify），前端生产环境避免全量引入；可用 simpleFaker 或按需打包。
4. **工厂函数**：复杂实体用工厂函数，保证姓名/性别/邮箱等字段一致。
5. **唯一值**：需要唯一时用 `faker.helpers.uniqueArray` 或 `faker.string.uuid()` 等。

### 速查表

| 需求 | 写法 |
|------|------|
| 人名/邮箱/地址 | `faker.person.*`、`faker.internet.email()`、`faker.location.*` |
| 日期 | `faker.date.past()`、`faker.date.birthdate()` |
| UUID/数字/字符串 | `faker.string.uuid()`、`faker.number.int()` |
| 价格/商品 | `faker.commerce.price()`、`faker.commerce.productName()` |
| 段落 | `faker.lorem.paragraph()` |
| 随机选一个 | `faker.helpers.arrayElement(arr)` |
| 生成多个 | `faker.helpers.multiple(fn, { count })` |
| 可复现 | `faker.seed(123)`、`faker.setDefaultRefDate(...)` |
| 轻量 | `simpleFaker.string.uuid()` 等 |

### 参考链接

- [npm @faker-js/faker](https://www.npmjs.com/package/@faker-js/faker)
- [Faker 官网](https://fakerjs.dev/)
- [Usage 使用指南](https://fakerjs.dev/guide/usage.html)
- [API 参考](https://fakerjs.dev/api/)
- [Localization 本地化](https://fakerjs.dev/guide/localization)
- [Unique 唯一值](https://fakerjs.dev/guide/unique)
- 本目录 **1.base.js** — 可直接运行的入门示例
