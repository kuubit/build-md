import fs from 'fs';
import path from 'path';
import fm from 'front-matter';

const args = process.argv.slice(2);

const DEFAULT_ENTRYPOINT_PATH = './src/_master.md';
const DEFAULT_OUTPUT_PATH = './output';
const DEFAULT_OUTPUT_FILENAME = 'output.md';
const BRAKET_REGEX = /\[\[(.*?)\]\]/g;

function replacer(match, baseDir) {
    const filePath = match.slice(2, match.length - 2);
    const fullFilePath = path.join(baseDir, filePath);

    return fs.readFileSync(fullFilePath, 'utf-8');
}

function saveResult(outputPath, data) {
    const dirname = path.dirname(outputPath);
    
    if (fs.existsSync(dirname)) {
        fs.writeFileSync(outputPath, data, 'utf-8');
    } else {
        fs.mkdirSync(dirname, { recursive: true });
        fs.writeFileSync(outputPath, data, 'utf-8');
    }
}

async function build({ entrypoint, outputPath }) {
    const baseDir = path.dirname(entrypoint);
    try {
        const data = await fs.promises.readFile(entrypoint, 'utf-8');
        const title = fm(data)?.attributes?.title;
        const updated = data.replace(BRAKET_REGEX,  match => replacer(match, baseDir));

        saveResult(path.join(outputPath, title ? `${title}.md` : DEFAULT_OUTPUT_FILENAME), updated);
    } catch(err) {
        console.log(err);
    }
}

build({
    entrypoint: args[0] ?? DEFAULT_ENTRYPOINT_PATH,
    outputPath: args[1] ?? DEFAULT_OUTPUT_PATH,
    });
});
