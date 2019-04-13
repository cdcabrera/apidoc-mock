# Contributing

## Commits
For consistency we make use of [Conventional Commits](https://www.conventionalcommits.org). It's encouraged that 
commit messaging follow the format
  ```
  <type>[optional scope]: <description>
  ```

### Build Requirements
To setup your work environment you'll need to use
 * [NodeJS version 10+](https://nodejs.org/)
 * [Yarn 1.13+](https://yarnpkg.com)
 * And if you plan on making Docker contributions you may want to setup
    - [Docker](https://docs.docker.com/engine/installation/)
    
### Developing
To start work
  ```shell
  $ yarn
  $ yarn start:dev
  ```

#### Testing during development
Jest is used for the unit test framework. To run unit tests during development open a terminal instance and run
  ```shell
  $ yarn test:dev
  ```

This should also let you update the code snapshots.

### Code Coverage
The requirements for code coverage are currently maintained around the `60%` to `70%` mark.

Updates that drop coverage below the current threshold should have their coverage expanded before being merged. 

Settings for coverage can be found in [package.json](./package.json)

#### To check test coverage
  ```shell
  $ yarn test
  ```

#### Code coverage failing to update?
If you're having trouble getting an accurate code coverage report, or it's failing to provide updated results (i.e. you renamed files) you can try running
  ```
  $ yarn test:clearCache
  ```
