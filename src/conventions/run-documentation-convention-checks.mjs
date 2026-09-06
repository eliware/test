import { checkSpecifications } from './checks/specifications.mjs';
import { checkEnvironmentExample } from './environment.mjs';
import { checkExamples } from './examples.mjs';
import { checkDocumentationIndexes, readDocumentationIndexes } from './checks/documentation-indexes.mjs';

/** Run specification, environment, documentation-tree, and example checks. */
export async function runDocumentationConventionChecks(snapshot) {
  const { read, specFiles, specText, environmentSources, docsFiles, specTexts, exampleReadmes, examplePackages, nonMarkdownFiles, exampleFiles, files, examples } = snapshot;
  return [
    ...checkSpecifications(specFiles, specText),
    ...checkEnvironmentExample(await read('.env.example'), environmentSources.join('\n')),
    ...checkDocumentationIndexes({ docsFiles, docsReadme: await read('docs/README.md'), specFiles, specsReadme: await read('specs/README.md'), examples, examplesReadme: await read('examples/README.md'), specTexts, exampleReadmes, nonMarkdownFiles, exampleFiles, documentationTexts: new Map(await Promise.all([...files].filter((path) => /^(?:README|AGENTS)\.md$|^(?:docs|specs|examples)\/.*\.md$/.test(path)).map(async (path) => [path, await read(path)]))), docsIndexes: await readDocumentationIndexes('docs', docsFiles, read), specIndexes: await readDocumentationIndexes('specs', specFiles, read) }),
    ...checkExamples(examples, exampleReadmes, examplePackages),
  ];
}
