import * as path from 'path';

export function judgeHasComponents(
  projectRootPath: string,
  files: path.ParsedPath[]
) {
  return files.some(file => {
    const relativePath = path.relative(
      projectRootPath,
      path.join(file.dir, file.name)
    );
    if (relativePath.startsWith('src/components')) {
      return true;
    }
    return false;
  });
}
