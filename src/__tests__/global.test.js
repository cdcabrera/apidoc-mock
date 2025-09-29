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

describe('memo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    {
      description: 'sync',
      options: { cacheLimit: 2 },
      params: [[], [], [1], [1], [2], [2], [3], [3], [1]]
    },
    {
      description: 'sync errors',
      options: { cacheLimit: 2, cacheErrors: true },
      params: [[, true], [, true], [4, true], [4, true], [5, true], [5, true], [6, true], [6, true], [4, true]]
    },
    {
      description: 'sync errors NOT cached',
      options: { cacheLimit: 2, cacheErrors: false },
      params: [[7, true], [7, true], [8], [8], [9, true], [9, true], [7, true]]
    },
    {
      description: 'bypass memoization when cacheLimit is zero',
      options: { cacheLimit: 0 },
      params: [[], [], [1], [1], [2, true], [2, true]]
    }
  ])('should memoize a function, $description', ({ options, params }) => {
    const log = [];
    const debug = response => log.push(response);
    const memoized = global.memo(
      (str, isError = false) => {
        const arr = ['lorem', 'ipsum', 'dolor', 'sit'];
        const randomStr = Math.floor(Math.random() * arr.length);
        const genStr = `${arr[randomStr]}-${str || '[EMPTY]'}`;

        if (isError) {
          throw new Error(genStr);
        }

        return genStr;
      },
      { debug, ...options }
    );

    for (const param of params) {
      try {
        memoized(...param);
      } catch {}
    }

    const updatedLog = [];

    for (const { type, value, cache } of log) {
      let successValue;
      let errorValue;

      try {
        successValue = value();
      } catch (e) {
        errorValue = e.message;
      }

      successValue = successValue?.split?.('-')[1];
      errorValue = errorValue?.split?.('-')[1];

      updatedLog.push({ type, successValue, errorValue, cacheLength: cache.length });
    }

    expect(updatedLog).toMatchSnapshot();
  });

  it.each([
    {
      description: 'async',
      options: { cacheLimit: 2 },
      params: [[], [], [1], [1], [2], [2], [3], [3], [1]]
    },
    {
      description: 'async errors',
      options: { cacheLimit: 2, cacheErrors: true },
      params: [[, true], [, true], [4, true], [4, true], [5, true], [5, true], [6, true], [6, true], [4, true]]
    },
    {
      description: 'async errors NOT cached',
      options: { cacheLimit: 2, cacheErrors: false },
      params: [[7, true], [7, true], [8], [8], [9, true], [9, true], [7, true]]
    },
    {
      description: 'async bypass memoization when cacheLimit is zero',
      options: { cacheLimit: 0 },
      params: [[], [], [1], [1], [2, true], [2, true]]
    }
  ])('should memoize a function, $description', async ({ options, params }) => {
    const log = [];
    const debug = response => log.push(response);
    const memoized = global.memo(
      async (str, isError = false) => {
        const arr = ['lorem', 'ipsum', 'dolor', 'sit'];
        const randomStr = Math.floor(Math.random() * arr.length);
        const genStr = `${arr[randomStr]}-${str || '[EMPTY]'}`;

        if (isError) {
          throw new Error(genStr);
        }

        return genStr;
      },
      { debug, ...options }
    );

    try {
      await Promise.all(params.map(param => memoized(...param)));
    } catch {}

    const updatedLog = [];

    for (const { type, value, cache } of log) {
      let successValue;
      let errorValue;

      try {
        successValue = await value();
      } catch (e) {
        errorValue = e.message;
      }

      successValue = successValue?.split?.('-')[1];
      errorValue = errorValue?.split?.('-')[1];

      updatedLog.push({ type, successValue, errorValue, cacheLength: cache.length });
    }

    expect(updatedLog).toMatchSnapshot();
  });

  it.each([
    {
      description: 'async',
      options: { cacheLimit: 3, expire: 10 },
      paramsOne: [[], [], [1], [1], [2], [2]],
      paramsTwo: [[3, true], [3, true], [4, true], [4, true], [5, true], [5, true]],
      pause: 70
    }
  ])('should clear cache on inactivity, $description', async ({ options, paramsOne, paramsTwo, pause }) => {
    const log = [];
    const debug = response => log.push(response);
    const memoized = global.memo(async (str, isError = false) => {
      const arr = ['lorem', 'ipsum', 'dolor', 'sit'];
      const randomStr = Math.floor(Math.random() * arr.length);
      const genStr = `${arr[randomStr]}-${str || '[EMPTY]'}`;

      if (isError) {
        throw new Error(genStr);
      }

      return genStr;
    }, { debug, ...options });

    try {
      await Promise.all(paramsOne.map(param => memoized(...param)));
    } catch {}

    jest.advanceTimersByTime(pause);

    try {
      await Promise.all(paramsTwo.map(param => memoized(...param)));
    } catch {}

    jest.advanceTimersByTime(pause);

    const updatedLog = [];

    for (const { cache } of log) {
      updatedLog.push(cache.filter(Boolean).length);
    }

    expect(updatedLog).toMatchSnapshot('cache list length');
  });
});
