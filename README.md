# Apidoc Mock
[![Build Status](https://github.com/cdcabrera/apidoc-mock/workflows/Build/badge.svg?branch=main)](https://github.com/cdcabrera/apidoc-mock/actions?query=workflow%3ABuild)
[![coverage](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcdcabrera.github.io%2Fapidoc-mock%2Fsummary.json&query=%24.coverage.pct&suffix=%25&label=coverage&color=9F3FC0)](https://cdcabrera.github.io/apidoc-mock/)
[![License](https://img.shields.io/github/license/cdcabrera/apidoc-mock.svg)](https://github.com/cdcabrera/apidoc-mock/blob/master/LICENSE)

Tired of overthinking mock solutions, use [apidoc](http://apidocjs.com/) styled comments on your local files to create a
mock NodeJS server. 

You can serve up exactly what you need. Everything from a 200 status, to forcing a random custom status. You can even force
a delay to see how your codebase will handle loading scenarios with a balls slow API response.

## Requirements
The basic requirements:
 * [NodeJS version 18+](https://nodejs.org/)
 * Optionally your system could be running
    - [Docker](https://docs.docker.com/engine/installation/)
    - [podman](https://github.com/containers/podman) or [podman desktop](https://podman-desktop.io/)
 

## Use

Generate a "happy path" mock server from [apidoc](http://apidocjs.com/) `@apiSuccessExample` annotations. Once the
server is set up correctly you should be able to update your code comments/annotations and have the mock(s) update with a 
browser refresh.

### CLI

NPM install...

  ```shell
    $ npm i apidoc-mock
  ```

#### Usage
```
  $ mock --help
  Create a mock server from apiDoc comments.
  
  Usage: mock [options]
  
  Options:
    -d, --docs     Output directory used to compile apidocs   [default: "./.docs"]
    -p, --port     Set mock port                                   [default: 8000]
    -s, --silent   Silence apiDoc's output warnings, errors
                                                         [boolean] [default: true]
    -w, --watch    Watch single, or multiple directories
    -h, --help     Show help                                             [boolean]
    -v, --version  Show version number                                   [boolean]
```

#### Example
  If you have a project, you could setup a NPM script to do the following

  ```shell
    $ mock -p 5000 -w src/yourDirectory -w src/anotherDirectory
  ```
  
  Then follow the guide for [apidoc](http://apidocjs.com/). From there run the NPM script, and open [localhost:5000/[PATH TO API ENDPOINT]](http://localhost:5000/).
  
  It's recommended you make sure to `.gitignore` the `.docs` directory that gets generated for `apidocs`. 

### Or roll with a container setup, maybe?
Since `apidoc-mock` now runs locally we consider our `Dockerfile` to be less of a focus and now in maintenance mode.

We no longer support an `apidoc-mock` image hosted on [`dockerhub`](https://hub.docker.com/r/cdcabrera/apidoc-mock) or
[`Quay.io`](https://quay.io/repository/cdcabrera/apidoc-mock) which means you will either have to build your own container
image or use one of the existing older versions of `apidoc-mock` still being hosted.

> Docker has a [beginner breakdown for image build and container run guide](https://docs.docker.com/get-started/)

#### Setup and example
The `apidoc-mock` image comes preloaded with a "hello/world" example...

1. First, download the repository
1. Confirm `Docker`, or an aliased version of `podman`, is running
1. Next, open a terminal up and `$ cd` into the local repository
1. Then, build the image
    ```shell
      $ docker build -t apidoc-mock .
    ```
1. Then, run the container
    ```shell
      $ docker run -d --rm -p 8000:8000 --name mock-api apidoc-mock && docker ps
    ```
1. Finally, you should be able to navigate to
   - the docs, http://localhost:8000/docs/
   - the example api, http://localhost:8000/hello/world/

   To stop everything type...
    ```shell
      $ docker stop mock-api
    ```


### Using within a project
**Using ApiDocs**
> The v0.5X.X+ range of ApiDocs, now, requires the description with its updated template (i.e. `@api {get} /hello/world/ [a description]`) if you want the docs to display. If you don't use that aspect of this package you can continue to leave it out. 

1. Setup your API annotations first. `@apiSuccessExample` is the only apiDoc example currently implemented.
    ```js
      /**
       * @api {get} /hello/world/ Get
       * @apiGroup Hello World
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       */
      const getExample = () => {};
      
      /**
       * @api {post} /hello/world/ Post
       * @apiGroup Hello World
       * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       */
      const postExample = () => {};
    ```

1. Next
   #### Using a NPM script setup
   Then, make sure to `.gitignore` the `.docs` directory that gets generated for `apidocs`.
   
   Then, setup your NPM scripts
   ```js
     "scripts": {
       "mock": "mock -p 5000 -w [PATH TO YOUR JS FILES] -w [ANOTHER PATH TO YOUR JS FILES]"
     }
   ```
   
   And then run your script
   
    ```shell
      $ npm run mock
    ```

   #### Or if you're using a container setup
   Make sure `Docker`, or `podman`, is running, and you've created a local image from the repository called `apidoc-mock`. After that setup is something like...
    
    ```js
      "scripts": {
        "mock:run": "docker stop mock-api-test; docker run -i --rm -p [YOUR PORT]:8000 -v \"$(pwd)[PATH TO YOUR JS FILES]:/app/data\" --name mock-api-test apidoc-mock",
        "mock:stop": "docker stop mock-api-test"
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
       * @api {get} /hello/world/ Get
       * @apiGroup Hello World
       * @apiMock {RandomResponse}
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "lorem": "dolor",
       *       "ipsum": "est"
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world"
       *     }
       */
      const getExample = () => {};
    ```
    
1. Get a random `success` response with the `@apiMock {RandomSuccess}` annotation. Or get a random `error` with the `@apiMock {RandomError}` annotation 
    ```js
      /**
       * @api {get} /hello/world/ Get
       * @apiGroup Hello World
       * @apiMock {RandomSuccess}
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "lorem": "dolor",
       *       "ipsum": "est"
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world"
       *     }
       */
      const getExample = () => {};
    ```
    
1. Force a specific response status with the `@apiMock {ForceStatus} [STATUS GOES HERE]` annotation. If you use a status without a supporting example the response status is still forced, but with fallback content. 
    ```js
      /**
       * @api {get} /hello/world/ Get
       * @apiGroup Hello World
       * @apiMock {ForceStatus} 400
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world"
       *     }
       */
      const getExample = () => {};
    ```

1. Delay a response status with the `@apiMock {DelayResponse} [MILLISECONDS GO HERE]` annotation. 
    ```js
      /**
       * @api {get} /hello/world/ Get
       * @apiGroup Hello World
       * @apiMock {DelayResponse} 3000
       * @apiSuccess {String} foo
       * @apiSuccess {String} bar
       * @apiSuccessExample {json} Success-Response:
       *     HTTP/1.1 200 OK
       *     {
       *       "foo": "hello",
       *       "bar": "world"
       *     }
       * @apiError {String} bad
       * @apiError {String} request
       * @apiErrorExample {json} Error-Response:
       *     HTTP/1.1 400 OK
       *     {
       *       "bad": "hello",
       *       "request": "world"
       *     }
       */
      const getExample = () => {};
    ```

## Contributing
Contributing? Guidelines can be found here [CONTRIBUTING.md](./CONTRIBUTING.md).
