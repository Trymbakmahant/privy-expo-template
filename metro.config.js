const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const joseBrowserDir = path.resolve(projectRoot, 'node_modules/jose/dist/browser');
const joseBrowserEntry = path.join(joseBrowserDir, 'index.js');

const remapJose = (moduleName) => {
  if (moduleName === 'jose') {
    return joseBrowserEntry;
  }

  const nodeEsmPrefix = 'jose/dist/node/esm';
  const nodeCjsPrefix = 'jose/dist/node/cjs';

  if (moduleName.startsWith(nodeEsmPrefix)) {
    const relativePath = moduleName.replace(nodeEsmPrefix, '');
    return path.join(joseBrowserDir, relativePath || '/index.js');
  }

  if (moduleName.startsWith(nodeCjsPrefix)) {
    const relativePath = moduleName.replace(nodeCjsPrefix, '');
    return path.join(joseBrowserDir, relativePath || '/index.js');
  }

  return null;
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const remappedPath = remapJose(moduleName);
  if (remappedPath) {
    return {
      type: 'sourceFile',
      filePath: remappedPath,
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return resolve(context, moduleName, platform);
};

config.resolver.alias = {
  ...(config.resolver.alias || {}),
  jose: joseBrowserEntry,
};

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  jose: joseBrowserEntry,
};

module.exports = config;

