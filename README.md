[![npm version](https://badge.fury.io/js/npm-uninstall.svg)](https://npmjs.org/package/npm-uninstall 'View this project on npm')

# npm-uninstall 🗑


## What

A simple tool that lists your npm dependencies and runs `npm uninstall` on the packages you'd like to uninstall


## Usage

```bash
npm-uninstall
```

## Installation

This CLI requires Node 8.10.0 or higher.

```bash
npm install -g npm-uninstall
```

or simply

```bash
npx npm-uninstall
```

## HOW

1. Looks for `package.json` in the current directory
    - Walks a maximum of 10 directories up until it finds `package.json`. Exits if not found.
2. Provides a keyboard navigable list of dependencies to run
3. Choose the dependencies you'd like to delete and press the `Enter` key
4. Done 🎉
