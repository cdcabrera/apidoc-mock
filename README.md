# Apidoc Mock
[![Build Status](https://github.com/cdcabrera/apidoc-mock/workflows/Build/badge.svg?branch=main)](https://github.com/cdcabrera/apidoc-mock/actions?query=workflow%3ABuild)
[![coverage](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcdcabrera.github.io%2Fapidoc-mock%2Fsummary.json&query=%24.coverage.pct&suffix=%25&label=coverage&color=9F3FC0)](https://cdcabrera.github.io/apidoc-mock/)
[![License](https://img.shields.io/github/license/cdcabrera/apidoc-mock.svg)](https://github.com/cdcabrera/apidoc-mock/blob/master/LICENSE)

Tired of overthinking mock solutions, use [apidoc-like](http://apidocjs.com/) styled comments on your local files to generate mock API responses using Node.js. 

You can serve up exactly what you need. Everything from a `200` to a `418` status. You can even force a delay to see how your codebase will handle loading
scenarios with a balls slow API response.

> **Important!**
>
> The [apidoc NPM](https://www.npmjs.com/package/apidoc) has been retired... currently. To compensate for this we've moved the internal `apidoc-mock` parser
> over to [comment-parser](https://www.npmjs.com/package/comment-parser).
> 
> The move to a new [comment-parser](https://www.npmjs.com/package/comment-parser) means more than a few things
> 1. The use of `apidoc` generated and served documentation underneath the `/docs` path has been removed from `apidoc-mock`
> 1. Comments that can be parsed are now limited to comment syntax that starts with `/**` and ends with `*/`. JS/TS works as normal, and technically C#, Go, Dart, Java, PHP all should continue functioning. Any support for other comment types given by `apidoc` no longer exists.
> 1. Comment tags, such as `@api`, `@apiSuccessExample`, and `@apiMock` are still the same. No changes should be necessary. [The full list of available tags is here](./DOCS.md)
> 1. Watching directories, and files, has moved to [glob](https://www.npmjs.com/package/glob) patterns. Any existing watches should still function as intended.
> 1. You'll still be able to use the [apidoc NPM](https://www.npmjs.com/package/apidoc) parallel to `apidoc-mock` but you'll need to install, set up the server, and use it directly, or find a NPM that does it for you.
>
> After all this it's become apparent that the work used on `apidoc-mock` needs to evolve. Part one was moving over to different parser, `comment-parser`, part
> two is going to be the creation of a sibling NPM. 
> 
> The ability to mock inline, as fast as you can create the example, is still a very useful tool for frontend development. It's always curious to see the ecosystem evolve...

## Requirements
The basic requirements:
 * [Node.js version 18+](https://nodejs.org/)
 * Optionally your system could be running
    - [podman desktop](https://podman-desktop.io/)
    - [Docker](https://docs.docker.com/engine/installation/)
 

## Use

### Install the package

NPM install...

  ```shell
    $ npm i apidoc-mock --save-dev
  ```

## How to use
For in-depth usage of comment syntax see our [DOCS](./DOCS.md).

### Basic CLI
```
  $ mock --help
  Create a mock server from apiDoc like comments.
  
  Usage: mock [options]
  
  Options:
    -p, --port     Set mock port                          [number] [default: 8000]
    -w, --watch    Watch single, or multiple, files and extensions using glob
                   patterns.                                               [array]
    -h, --help     Show help                                             [boolean]
    -v, --version  Show version number                                   [boolean]
```

#### Use the CLI directly

1. Install `$ npm i apidoc-mock -g`, or depending on your permissions `$ sudo npm i apidoc-mock -g`
1. Setup a `txt` file called `hello_world.txt` with the following content
   ```
   /**
    * @api {get} /hello/world/
    * @apiSuccessExample {json}
    *     HTTP/1.1 200 OK
    *     {
    *       "foo": "hello",
    *       "bar": "world"
    *     }
    */
   ```
1. Run the mocks directly
   ```
   $ mock --port 8000 --watch path_to_the_file/hello_world.txt
   ```
   > If you get a port warning error simply change the port number and try again.
   > You'll also need to make sure the path in the next step opens at the new port.
1. Open a browser at http://127.0.0.1:8000/hello/world and see your response

#### Using within a JS project 

1. Install `$ npm i apidoc-mock --save-dev`
1. Setup a `JS`, or `TS`, file called `helloWorld.js` with the following content
   ```
   /**
    * @api {get} /hello/world/
    * @apiSuccessExample {json}
    *     HTTP/1.1 200 OK
    *     {
    *       "foo": "hello",
    *       "bar": "world"
    *     }
    */
   ```
1. Create a NPM script
   ```js
   "scripts": {
     "api": "mock --port 8000 --watch path_to_the_file/helloWorld.{js|ts}"
   }
   ```
1. Run the NPM script `$ npm run api`
   > If you get a port warning error simply change the port number in the script and try again.
   > You'll also need to make sure the path in the next step opens at the new port.
1. Open a browser at http://127.0.0.1:8000/hello/world and see your response

#### Using as a container
> We don't offer a current hosted image anymore, but you can use one of the legacy images from previous `apidoc-mock` versions on [`Quay.io`](https://quay.io/repository/cdcabrera/apidoc-mock)
> or [`dockerhub`](https://hub.docker.com/r/cdcabrera/apidoc-mock), or build your own from the `Containerfile` provided in the repo.
>
> Using a legacy image obviously comes with limitations, and in some cases historical benefits, like restored [served apidoc](https://apidocjs.com/) functionality.
> You'll need to review our [CHANGELOG.md](./CHANGELOG.md) for missing and available features by release version.  

- [Podman Desktop has an installation break down](https://podman-desktop.io/docs/installation)
- [Docker has an image build and container run guide](https://docs.docker.com/get-started/)

##### Using Podman, Docker directly
> The repo [Containerfile](./Containerfile) contains a volume you can use to reference local files to generate mocks via `apidoc-mock`.
>
> Watching files by a volume with `Docker` is pretty straight forward just use option `-v "[LOCAL_DIRECTORY_PATH]:/app/data"`.
> For `podman` you can use the same `-v` option, however it can be a little tricky, especially on `macOS`, and lead to file
> updates not refreshing the generated mocks from `apidoc-mock`.

1. First, download the repository
   ```
   $ git clone https://github.com/cdcabrera/apidoc-mock.git
   ```
   
   or just use the ["code/Download zip"](https://github.com/cdcabrera/apidoc-mock) GitHub provides

1. Confirm `Docker`, or `Podman`, is running
1. Next, open a terminal up and `$ cd` into `apidoc-mock`
1. Then, build the image
   ```shell
   $ podman build -t apidoc-mock .
   ```
   or
   ```shell
   $ docker build --file Containerfile -t apidoc-mock .
   ```
1. Then, run the container
   ```shell
   $ podman run --rm -p 8000:8000 --tls-verify=false --name mock-api apidoc-mock
   ```
   or
   ```shell
   $ docker run --rm -p 8000:8000 --name mock-api apidoc-mock
   ```
1. Finally, you should be able to open the example api, http://127.0.0.1:8000/hello/world/demo
   - To stop everything type...
      ```shell
      $ podman stop mock-api
      ```
      or
      ```shell
      $ docker stop mock-api
      ```

## Contributing
Contributing? Guidelines can be found here [CONTRIBUTING.md](./CONTRIBUTING.md).
