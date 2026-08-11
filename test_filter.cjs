const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/data.json', 'utf8'));

const selectedTags = { "Data Origin": ["External"] };
const searchQuery = "";

const filtered = data.cases.filter((c) => {
    return Object.entries(selectedTags).every(([subGroup, tags]) => {
        if (tags.length === 0) return true;
        let found = false;
        for (const mainCat of Object.values(c.tags)) {
            if (mainCat[subGroup]) {
                found = mainCat[subGroup].some(t => tags.includes(t));
                if (found) break;
            }
        }
        return found;
    });
});

console.log(`Filtered cases: ${filtered.length} out of ${data.cases.length}`);
