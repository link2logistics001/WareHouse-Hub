const fs = require('fs');

function addView(file) {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split(/\r?\n/);

    // 1. Add import
    let importAdded = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import AdminAddWarehouse from')) {
            if (!content.includes('import AdminEditWarehouse from')) {
                lines.splice(i + 1, 0, "import AdminEditWarehouse from '../admin/AdminEditWarehouse';");
            }
            importAdded = true;
            break;
        }
    }

    // 2. Add view in render loop
    let blockPeopleIdx = lines.findIndex(l => l.includes("activeView === 'block-people'"));
    if (blockPeopleIdx !== -1 && !content.includes("activeView === 'edit-warehouse'")) {
        lines.splice(blockPeopleIdx, 0,
            "                        ) : activeView === 'edit-warehouse' ? (",
            "                            <motion.div",
            "                                key=\"edit-warehouse\"",
            "                                initial={{ y: 20, opacity: 0 }}",
            "                                animate={{ y: 0, opacity: 1 }}",
            "                                exit={{ y: -20, opacity: 0 }}",
            "                                transition={{ duration: 0.3 }}",
            "                                className=\"h-full\"",
            "                            >",
            "                                <AdminEditWarehouse setActiveTab={setActiveView} initialData={editTarget} />",
            "                            </motion.div>"
        );
    }

    fs.writeFileSync(file, lines.join('\n'));
    console.log("Added edit view to", file);
}

addView('src/components/admin/AdminDashboard.js');
addView('src/components/superadmin/SuperAdminDashboard.js');
