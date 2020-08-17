# TestComplete API in VS Code

Unofficial VS Code extension that allows to combine TestComplete API for JavaScript projects with type check provided by JSDoc + TypeScript.

Base TestComplete API is provided by [this repo](https://github.com/deitry/testcomplete-ts-api) which is bundled with extension.
Project-related modules are generated on the run into `.vscode/.tc/<ProjectName>/` folder.
This extension is a mere wrapper that simplifies configuration and runs code generation automatically.

If you want to have flexible control over paths and modules, consider to directely use TypeScript API from base repo.
Note that extension uses slightly different TypeScript-based code generation for project-related modules so results may differ from Python-based generators in base repo.

## How to use

Run from Command palette:

```
> TestComplete: Initialize support
```

This will generate `jsconfig.json` under `Script/` folder along with project-related modules.
This file contains paths to modules used for type check.

Then you may run:

```
> TestComplete: Generate project-related modules
```

This will only generate project-related modules without touching `jsconfig.json` in `Script/` folder or `tsconfig.json` in `.vscode/.tc/<ProjectName>` folder:
- `nameMapping.d.ts` declares `Aliases` namespace which holds mapped objects.
- `project.d.ts` declares `Project.Variables` and also provides values of some variables in JSDoc style.
- `testedApps.d.ts` declares `TestedApps` namespace that lists all of your tested apps.
Paths to tested apps and command line arguments provided in JSDoc style.

Note that any changes in these files will be overridden after any command run.

Also extension is configured to automatically regenerate corresponding module after configuration is changed.
For example, if you add new variable and save you `<PojectName>.mds`, corresponding `.vscode/.tc/<ProjectName>/project.d.ts` module will be regenerated.

## Known issues

No configuration options are supported yet.

## Plans on future release

These are just plans, do not count that it will be implemented soon.

- Configuration options
  - Bool flags to enable automatic code generation
  - Paths to generated modules and base API

- More support of project-related stuff:
  - Project suite variables
  - Local values of variables (currently only default values are shown in JSDoc way)
  - Parse actual paths to project configs from `<ProjectName>.mds` file

- VS Code Tasks to run tests without manual launching TestComplete.
  - Note that debugging TC tests in VS Code probably would never be possible

- Diagnostics (infos, warnings beside TypeScript checks)
  - Suggestion to use fully qualified function names like `aqUtils.Delay` instead of just `Delay`

- Better support for mapped objects
  - Ability to change mapped objects properties via VS Code UI.
