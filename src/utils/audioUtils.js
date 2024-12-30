const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

module.exports = {
    ensureDirectoryExists
};
