const fs = require('fs');

function addView(file) {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split(/\r?\n/);

    // 1. Add import
    if (!content.includes('import AdminEditWarehouse from')) {
        let importIdx = lines.findIndex(l => l.includes('import { blockUser } from'));
        if (importIdx !== -1) {
            lines.splice(importIdx, 0, "import AdminEditWarehouse from '../admin/AdminEditWarehouse';");
        }
    }

    // 2. Add view in render loop
    if (!content.includes("activeView === 'edit-warehouse'")) {
        let targetIdx = lines.findIndex(l => l.includes("activeView === 'block-people'"));
        if (targetIdx !== -1) {
            lines.splice(targetIdx, 0,
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
    }

    fs.writeFileSync(file, lines.join('\n'));
    console.log("Added edit view to", file);
}

addView('src/components/admin/AdminDashboard.js');
addView('src/components/superadmin/SuperAdminDashboard.js');
