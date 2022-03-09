# Change Log

All notable changes to the "vscode-testcomplete" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.7]
- Fix missing testcomplete-ts-api submodule in the VSIX package

## [0.0.6]
- Proper handling of property paths with multiple periods (https://github.com/deitry/vscode-testcomplete/issues/2)

## [0.0.5]
- testcomplete-ts-api update
- Introduce `testcomplete.castMappedItemsToKnownTypes` configuration option.
It is set to true by default and enables automatic UI Element type casting to known values.
It helps to support custom type names like `MainWindow`, which will be treated just like `Window`, `MyCustomButton` as just `Button` etc.
If false, generated name mappings `.d.ts` may contain invalid object types.

## [0.0.4]
- Update TestComplete API submodule
- Update existing `tsconfig.json`/`jsconfig.json` instead of replacing.
Also, update extension path in `json`s on extension activation

## [0.0.3]
- Fix project-related modules generation command

## [0.0.2]
- Fix API bundling

## [0.0.1]
- Initial release
