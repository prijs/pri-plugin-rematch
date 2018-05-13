import test from 'ava';
import * as path from 'path';
import { judgeHasComponents } from '../src/methods';

const testProjectRootPath = '/Users/someOne/workspace';

const testFilePaths = (filePaths: string[]) =>
  filePaths
    .map(filePath => path.join(testProjectRootPath, filePath))
    .map(filePath => path.parse(filePath));

test('Single file', t => {
  const relativeProjectFiles = ['src/components'];
  t.true(
    judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles))
  );
});

test('Multiple files', t => {
  const relativeProjectFiles = [
    'src/components/index.tsx',
    'src/components/button/index.tsx',
    'src/components/select/index.tsx'
  ];
  t.true(
    judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles))
  );
});

test("hasn't components", t => {
  const relativeProjectFiles = ['src/pages/index.tsx'];
  t.false(
    judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles))
  );
});
