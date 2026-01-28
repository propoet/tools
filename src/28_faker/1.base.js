/**
 * @faker-js/faker 基础示例
 * 运行: node src/28_faker/1.base.js
 *
 * 需先安装: pnpm add @faker-js/faker
 */
import { faker } from '@faker-js/faker'

// 1. Person
console.log('--- Person ---')
console.log('fullName:', faker.person.fullName())
console.log('firstName:', faker.person.firstName())
console.log('lastName:', faker.person.lastName())
console.log('jobTitle:', faker.person.jobTitle())
console.log('bio:', faker.person.bio())

// 2. Internet
console.log('\n--- Internet ---')
console.log('email:', faker.internet.email())
console.log('userName:', faker.internet.userName())
console.log('url:', faker.internet.url())
console.log('ipv4:', faker.internet.ipv4())
console.log('uuid:', faker.string.uuid())

// 3. Location
console.log('\n--- Location ---')
console.log('streetAddress:', faker.location.streetAddress())
console.log('city:', faker.location.city())
console.log('zipCode:', faker.location.zipCode())
console.log('country:', faker.location.country())

// 4. Date
console.log('\n--- Date ---')
console.log('past:', faker.date.past())
console.log('birthdate:', faker.date.birthdate({ min: 18, max: 65, mode: 'age' }))

// 5. Number / String
console.log('\n--- Number / String ---')
console.log('int(1-100):', faker.number.int({ min: 1, max: 100 }))
console.log('float:', faker.number.float({ min: 0, max: 1, fractionDigits: 2 }))
console.log('nanoid:', faker.string.nanoid())

// 6. Commerce
console.log('\n--- Commerce ---')
console.log('productName:', faker.commerce.productName())
console.log('price:', faker.commerce.price())
console.log('department:', faker.commerce.department())

// 7. Lorem
console.log('\n--- Lorem ---')
console.log('sentence:', faker.lorem.sentence())
console.log('paragraph:', faker.lorem.paragraph().slice(0, 80) + '...')

// 8. Helpers
console.log('\n--- Helpers ---')
console.log('arrayElement:', faker.helpers.arrayElement(['a', 'b', 'c']))
console.log('multiple (3 names):', faker.helpers.multiple(() => faker.person.fullName(), { count: 3 }))
console.log('fake template:', faker.helpers.fake('{{person.firstName}} {{person.lastName}} - {{internet.email}}'))

// 9. 工厂函数示例：生成一个假用户对象
function createUser() {
  const sex = faker.person.sexType()
  const firstName = faker.person.firstName(sex)
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }),
    sex,
    avatar: faker.image.avatar(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
  }
}

console.log('\n--- Factory: createUser() ---')
console.log(JSON.stringify(createUser(), null, 2))
