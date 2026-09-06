import { posix } from 'node:path';
import { hasDirectLink, hasDescribedLink, hasFileLink } from './documentation-links.mjs';

function finding(message) { return { group: 'documentation', message }; }
function checkDirectFiles(label, files, index, indexDirectory, allFiles, findings) {
  const directFiles = files.filter((file) => (posix.dirname(file) === '.' ? '' : posix.dirname(file)) === indexDirectory && posix.basename(file).toLowerCase() !== 'readme.md');
  for (const file of directFiles) {
    const target = indexDirectory ? file.slice(indexDirectory.length + 1) : file;
    if (!hasFileLink(index, target, allFiles, `${label}/${indexDirectory}`)) findings.push(finding(`${label}/${indexDirectory ? `${indexDirectory}/` : ''}README.md: missing link to file ${file}`));
    else if (!hasDescribedLink(index, target, `${label}/${indexDirectory}`)) findings.push(finding(`${label}/${indexDirectory ? `${indexDirectory}/` : ''}README.md: link to ${file} needs a description`));
  }
}

export function checkDocumentationTree(label, files, indexes, findings) {
  const allFiles = new Set(files.map((file) => `${label}/${file}`));
  for (const [directory, index] of indexes) {
    const indexDirectory = directory ? `${label}/${directory}` : label;
    const prefix = directory ? `${directory}/` : '';
    const childDirectories = [...new Set(files.filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length).split('/')[0]).filter((part) => part && files.some((file) => file.startsWith(`${prefix}${part}/`))))];
    if (!index) { findings.push(finding(`${label}/${directory || 'README.md'}: missing documentation index`)); continue; }
    checkDirectFiles(label, files, index, directory, allFiles, findings);
    for (const child of childDirectories) if (!hasDirectLink(index, `${child}/README.md`, indexDirectory)) findings.push(finding(`${label}/${directory || 'README.md'}: missing link to nested index ${child}/README.md`));
  }
}
