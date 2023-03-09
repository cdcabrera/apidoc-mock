const global = require('../global');

describe('Global', () => {
  it('should return specific properties', () => {
    expect(Object.keys(global)).toMatchSnapshot('specific properties');
  });

  it('should minimally generate a consistent hash', () => {
    expect({
      valueObject: global.generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }),
      valueObjectConfirm:
        global.generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }) ===
        global.generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }),
      valueObjectConfirmSort:
        global.generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }) ===
        global.generateHash({ dolor: ['sit', null, undefined, 1, () => 'hello world'] }, { lorem: 'ipsum' }),
      valueInt: global.generateHash(200),
      valueFloat: global.generateHash(20.000006),
      valueNull: global.generateHash(null),
      valueUndefined: global.generateHash(undefined),
      valueArray: global.generateHash([1, 2, 3]),
      valueArraySort: global.generateHash([3, 2, 1]),
      valueArrayConfirmSort: global.generateHash([1, 2, 3]) !== global.generateHash([3, 2, 1]),
      valueSet: global.generateHash(new Set([1, 2, 3])),
      valueSetConfirmSort: global.generateHash(new Set([1, 2, 3])) === global.generateHash(new Set([3, 2, 1])),
      valueSymbol: global.generateHash(Symbol('lorem ipsum')),
      valueSymbolUndefined: global.generateHash(Symbol('lorem ipsum')) === global.generateHash(undefined),
      valueBoolTrue: global.generateHash(true),
      valueBoolFalse: global.generateHash(false)
    }).toMatchSnapshot('hash, object and primitive values');
  });

  it('should memoize function return values', () => {
    const testArr = [];
    let testStr;
    const testMemoReturnValue = global.memo(
      str => {
        const arr = ['lorem', 'ipsum', 'dolor', 'sit'];
        const randomStr = Math.floor(Math.random() * arr.length);
        const genStr = `${arr[randomStr]}-${str}`;
        testStr = genStr;
        testArr.push(genStr);
        return genStr;
      },
      { cacheLimit: 4 }
    );

    testMemoReturnValue('one');
    testMemoReturnValue('one');
    testMemoReturnValue('one');
    testMemoReturnValue('one');
    expect(testStr === testMemoReturnValue('one')).toBe(true);

    testMemoReturnValue('two');
    testMemoReturnValue('three');
    expect(testArr[0] === testMemoReturnValue('one')).toBe(true);
    expect(testArr[1] === testMemoReturnValue('two')).toBe(true);
    expect(testArr[2] === testMemoReturnValue('three')).toBe(true);
    expect(testArr[2] === testMemoReturnValue('three')).toBe(true);

    testMemoReturnValue('four');
    expect(testArr[3] === testMemoReturnValue('four')).toBe(true);
    expect(testArr.length).toBe(4);
  });

  it('should memoize async function return values', async () => {
    const asyncMemoValue = global.memo(value => new Promise(resolve => setTimeout(() => resolve(value), 10)));
    const asyncResponse = await asyncMemoValue('lorem ipsum');
    expect(asyncResponse).toBe('lorem ipsum');

    const asyncMemoError = global.memo(
      value => new Promise((_, reject) => setTimeout(() => reject(new Error(value)), 10))
    );
    await expect(async () => asyncMemoError('lorem ipsum')).rejects.toThrowErrorMatchingSnapshot('memoize async error');
  });

  it('should set a one-time mutable OPTIONS object', () => {
    const { OPTIONS } = global;

    // for testing set a consistent contextPath and parser
    OPTIONS.contextPath = '/';
    OPTIONS.apiDocBaseConfig.parsers.apimock = '/customParser.js';

    OPTIONS.lorem = 'et all';
    OPTIONS.dolor = 'magna';
    OPTIONS._set = {
      lorem: 'ipsum',
      sit: function () {
        return `function test ${this.contextPath}`;
      }
    };
    OPTIONS.lorem = 'hello world';
    OPTIONS.dolor = 'sit';

    expect({ isFrozen: Object.isFrozen(OPTIONS), OPTIONS }).toMatchSnapshot('immutable');
  });
});
