## [4.2.2](https://github.com/mostafazke/ng-whiteboard/compare/v4.2.1...v4.2.2) (2025-08-25)


### Bug Fixes

* upgrade firebase from 11.5.0 to 11.6.0 ([e3b7262](https://github.com/mostafazke/ng-whiteboard/commit/e3b7262980e75b09ab5c3d31784853e84c490bff))

## [4.2.1](https://github.com/mostafazke/ng-whiteboard/compare/v4.2.0...v4.2.1) (2025-05-07)


### Bug Fixes

* **whiteboard:** 🐛 resolve SVG Attributes NaN value ([56a2c85](https://github.com/mostafazke/ng-whiteboard/commit/56a2c8528ac26b88d52c303daf94ee0cfea6fbc3))

# [4.2.0](https://github.com/mostafazke/ng-whiteboard/compare/v4.1.0...v4.2.0) (2025-04-26)


### Bug Fixes

* upgrade firebase from 11.1.0 to 11.5.0 ([0406c3d](https://github.com/mostafazke/ng-whiteboard/commit/0406c3de11f177c38a8983432220fd597aee473a))


### Features

* **whiteboard:** 🎸 add multi-selection support ([0cb9568](https://github.com/mostafazke/ng-whiteboard/commit/0cb9568433177d0f5ddbfba33423072e7d583c7d))

# [4.1.0](https://github.com/mostafazke/ng-whiteboard/compare/v4.0.2...v4.1.0) (2025-04-03)


### Features

* **whiteboard:** 🎸 implement multiple erase on move ([cb5529a](https://github.com/mostafazke/ng-whiteboard/commit/cb5529a869d9c5f172e94b2600487b404874bc47)), closes [#130](https://github.com/mostafazke/ng-whiteboard/issues/130)

## [4.0.2](https://github.com/mostafazke/ng-whiteboard/compare/v4.0.1...v4.0.2) (2025-03-21)

### Bug Fixes

- **deps:** add allowedNonPeerDependencies for perfect-freehand ([f5d28fd](https://github.com/mostafazke/ng-whiteboard/commit/f5d28fd87c0a073694148acc5af4c1cb7b390f04))
- **deps:** add perfect-freehand to allowedNonPeerDependencies ([5c447ca](https://github.com/mostafazke/ng-whiteboard/commit/5c447ca37eee47c16a523ca3754e41626ee245e7))
- **deps:** fix perfect-freehand to allowedNonPeerDependencies ([c54920d](https://github.com/mostafazke/ng-whiteboard/commit/c54920dbe644c4252f686b5114038e38863f5be3))
- **whiteboard:** 🐛 update Angular peer dependencies ([4225955](https://github.com/mostafazke/ng-whiteboard/commit/42259555ed228d42049195de1f90cec23099f5e3))

## [4.0.1](https://github.com/mostafazke/ng-whiteboard/compare/v4.0.0...v4.0.1) (2025-03-14)

### Bug Fixes

- **whiteboard:** 🐛 enable undo for elements addition ([e26baa0](https://github.com/mostafazke/ng-whiteboard/commit/e26baa0dccb4eb3a1ae4b76e30cde60e3d27b8d4))

# [4.0.0](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.6...v4.0.0) (2025-03-14)

### Bug Fixes

- **deps:** move rxjs to peerDependencies ([b51c24e](https://github.com/mostafazke/ng-whiteboard/commit/b51c24ed6e4cd5e48cf99c6a301ce1c7fdad782e))
- **deps:** update version adjustment scripts to use replace-json-property ([7fba81e](https://github.com/mostafazke/ng-whiteboard/commit/7fba81e42a7475e830db0770f516d1bf9034f267))

### Code Refactoring

- **whiteboard:** 💡 modularize ng-whiteboard by extracting logic into services and classes ([637351b](https://github.com/mostafazke/ng-whiteboard/commit/637351b5b11930a0a511ac992a2001836e40ed19))

### Features

- **core:** 🎸 adds angular 17 support ([d08fd12](https://github.com/mostafazke/ng-whiteboard/commit/d08fd12d7fa34ae5bd04a4aa043e849afd5f61be))
- **whiteboard:** 🎸 centralize data management in DataService ([993facf](https://github.com/mostafazke/ng-whiteboard/commit/993facf20ee59f5abbe47690b522066deece6086))

### BREAKING CHANGES

- **whiteboard:** Some internal APIs and component structure have changed.
- **whiteboard:** 🧨 Data management is now handled through DataService
- **core:** 🧨 minimum required angular version is 17.0.0

## [3.2.6](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.5...v3.2.6) (2025-03-08)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([860571e](https://github.com/mostafazke/ng-whiteboard/commit/860571e9c21dde31e711f5b734ea1d5d5466eac5))

## [3.2.5](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.4...v3.2.5) (2025-02-22)

### Bug Fixes

- upgrade highlight.js from 11.10.0 to 11.11.1 ([745ad18](https://github.com/mostafazke/ng-whiteboard/commit/745ad18624ddf30313f83604e9fd0f320e56bfb3))

## [3.2.4](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.3...v3.2.4) (2025-02-19)

### Bug Fixes

- **whiteboard:** 🐛 allow drawing with left click only ([0676ec6](https://github.com/mostafazke/ng-whiteboard/commit/0676ec6d120d994d59cba4664029fae177e514b3)), closes [#263](https://github.com/mostafazke/ng-whiteboard/issues/263)

## [3.2.3](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.2...v3.2.3) (2025-02-16)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([cf80c4c](https://github.com/mostafazke/ng-whiteboard/commit/cf80c4ceaf93a19c6cace9176577e30feafbae89))
- package.json & yarn.lock to reduce vulnerabilities ([fcd5cb4](https://github.com/mostafazke/ng-whiteboard/commit/fcd5cb4af77ef1ea56b62c5b8d6b5f3eaf992215))

## [3.2.2](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.1...v3.2.2) (2025-02-16)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([ac693e2](https://github.com/mostafazke/ng-whiteboard/commit/ac693e27719735d881a140c7802d1bc1f36330fb))

## [3.2.1](https://github.com/mostafazke/ng-whiteboard/compare/v3.2.0...v3.2.1) (2025-02-12)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([8b75f32](https://github.com/mostafazke/ng-whiteboard/commit/8b75f328b471cd5db288097f0dd37535fc3f1155))
- package.json & yarn.lock to reduce vulnerabilities ([48accea](https://github.com/mostafazke/ng-whiteboard/commit/48accea7f2c7a4c7ab6a8e9f26131943ca9fe0e9))
- package.json & yarn.lock to reduce vulnerabilities ([322db7f](https://github.com/mostafazke/ng-whiteboard/commit/322db7f89ab4307479ce6dd4bb695d922bc8065c))
- package.json & yarn.lock to reduce vulnerabilities ([4732834](https://github.com/mostafazke/ng-whiteboard/commit/47328349a01f0052d39b03f08ae5d9c805c7218c))
- package.json & yarn.lock to reduce vulnerabilities ([a12d1e6](https://github.com/mostafazke/ng-whiteboard/commit/a12d1e66874d395cff950b0d73b166c89c438b50))

# [3.2.0](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.6...v3.2.0) (2025-01-30)

### Features

- **whiteboard:** 🎸 implement hand tool ([69e8e12](https://github.com/mostafazke/ng-whiteboard/commit/69e8e126d6d5e72b1ec4ee37b5429f16d9d645fd))

## [3.1.6](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.5...v3.1.6) (2025-01-03)

### Bug Fixes

- **demo:** fix the style of dropdown in basic example ([045f086](https://github.com/mostafazke/ng-whiteboard/commit/045f086087fe6f61032cdbbe20dc06744c72c230))

## [3.1.5](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.4...v3.1.5) (2025-01-02)

### Bug Fixes

- upgrade @nx/angular from 20.2.0 to 20.2.1 ([9f1886a](https://github.com/mostafazke/ng-whiteboard/commit/9f1886a4f1a6c261357e8b4212c299362b2fc334))

## [3.1.4](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.3...v3.1.4) (2024-12-15)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([9dbda4d](https://github.com/mostafazke/ng-whiteboard/commit/9dbda4dc23231eb99642a52eb2cf5be99b92c52b))

## [3.1.3](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.2...v3.1.3) (2024-11-13)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([651db31](https://github.com/mostafazke/ng-whiteboard/commit/651db3190b09039529b9eb1472258f800470fe24))
- upgrade tslib from 2.7.0 to 2.8.0 ([a611a2f](https://github.com/mostafazke/ng-whiteboard/commit/a611a2f918d27e2bc93aad44c6c11c398d522ac3))

## [3.1.2](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.1...v3.1.2) (2024-11-01)

### Bug Fixes

- upgrade @nx/angular from 19.8.2 to 19.8.4 ([e6fc18f](https://github.com/mostafazke/ng-whiteboard/commit/e6fc18f7cfcd538dae11fd5f05fe97ddb6426ee3))

## [3.1.1](https://github.com/mostafazke/ng-whiteboard/compare/v3.1.0...v3.1.1) (2024-10-26)

### Bug Fixes

- upgrade @nx/angular from 19.6.0 to 19.8.2 ([3c0ef85](https://github.com/mostafazke/ng-whiteboard/commit/3c0ef859a5da941e7c9aab439ea89d0cd5615b4e))

# [3.1.0](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.8...v3.1.0) (2024-10-11)

### Features

- **whiteboard:** 🎸 add arrow shape ([420e4f4](https://github.com/mostafazke/ng-whiteboard/commit/420e4f48693a99af390d7e0c5e4d9c074cbba97e))
- **whiteboard:** 🎸 add arrow shape ([8247ed8](https://github.com/mostafazke/ng-whiteboard/commit/8247ed88b5228ae78893cd3a58e6bf781e15fd8d))

## [3.0.8](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.7...v3.0.8) (2024-09-13)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([b569839](https://github.com/mostafazke/ng-whiteboard/commit/b569839762ea249569f59c4b54115f458055d8c5))
- upgrade zone.js from 0.14.10 to 0.15.0 ([bdf1c6d](https://github.com/mostafazke/ng-whiteboard/commit/bdf1c6d3d43d0578220a5d46a313a3541509432f))

## [3.0.7](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.6...v3.0.7) (2024-08-26)

### Bug Fixes

- upgrade firebase from 10.12.2 to 10.12.5 ([2d2a92e](https://github.com/mostafazke/ng-whiteboard/commit/2d2a92e3b49b386929fdfd3ada7318b9c156c0ca))
- upgrade zone.js from 0.14.7 to 0.14.8 ([ec76f08](https://github.com/mostafazke/ng-whiteboard/commit/ec76f088caa86c8299fc9a56e252215aab141a4c))

## [3.0.6](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.5...v3.0.6) (2024-08-24)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([9b4a36a](https://github.com/mostafazke/ng-whiteboard/commit/9b4a36af840f4c3c3a0d4642341f60ba5b53cff4))
- upgrade ngx-colors from 3.5.2 to 3.6.0 ([c6a6e4b](https://github.com/mostafazke/ng-whiteboard/commit/c6a6e4b98d8c58018f2346ddffe9a29027ffeb35))
- upgrade zone.js from 0.14.5 to 0.14.6 ([c07dead](https://github.com/mostafazke/ng-whiteboard/commit/c07dead7f1b5f9759e56789ed7c33a87a3e61c04))

## [3.0.5](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.4...v3.0.5) (2024-05-18)

### Bug Fixes

- upgrade zone.js from 0.14.0 to 0.14.4 ([71a8cf9](https://github.com/mostafazke/ng-whiteboard/commit/71a8cf9687b7bd23226960fe10963075ca89d412))

## [3.0.4](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.3...v3.0.4) (2024-05-03)

### Bug Fixes

- upgrade perfect-freehand from 1.2.0 to 1.2.2 ([7f63166](https://github.com/mostafazke/ng-whiteboard/commit/7f63166e87c2e89c23e4c372b6683b5ed9fce104))

## [3.0.3](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.2...v3.0.3) (2023-12-14)

### Bug Fixes

- **whiteboard:** prevent touch from scrolling ([d0d1ce5](https://github.com/mostafazke/ng-whiteboard/commit/d0d1ce516c69e9bc3fdd5463b9f4508766020455))

## [3.0.2](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.1...v3.0.2) (2023-10-16)

### Bug Fixes

- upgrade @nx/angular from 16.8.1 to 16.9.0 ([6fb9728](https://github.com/mostafazke/ng-whiteboard/commit/6fb9728289c2d11fcad362c07e94625d1675c043))

## [3.0.1](https://github.com/mostafazke/ng-whiteboard/compare/v3.0.0...v3.0.1) (2023-10-12)

### Bug Fixes

- upgrade zone.js from 0.13.3 to 0.14.0 ([6a99f6a](https://github.com/mostafazke/ng-whiteboard/commit/6a99f6ac04181c9c29048986a1093f887b54b13c))

# [3.0.0](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.22...v3.0.0) (2023-10-11)

### Bug Fixes

- upgrade @nx/angular from 16.7.4 to 16.8.1 ([b73f175](https://github.com/mostafazke/ng-whiteboard/commit/b73f175813ddc82a41f152f21092f1ca9a1580ec))

### Features

- **whiteboard:** 🎸 Update dependencies and enhance SVG handling ([ba25405](https://github.com/mostafazke/ng-whiteboard/commit/ba254053320a9e869e1b2803260b4c208437b757))

### BREAKING CHANGES

- **whiteboard:** 🧨Adjustments made to dependencies and SVG handling

## [2.0.22](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.21...v2.0.22) (2023-09-28)

### Bug Fixes

- upgrade multiple dependencies with Snyk ([be6134f](https://github.com/mostafazke/ng-whiteboard/commit/be6134f63bd8352dadbc3132e1125905a89b2841))

## [2.0.21](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.20...v2.0.21) (2023-09-27)

### Bug Fixes

- upgrade @nx/angular from 16.5.1 to 16.7.4 ([47addad](https://github.com/mostafazke/ng-whiteboard/commit/47addad49fc487142f7cd61a6a6d58e727dbe14c))
- upgrade tslib from 2.6.1 to 2.6.2 ([5c7dc25](https://github.com/mostafazke/ng-whiteboard/commit/5c7dc250e95f72cf5fcc3cc69d12108adef4e074))

## [2.0.20](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.19...v2.0.20) (2023-09-21)

### Bug Fixes

- upgrade @nx/angular from 16.5.0 to 16.5.1 ([b562af6](https://github.com/mostafazke/ng-whiteboard/commit/b562af6b87268cbee2b555ed973368439c07a075))
- upgrade tslib from 2.6.0 to 2.6.1 ([8259e47](https://github.com/mostafazke/ng-whiteboard/commit/8259e47b05b7a33ee81ecb0943cdf55008106068))

## [2.0.19](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.18...v2.0.19) (2023-07-29)

### Bug Fixes

- upgrade @nx/angular from 16.3.2 to 16.5.0 ([8109339](https://github.com/mostafazke/ng-whiteboard/commit/8109339fd5bcdb9d4991c08307971300326c50dc))
- upgrade firebase from 9.22.1 to 9.23.0 ([a55062d](https://github.com/mostafazke/ng-whiteboard/commit/a55062dc7d67080a224c4c049ef3126b0c91cdda))

## [2.0.18](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.17...v2.0.18) (2023-07-27)

### Bug Fixes

- upgrade tslib from 2.5.3 to 2.6.0 ([1458a26](https://github.com/mostafazke/ng-whiteboard/commit/1458a26035085ea8634dfca12229a3249368f1d1))

## [2.0.17](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.16...v2.0.17) (2023-06-06)

## [2.0.16](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.15...v2.0.16) (2023-03-17)

### Bug Fixes

- remove unused dependencies ([3610d59](https://github.com/mostafazke/ng-whiteboard/commit/3610d59bf780f8a42550aaa8a4a4346bc7654249))
- upgrade @nrwl/angular from 15.2.1 to 15.7.2 ([0b7586a](https://github.com/mostafazke/ng-whiteboard/commit/0b7586a221ff4745f177eaec5e5fac8ff2053258))

## [2.0.15](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.14...v2.0.15) (2023-03-15)

### Bug Fixes

- **whiteboard:** fix text input position ([28ef7b0](https://github.com/mostafazke/ng-whiteboard/commit/28ef7b04a6b984ec7c238cafcf9ab37ffa16f729))

## [2.0.14](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.13...v2.0.14) (2023-02-22)

### Bug Fixes

- upgrade ngx-colors from 3.1.4 to 3.2.0 ([32fbfa4](https://github.com/mostafazke/ng-whiteboard/commit/32fbfa473a6b4861a7fa9f2a2b2c7bbe9691d3d0))

## [2.0.13](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.12...v2.0.13) (2023-02-17)

### Bug Fixes

- upgrade tslib from 2.4.1 to 2.5.0 ([e974f9f](https://github.com/mostafazke/ng-whiteboard/commit/e974f9fd1b44980d1f953e7fb4a7b0d74659378f))

## [2.0.12](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.11...v2.0.12) (2023-02-15)

### Bug Fixes

- upgrade firebase from 9.14.0 to 9.16.0 ([b729f23](https://github.com/mostafazke/ng-whiteboard/commit/b729f230d8b1079fd96f7a9d4652c1d0d913be9c))
- upgrade rxjs from 7.5.7 to 7.8.0 ([4610c32](https://github.com/mostafazke/ng-whiteboard/commit/4610c32b55fa0ab8876156263d980f6f66482811))

## [2.0.11](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.10...v2.0.11) (2023-02-13)

### Bug Fixes

- upgrade @nrwl/angular from 15.0.11 to 15.2.1 ([ae047f7](https://github.com/mostafazke/ng-whiteboard/commit/ae047f7b21b5246eee5b1f0471fd319100f0e36e))
- upgrade highlight.js from 11.6.0 to 11.7.0 ([85d2513](https://github.com/mostafazke/ng-whiteboard/commit/85d25130f8d80d6cd7b713a37fc3ca25b37b78a8))
- upgrade ngx-toastr from 15.2.1 to 15.2.2 ([f6fa47a](https://github.com/mostafazke/ng-whiteboard/commit/f6fa47a88715144ff0fd56ca0b72d60718868863))

## [2.0.10](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.9...v2.0.10) (2022-12-14)

### Bug Fixes

- upgrade firebase from 9.13.0 to 9.14.0 ([5b3be9e](https://github.com/mostafazke/ng-whiteboard/commit/5b3be9e275488ce2fed8ee18e7bbfafba7544f60))
- upgrade multiple dependencies with Snyk ([b2ce68a](https://github.com/mostafazke/ng-whiteboard/commit/b2ce68a37cbb03c6f2b699d623d132b7809eddf9))
- upgrade tslib from 2.4.0 to 2.4.1 ([dbacca2](https://github.com/mostafazke/ng-whiteboard/commit/dbacca27d582b7f4bd3a7f87d1f99d2738835916))

## [2.0.9](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.8...v2.0.9) (2022-11-17)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([7f28037](https://github.com/mostafazke/ng-whiteboard/commit/7f280377890b85e5eecbbf64f954285a95ca0fc3))
- upgrade firebase from 9.11.0 to 9.12.1 ([adfe711](https://github.com/mostafazke/ng-whiteboard/commit/adfe711bff0d82efe32c9de6f05d3077b8ba287b))

## [2.0.8](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.7...v2.0.8) (2022-10-20)

### Bug Fixes

- upgrade ngx-toastr from 15.0.0 to 15.1.0 ([42c30aa](https://github.com/mostafazke/ng-whiteboard/commit/42c30aa413b36363738202ceb5680f793ec2dcb7))

## [2.0.7](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.6...v2.0.7) (2022-10-18)

### Bug Fixes

- upgrade rxjs from 7.5.6 to 7.5.7 ([5e1d588](https://github.com/mostafazke/ng-whiteboard/commit/5e1d58800e3c253cbad4298b314825a5fbd2bacb))

## [2.0.6](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.5...v2.0.6) (2022-10-16)

### Bug Fixes

- upgrade @nrwl/angular from 14.5.4 to 14.7.5 ([612cfc5](https://github.com/mostafazke/ng-whiteboard/commit/612cfc5e9f31d7cd5bf83ec29958528bdeb95d34))
- upgrade @nrwl/angular from 14.7.5 to 14.7.6 ([7847884](https://github.com/mostafazke/ng-whiteboard/commit/78478840d923c1118b23112b60c23e34582d8a4a))
- upgrade @nrwl/angular from 14.7.6 to 14.7.8 ([b3c9386](https://github.com/mostafazke/ng-whiteboard/commit/b3c9386f8cb049451d0d108b7c52e067a8f3f275))
- upgrade firebase from 9.9.4 to 9.10.0 ([1f72df8](https://github.com/mostafazke/ng-whiteboard/commit/1f72df84d5d48050429e8395ed5d40837368a599))
- upgrade ngx-colors from 3.1.2 to 3.1.3 ([6d4969d](https://github.com/mostafazke/ng-whiteboard/commit/6d4969d85ce59dd7827e189c1a7bde2b662f8d22))

## [2.0.5](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.4...v2.0.5) (2022-09-11)

### Bug Fixes

- upgrade @nrwl/angular from 14.5.2 to 14.5.4 ([41627b8](https://github.com/mostafazke/ng-whiteboard/commit/41627b8e39aabf0fb7785d5532e3aa68a0a7372f))
- upgrade firebase from 9.9.2 to 9.9.3 ([8401caa](https://github.com/mostafazke/ng-whiteboard/commit/8401caa56abcad1565dabba39b914e87fa7d7235))

## [2.0.4](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.3...v2.0.4) (2022-08-24)

### Bug Fixes

- upgrade @nrwl/angular from 14.5.1 to 14.5.2 ([914549a](https://github.com/mostafazke/ng-whiteboard/commit/914549a6b07f883dbbf57b13a4ce1973ee55d2ef))

## [2.0.3](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.2...v2.0.3) (2022-08-22)

### Bug Fixes

- upgrade @nrwl/angular from 14.4.0 to 14.5.1 ([19621e4](https://github.com/mostafazke/ng-whiteboard/commit/19621e4ce2648249873e9ce3cb07cd082576bdac))

## [2.0.2](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.1...v2.0.2) (2022-08-18)

### Bug Fixes

- **whiteboard:** 🐛 update peer dependencies ([65d064c](https://github.com/mostafazke/ng-whiteboard/commit/65d064cad3eb464b3506004f43625fd8a513f2e6))

## [2.0.1](https://github.com/mostafazke/ng-whiteboard/compare/v2.0.0...v2.0.1) (2022-08-18)

### Bug Fixes

- package.json & yarn.lock to reduce vulnerabilities ([3aed03f](https://github.com/mostafazke/ng-whiteboard/commit/3aed03f83c64e86135e6e8c7d76b58526a23bf85))

# [2.0.0](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.7...v2.0.0) (2022-08-14)

### Bug Fixes

- upgrade @nrwl/angular from 14.4.0 to 14.4.1 ([d8cb847](https://github.com/mostafazke/ng-whiteboard/commit/d8cb847c8b822a0a84176cf0594291728a0ec85e))
- upgrade multiple dependencies with Snyk ([f05a748](https://github.com/mostafazke/ng-whiteboard/commit/f05a7485f37af04ea18d310cf9db8e9f7dec332e))
- upgrade zone.js from 0.11.6 to 0.11.7 ([cadb375](https://github.com/mostafazke/ng-whiteboard/commit/cadb3755ba0bfa1c772429b751446ed1dffb672e))

### Documentation

- **demo:** ✏️ Add new documentation ([ca8d2a7](https://github.com/mostafazke/ng-whiteboard/commit/ca8d2a742c06ac8e84f36a1731800beaff9c0ef0))

### Features

- **whiteboard:** 🎸 add elements types ([70358e2](https://github.com/mostafazke/ng-whiteboard/commit/70358e25010ab7b739bd4ef2a8fd8407ccbbbdff))

### BREAKING CHANGES

- **demo:** 🧨 Another version of documantation
- **whiteboard:** 🧨 Add new options

## [1.5.7](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.6...v1.5.7) (2022-07-23)

## [1.5.6](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.5...v1.5.6) (2022-07-23)

## [1.5.5](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.4...v1.5.5) (2022-07-23)

## [1.5.4](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.3...v1.5.4) (2022-07-23)

## [1.5.3](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.2...v1.5.3) (2022-07-23)

### Bug Fixes

- upgrade @nrwl/angular from 14.3.6 to 14.4.0 ([a4518bb](https://github.com/mostafazke/ng-whiteboard/commit/a4518bb73d6a5cbba8600323a13b72b3fd8394b9))
- upgrade rxjs from 7.4.0 to 7.5.5 ([e86f418](https://github.com/mostafazke/ng-whiteboard/commit/e86f418ef45b3de715cac977eb95134b7f1fba83))

## [1.5.2](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.1...v1.5.2) (2022-07-16)

## [1.5.1](https://github.com/mostafazke/ng-whiteboard/compare/v1.5.0...v1.5.1) (2022-07-16)

## [1.3.2](https://github.com/mostafazke/ng-whiteboard/compare/v1.3.1...v1.3.2) (2020-01-17)

### Performance Improvements

- **package.json:** update all dependancies ([77c71b5](https://github.com/mostafazke/ng-whiteboard/commit/77c71b52fbf900b5f6a8cd7bd164f68646dec591))

## [1.3.1](https://github.com/mostafazke/ng-whiteboard/compare/v1.3.0...v1.3.1) (2020-01-11)

### Bug Fixes

- **dependancies:** fix vulnerabilies ([2b8dca4](https://github.com/mostafazke/ng-whiteboard/commit/2b8dca435441c44afdc42e125764f1652c9727c6))

# [1.3.0](https://github.com/mostafazke/ng-whiteboard/compare/v1.2.2...v1.3.0) (2020-01-11)

### Features

- **whiteboard:** add (undo-redo) feature ([47c64bf](https://github.com/mostafazke/ng-whiteboard/commit/47c64bf47be15b214e3f0952a6a504576e40f773))

## [1.2.2](https://github.com/mostafazke/ng-whiteboard/compare/v1.2.1...v1.2.2) (2019-09-13)

### Bug Fixes

- **bg-image:** fit bg-image to board ([92a915d](https://github.com/mostafazke/ng-whiteboard/commit/92a915d))
- **whiteboard:** remove unused dependencies ([370a8b5](https://github.com/mostafazke/ng-whiteboard/commit/370a8b5))

## [1.2.1](https://github.com/mostafazke/ng-whiteboard/compare/v1.2.0...v1.2.1) (2019-08-21)

### Bug Fixes

- **demo:** change demo title ([299e934](https://github.com/mostafazke/ng-whiteboard/commit/299e934))

# [1.2.0](https://github.com/mostafazke/ng-whiteboard/compare/v1.1.0...v1.2.0) (2019-08-19)

### Features

- **whitboard:** add background image input ([0b73b5b](https://github.com/mostafazke/ng-whiteboard/commit/0b73b5b))

# [1.1.0](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.5...v1.1.0) (2019-08-18)

### Features

- **whiteboard:** add backgroundColor option ([6d95789](https://github.com/mostafazke/ng-whiteboard/commit/6d95789))

## [1.0.5](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.4...v1.0.5) (2019-08-18)

### Bug Fixes

- **public:** add dependencies ([b38ae25](https://github.com/mostafazke/ng-whiteboard/commit/b38ae25))

## [1.0.4](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.3...v1.0.4) (2019-08-18)

### Bug Fixes

- **packages:** fix third party libs imports ([0f8ea17](https://github.com/mostafazke/ng-whiteboard/commit/0f8ea17))

## [1.0.3](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.2...v1.0.3) (2019-08-18)

### Bug Fixes

- **dependencies:** white list Dependencies ([b2c64aa](https://github.com/mostafazke/ng-whiteboard/commit/b2c64aa))

## [1.0.2](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.1...v1.0.2) (2019-08-18)

### Bug Fixes

- **dependencies:** add meta info ([488ff4a](https://github.com/mostafazke/ng-whiteboard/commit/488ff4a))
- **ng-whiteboard:** fix in dependencies ([5b8fe6f](https://github.com/mostafazke/ng-whiteboard/commit/5b8fe6f))

## [1.0.1](https://github.com/mostafazke/ng-whiteboard/compare/v1.0.0...v1.0.1) (2019-08-18)

### Bug Fixes

- **package:** add peer dependencies ([2df6984](https://github.com/mostafazke/ng-whiteboard/commit/2df6984))

# 1.0.0 (2019-08-17)

### Bug Fixes

- **app:** fix variable name ([225a3cb](https://github.com/mostafazke/ng-whiteboard/commit/225a3cb))
- **public:** remove commands ([0db9889](https://github.com/mostafazke/ng-whiteboard/commit/0db9889))
- **public:** remove commands ([2d1e861](https://github.com/mostafazke/ng-whiteboard/commit/2d1e861))
- **travis:** fix travis ci node version ([f7a9d94](https://github.com/mostafazke/ng-whiteboard/commit/f7a9d94))
- **travis:** fix travis ci node version ([4d2e27c](https://github.com/mostafazke/ng-whiteboard/commit/4d2e27c))
