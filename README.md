# Apidoc Mock
[![Build Status](https://travis-ci.org/cdcabrera/apidoc-mock.svg?branch=master)](https://travis-ci.org/cdcabrera/apidoc-mock)
[![codecov](https://codecov.io/gh/cdcabrera/apidoc-mock/branch/master/graph/badge.svg)](https://codecov.io/gh/cdcabrera/apidoc-mock)
[![License](https://img.shields.io/github/license/cdcabrera/apidoc-mock.svg)](https://github.com/cdcabrera/apidoc-mock/blob/master/LICENSE)

Tired of overthinking mock solutions, use [apidoc](http://apidocjs.com/) styled comments on your local files to create a
mock NodeJS server. 

You can serve up exactly what you need. Everything from a 200 status, to forcing a random custom status. You can even force
a delay to see how your codebase will handle loading scenarios with a balls slow API response.

## Requirements
The basic requirements:
 * [NodeJS version 10+](https://nodejs.org/)
 * Optionally your system could be running
    - [Yarn 1.13+](https://yarnpkg.com), otherwise NPM should be adequate.
    - [Docker](https://docs.docker.com/engine/installation/)
 

## Use

Generate a "happy path" mock server from [apidoc](http://apidocjs.com/) `@apiSucceessExample` annotations. Once the
server is setup correctly you should be able update your code comments/annotations and have the mock(s) update with a 
browser refresh.

### CLI

NPM install...

  ```shell
    $ npm i apidock-mock
  ```
  
or Yarn

  ```shell
    $ yarn add apidock-mock
  ```

#### Usage
```
  $ mock --help
  Create a mock server from apiDoc comments.
  
  Usage: mock [options]
  
  Options:
    -d, --docs     Output directory used to compile apidocs   [default: "./.docs"]
    -p, --port     Set mock port                                   [default: 8000]
    -w, --watch    Watch single, or multiple directories       [default: "./data"]
    -h, --help     Show help                                             [boolean]
    -v, --version  Show version number                                   [boolean]
```

#### Example
  If you have a project, you could setup a NPM script to do the following

  ```shell
    $ mock -p 5000 -w src/yourDirectory -w src/anotherDirectory
  ```
  
  Then follow the guide for [apidoc](http://apidocjs.com/). From there run the NPM script, and open [localhost:5000/[PATH TO API ENDPOINT]](http://localhost:5000/).

### Or roll with a Docker setup

Apidoc Mock can also be found on Docker Hub...

* [Docker Hub, cdcabrera/apidoc-mock](https://hub.docker.com/r/cdcabrera/apidoc-mock/)

#### Example

The base Docker image comes preloaded with a "hello/world" example, the basics

  ```shell
    $ docker pull cdcabrera/apidoc-mock
    $ docker stop mock-api-test
    $ docker run -i --rm -p 8000:8000 --name mock-api-test cdcabrera/apidoc-mock
  ```
  
From there you should be able to navigate to
- the docs, http://localhost:8000/docs/
- the example api, http://localhost:8000/hello/world/


### Using within a project

1. Setup your API annotations first. `@apiSucceessExample` is the only apiDoc example currently implemented.
    ```js
      /**
       * @api {get} /hello/world/
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       */
      const getExample = () => {};
      
      /**
       * @api {post} /hello/world/
       * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       */
      const postExample = () => {};
    ```

1. Next
   #### Using a NPM script setup
   Setup your NPM scripts
   ```js
     "scripts": {
       "mock": "mock -p 5000 -w [PATH TO YOUR JS FILES] -w [ANOTHER PATH TO YOUR JS FILES]"
     }
   ```
   
   Then, run your script
   
    ```shell
      $ npm run mock
    ```

   #### Or if you're using a Docker setup
   Make sure Docker is running, and pull in the Docker image. Setup something like...
    
    ```js
      "scripts": {
        "mock:setup": "docker pull cdcabrera/apidoc-mock",
        "mock:run": "docker stop mock-api-test; docker run -i --rm -p [YOUR PORT]:8000 -v \"$(pwd)[PATH TO YOUR JS FILES]:/app/data\" --name mock-api-test cdcabrera/apidoc-mock"
      }
    ```
   You'll need to pick a port like... `-p 8000:8000` and a directory path to pull the apiDoc code comments/annotations from... `-v \"$(pwd)/src:/app/data\"`.
   
   Then, run your scripts

   ```shell
     $ npm run mock:setup
     $ npm run mock:run
   ```

1. Finally, navigate to
   - the docs, `http://localhost:[YOUR PORT]/docs/`
   - the api, `http://localhost:[YOUR PORT]/[PATH TO API ENDPOINT]`
   
   
### More examples, and custom responses

Apidoc Mock adds in a few different custom flags to help you identify or demonstrate API responses
- @apiMock {Random|RandomResponse} - pull a random response from either success or error examples
- @apiMock {RandomSuccess} - pull a random success from success examples
- @apiMock {RandomError} - pull a random error from error examples
- @apiMock {ForceStatus} [HTTP STATUS] - force a specific http status
- @apiMock {DelayResponse} [MILLISECONDS] - force (in milliseconds) a delayed response

1. Get random responses from both `success` and  `error` examples with the `@apiMock {RandomResponse}` annotation
    ```js
      /**
       * @api {get} /hello/world/
       * @apiMock {RandomResponse}
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "lorem": "dolor",
       *       "ipsum": "est",
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world",
       *     }
       */
      const getExample = () => {};
    ```
    
1. Get a random `success` response with the `@apiMock {RandomSuccess}` annotation. Or get a random `error` with the `@apiMock {RandomError}` annotation 
    ```js
      /**
       * @api {get} /hello/world/
       * @apiMock {RandomSuccess}
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "lorem": "dolor",
       *       "ipsum": "est",
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world",
       *     }
       */
      const getExample = () => {};
    ```
    
1. Force a specific response status with the `@apiMock {ForceStatus} [STATUS GOES HERE]` annotation. If you use a status without a supporting example the response status is still forced, but with fallback content. 
    ```js
      /**
       * @api {get} /hello/world/
       * @apiMock {ForceStatus} 400
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world",
       *     }
       */
      const getExample = () => {};
    ```

1. Delay a response status with the `@apiMock {DelayResponse} [MILLISECONDS GO HERE]` annotation. 
    ```js
      /**
       * @api {get} /hello/world/
       * @apiMock {DelayResponse} 3000
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world",
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world",
       *     }
       */
      const getExample = () => {};
    ```

## Contributing
Contributing? Guidelines can be found here [CONTRIBUTING.md](./CONTRIBUTING.md).
