const fs = require('fs');
const path = require('path');
const fm = require('front-matter');
const replaceAsync = require('./util/replaceAsync');

const args = process.argv.slice(2);

const DEFAULT_ENTRYPOINT_PATH = './src/_master.md';
const DEFAULT_OUTPUT_PATH = './output';
const DEFAULT_OUTPUT_FILENAME = 'output.md';
const BRAKET_REGEX = /\[\[(.*?)\]\]/g;

let COUNT = 0;

function extractFilePath(match, baseDir) {
    const filePath = match.slice(2, match.length - 2);
    return path.join(baseDir, filePath);
}

function saveResult(outputPath, data) {
    const dirname = path.dirname(outputPath);
    
    if (fs.existsSync(dirname)) {
        fs.writeFileSync(outputPath, data, 'utf-8');
    } else {
        fs.mkdirSync(dirname, { recursive: true });
        fs.writeFileSync(outputPath, data, 'utf-8');
    }
    console.log(`Result saved to ${path.join(process.cwd(), outputPath)}`);
}

async function hydrateBranch(prevMatch, baseDir) {
    COUNT++;
    const filePath = extractFilePath(prevMatch, baseDir);
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const updated = await replaceAsync(data, BRAKET_REGEX, async (match) => await hydrateBranch(match, baseDir));
    return updated;
}

async function build({ entrypoint, outputPath }) {
    const baseDir = path.dirname(entrypoint);
    try {
        const data = await fs.promises.readFile(entrypoint, 'utf-8');
        const title = fm(data)?.attributes?.title;
        const updated = await replaceAsync(data, BRAKET_REGEX, async (match) => await hydrateBranch(match, baseDir));

        saveResult(path.join(outputPath, title ? `${title}.md` : DEFAULT_OUTPUT_FILENAME), updated);
        console.log(`Completed with ${COUNT} replacements!`);
    } catch(err) {
        console.log(err);
    }
}

build({
    entrypoint: args[0] ?? DEFAULT_ENTRYPOINT_PATH,
    outputPath: args[1] ?? DEFAULT_OUTPUT_PATH,
});
