# Apidoc Mock

Use [apidoc](http://apidocjs.com/) comments to create a mock server. Quick handy way to generate
a mock server response.

## Requirements
The basic requirements:
 * [Docker](https://docs.docker.com/engine/installation/)
 * Optionally your system could be running 
    - [NodeJS version 8+](https://nodejs.org/), (the examples are based off NodeJS)
    - [Yarn 1.5+](https://yarnpkg.com), otherwise NPM should be adequate.
 

## Use

Generate a "happy path" mock server from [apidoc](http://apidocjs.com/) `@apiSucceessExample` annotations. Once the
server is setup correctly you should be able update your code comments/annotations and have the mock(s) update with a 
browser refresh.

Apidoc Mock can also be found on Docker Hub...

* [Docker Hub, cdcabrera/apidoc-mock](https://hub.docker.com/r/cdcabrera/apidoc-mock/)

### Basic example

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

1. Next, make sure Docker is running, and pull in the Docker image, you can use a set of NPM scripts in `package.json`
    ```js
      "scripts": {
        "mock:setup": "docker pull cdcabrera/apidoc-mock",
        "mock:run": "docker stop mock-api-test; docker run -i --rm -p [YOUR PORT]:8000 -v \"$(pwd)[PATH TO YOUR JS FILES]:/app/data\" --name mock-api-test cdcabrera/apidoc-mock"
      }
    ```
   You'll need to pick a port like... `-p 8000:8000` and a directory path to pull the apiDoc code comments/annotations from like... `-v \"$(pwd)/src:/app/data\"`.

1. Next run the scripts
    ```shell
      $ npm run mock:setup
      $ npm run mock:run
    ```
    
   From there navigate to
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
