import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri, tempJsEntryPath, tempTypesPath } from 'pri';

interface IResult {
  projectAnalyseRematch: {
    modelFiles: {
      name: string;
      file: path.ParsedPath;
    }[];
  };
}

const safeName = (str: string) => _.camelCase(str);

const modelRoot = `src${path.sep}models`;
const modelsFilePath = path.join(pri.projectRootPath, tempTypesPath.dir, 'models.ts');
const modelFilePath = path.join(pri.projectRootPath, tempTypesPath.dir, 'model.ts');
const modelsFilePathInfo = path.parse(modelsFilePath);

/** Support pri/models alias */
pri.build.pipeConfig(config => {
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  config.resolve.alias['pri/models'] = modelsFilePath;
  config.resolve.alias['pri/model'] = modelFilePath;

  return config;
});

/** Set white files */
const whiteList = [modelRoot];
pri.project.whiteFileRules.add(file => {
  return whiteList.some(whiteName => path.format(file) === path.join(pri.projectRootPath, whiteName));
});

// src/models/**
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return relativePath.startsWith(modelRoot);
});

pri.project.onAnalyseProject(files => {
  return {
    projectAnalyseRematch: {
      modelFiles: files
        .filter(file => {
          if (file.isDir) {
            return false;
          }

          const relativePath = path.relative(pri.projectRootPath, path.join(file.dir, file.name));

          if (!relativePath.startsWith(modelRoot)) {
            return false;
          }

          return true;
        })
        .map(file => {
          return { file, name: safeName(file.name) };
        })
    }
  };
});

pri.project.onCreateEntry(async (analyseInfo: IResult, entry) => {
  if (analyseInfo.projectAnalyseRematch.modelFiles.length === 0) {
    return;
  }

  const entryRelativeToModels = ensureStartWithWebpackRelativePoint(
    path.relative(path.join(tempJsEntryPath.dir), path.join(modelsFilePathInfo.dir, modelsFilePathInfo.name))
  );

  entry.pipeAppHeader(header => {
    return `
        ${header}
        import { Provider } from 'react-redux'
        import rematchStore from "${normalizePath(entryRelativeToModels)}"
      `;
  });

  entry.pipeAppRouter(router => {
    return `
        <Provider store={rematchStore}>
          ${router}
        </Provider>
      `;
  });

  const modelsContent = `
      import { init } from '@rematch/core'
      // import immerPlugin from '@rematch/immer'
      import { connect as reduxConnect } from 'react-redux'

      ${analyseInfo.projectAnalyseRematch.modelFiles
        .map(modelFile => {
          const importAbsolutePath = path.join(modelFile.file.dir, modelFile.file.name);
          const importRelativePath = ensureStartWithWebpackRelativePoint(
            path.relative(modelsFilePathInfo.dir, importAbsolutePath)
          );
          return `import ${modelFile.name} from "${normalizePath(importRelativePath)}"`;
        })
        .join('\n')}

      const models = {${analyseInfo.projectAnalyseRematch.modelFiles
        .map(storeFile => {
          return `${storeFile.name}`;
        })
        .join(',')}}

      // const immer = immerPlugin()

      // const store = init({models, plugins: [immer]})
      const store = init({models})
      export default store

      export interface IState {
        ${analyseInfo.projectAnalyseRematch.modelFiles
          .map(modelFile => {
            return `${modelFile.name}: typeof ${modelFile.name}.state;`;
          })
          .join('\n')}
      }

      // Strong type connect
      type IMapStateToProps = (
        state?: IState,
        props?: any
      ) => object;

      export interface IDispatch {
        ${analyseInfo.projectAnalyseRematch.modelFiles
          .map(modelFile => {
            return `${modelFile.name}: any & typeof ${modelFile.name}.effects;`;
          })
          .join('\n')}
      }

      type IMapDispatchToProps = (
        dispatch?: IDispatch
      ) => object;

      export const connect = (mapStateToProps?: IMapStateToProps, mapDispatchToProps?: IMapDispatchToProps) => {
        return reduxConnect(mapStateToProps, mapDispatchToProps) as any;
      };
    `;

  const prettier = await import('prettier');

  // If has stores, create helper.ts
  fs.outputFileSync(
    modelsFilePath,
    prettier.format(getHelperContent(modelsContent), {
      semi: false,
      parser: 'typescript'
    })
  );

  fs.outputFileSync(
    modelFilePath,
    prettier.format(
      `
    const model = <
      State,
      Reducers extends {
        [key: string]: (state?: State, payload?: any) => State;
      }
    >(obj: {
      state: State;
      reducers: Reducers;
      effects: {
        [key: string]: (this: any, ...args: any[]) => void;
      };
    }) => {
      return obj;
    };
    `,
      {
        semi: false,
        parser: 'typescript'
      }
    )
  );
});

function getHelperContent(str: string) {
  return `
    /**
     * Do not edit this file.
     * This file is automatic generated to get type help.
     */
    ${str}
  `;
}

export function ensureStartWithWebpackRelativePoint(str: string) {
  if (str.startsWith(path.sep)) {
    throw Error(`${str} is an absolute path!`);
  }

  if (!str.startsWith(`.${path.sep}`) && !str.startsWith(`..${path.sep}`)) {
    return `.${path.sep}${str}`;
  }
  return str;
}
