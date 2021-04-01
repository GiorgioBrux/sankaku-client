<h1 align="center">sankaku-client</h1>
<p>
  <a href="https://www.npmjs.com/package/sankaku-client" target="_blank">
    <img alt="npm" src="https://img.shields.io/npm/v/sankaku-client" />
  </a> 
  <img src="https://img.shields.io/badge/node-%3E%3D14-blue.svg" />
  <a href="https://semver.org/lang/it/" target="_blank">
    <img alt="Semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" />
  </a>  
  <a href="https://github.com/GiorgioBrux/sankaku-client/wiki" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/GiorgioBrux/sankaku-client/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/GiorgioBrux/sankaku-client/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/GiorgioBrux/sankaku-client" />
  </a>
</p>

> Unofficial Sankaku beta api client, with account support.

## Prerequisites

- node >=14

## Install

```sh
npm install sankaku-client
```

## Example

```js
const {Client} = require('sankaku-client')

let client = Client();
client.searchSubmissions({limit: 1, order_by: 'random'})
    .then((r) => {console.log(r[0])})
```    
For full documentation, check [the wiki](https://google.com).

## Todo
- Upload method
- Add comment method

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/GiorgioBrux/sankaku-client/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2021 [GiorgioBrux](https://github.com/GiorgioBrux).<br />
This project is [MIT](https://github.com/GiorgioBrux/sankaku-client/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
