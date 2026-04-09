const fs = require('fs');
const path = require('path');

const componentsDir = 'c:/Users/laksh/OneDrive/Desktop/phishguard/soc-dashboard/src/components';
const srcDir = 'c:/Users/laksh/OneDrive/Desktop/phishguard/soc-dashboard/src';

function getAllFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file, exts));
        } else {
            if (exts.includes(path.extname(file))) {
                results.push(file);
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

console.log(JSON.stringify(unused, null, 2));
