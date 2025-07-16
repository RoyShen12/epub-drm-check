

const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'scan.log');
const logContent = fs.readFileSync(logFilePath, 'utf8');

const pathRegex = /^\s*Path:\s*(.*)$/gm;
let match;
const filesToDelete = [];

while ((match = pathRegex.exec(logContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === pathRegex.lastIndex) {
        pathRegex.lastIndex++;
    }
    filesToDelete.push(match[1].trim());
}

if (filesToDelete.length === 0) {
    console.log('No files to delete found in scan.log.');
    return;
}

console.log(`Found ${filesToDelete.length} files to delete. Starting deletion...`);

let deletedCount = 0;
let errorCount = 0;

filesToDelete.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
            deletedCount++;
        } else {
            console.log(`Skipped (not found): ${filePath}`);
        }
    } catch (err) {
        console.error(`Error deleting ${filePath}:`, err.message);
        errorCount++;
    }
});

console.log('\nDeletion complete.');
console.log(`Successfully deleted: ${deletedCount} files.`);
console.log(`Errors: ${errorCount} files.`);
console.log(`Skipped (not found): ${filesToDelete.length - deletedCount - errorCount} files.`);

