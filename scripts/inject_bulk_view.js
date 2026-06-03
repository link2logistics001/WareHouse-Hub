const fs = require('fs');

function addBulkView(file, role, insertionString) {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split(/\r?\n/);
    
    // Check if view is already added
    if (!content.includes("activeView === 'bulk-upload'")) {
        let insertIdx = lines.findIndex(l => l.includes(insertionString));
        if (insertIdx !== -1) {
            lines.splice(insertIdx, 0,
                "                        ) : activeView === 'bulk-upload' ? (",
                "                            <motion.div",
                "                                key=\"bulk-upload\"",
                "                                initial={{ y: 20, opacity: 0 }}",
                "                                animate={{ y: 0, opacity: 1 }}",
                "                                exit={{ y: -20, opacity: 0 }}",
                "                                transition={{ duration: 0.3 }}",
                "                                className=\"h-full\"",
                "                            >",
                `                                <BulkWarehouseUpload role="${role}" user={user} setActiveTab={setActiveView} />`,
                "                            </motion.div>"
            );
            fs.writeFileSync(file, lines.join('\n'));
            console.log("Successfully injected view into", file);
        } else {
            console.log("Insertion point not found for", file);
        }
    } else {
        console.log("View already exists in", file);
    }
}

addBulkView('src/components/admin/AdminDashboard.js', 'admin', ') : null}');
addBulkView('src/components/superadmin/SuperAdminDashboard.js', 'superadmin', ") : activeView === 'block-people'");
