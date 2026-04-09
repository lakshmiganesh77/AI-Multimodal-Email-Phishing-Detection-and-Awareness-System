import fs from 'fs';
import path from 'path';

const componentsDir = 'c:/Users/laksh/OneDrive/Desktop/phishguard/soc-dashboard/src/components';
const srcDir = 'c:/Users/laksh/OneDrive/Desktop/phishguard/soc-dashboard/src';

function getAllFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        let fPath = path.join(dir, file);
        const stat = fs.statSync(fPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(fPath, exts));
        } else {
            if (exts.includes(path.extname(fPath))) {
                results.push(fPath);
            }
        }
    });
    return results;
}

const allSrcFiles = getAllFiles(srcDir, ['.jsx', '.js']);
const components = getAllFiles(componentsDir, ['.jsx']);

const unused = [];

components.forEach(comp => {
    const baseName = path.basename(comp, '.jsx');
    let isUsed = false;
    for (const srcFile of allSrcFiles) {
        if (srcFile === comp) continue;
        const content = fs.readFileSync(srcFile, 'utf8');
        if (content.includes(baseName)) {
            isUsed = true;
            break;
        }
    }
    if (!isUsed) {
        unused.push(comp);
    }
});

fs.writeFileSync('c:/Users/laksh/OneDrive/Desktop/phishguard/soc-dashboard/unused_components.json', JSON.stringify(unused, null, 2), 'utf-8');
