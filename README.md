<div align="center">
  <h1>🎯 Sankaku Client</h1>
  
  <p>Unofficial Sankaku Beta API Client with Account Support</p>

  <div align="center">
    <a href="https://www.npmjs.com/package/sankaku-client">
      <img src="https://img.shields.io/npm/v/sankaku-client?style=for-the-badge" alt="npm version" />
    </a>
    <img src="https://img.shields.io/badge/node-%3E%3D14-blue?style=for-the-badge" alt="node version" />
    <a href="https://github.com/semantic-release/semantic-release">
      <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079?style=for-the-badge" alt="semantic-release" />
    </a>
  </div>

  <div align="center">
    <a href="https://github.com/GiorgioBrux/sankaku-client/wiki">
      <img src="https://img.shields.io/badge/documentation-yes-brightgreen?style=for-the-badge" alt="documentation" />
    </a>
    <a href="https://github.com/GiorgioBrux/sankaku-client/graphs/commit-activity">
      <img src="https://img.shields.io/badge/Maintained%3F-yes-green?style=for-the-badge" alt="maintenance" />
    </a>
    <a href="https://github.com/GiorgioBrux/sankaku-client/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/GiorgioBrux/sankaku-client?style=for-the-badge" alt="license" />
    </a>
  </div>
</div>

## 🚀 Quick Start

### Prerequisites

- Node.js >=14

### Installation
```bash
# use npm or your preferred package manager like bun!
npm install sankaku-client
```

### Example usage
```javascript
import Client from 'sankaku-client';

const client = new Client();

client.searchSubmissions({
  limit: 1,
  order_by: 'random'
})
.then((response) => {
  console.log(response[0]);
});
```


For comprehensive documentation, please visit our [Wiki](https://github.com/GiorgioBrux/sankaku-client/wiki).

## 🗺️ Roadmap

- [ ] Upload functionality
- [ ] Comment system implementation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- Check out our [issues page](https://github.com/GiorgioBrux/sankaku-client/issues)
- Submit bug reports or feature requests
- Create pull requests
- Improve documentation

## ⭐ Support

If you find this project useful, please consider giving it a star on GitHub! It helps others discover this project.

## 📝 License

Copyright © 2021-2024 [GiorgioBrux](https://github.com/GiorgioBrux)

This project is licensed under the [MIT License](https://github.com/GiorgioBrux/sankaku-client/blob/master/LICENSE).
