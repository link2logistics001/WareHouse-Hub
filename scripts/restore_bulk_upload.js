const fs = require('fs');

function restoreBulkUpload(file, role) {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split(/\r?\n/);

    // 1. Add BulkWarehouseUpload import
    if (!content.includes('import BulkWarehouseUpload from')) {
        let importIdx = lines.findIndex(l => l.includes('import AdminAddWarehouse from'));
        if (importIdx !== -1) {
            lines.splice(importIdx, 0, "import BulkWarehouseUpload from '../admin/BulkWarehouseUpload';");
        }
    }

    // 2. Add FileUp icon to lucide-react imports
    if (!content.includes('FileUp,')) {
        let lucideIdx = lines.findIndex(l => l.includes("} from 'lucide-react';"));
        if (lucideIdx !== -1) {
            lines.splice(lucideIdx, 0, "    FileUp,");
        }
    }

    // 3. Add to sidebar menu items
    if (!content.includes("{ id: 'bulk-upload', label: 'Bulk CSV Upload', icon: FileUp }")) {
        let addWarehouseIdx = lines.findIndex(l => l.includes("{ id: 'add-warehouse', label: 'Add Warehouse'"));
        if (addWarehouseIdx !== -1) {
            lines.splice(addWarehouseIdx + 1, 0, "        { id: 'bulk-upload', label: 'Bulk CSV Upload', icon: FileUp },");
        }
    }

    // 4. Update header title
    if (content.includes("? 'Edit Warehouse'") && !content.includes("? 'Bulk CSV Upload'")) {
        let titleIdx = lines.findIndex(l => l.includes("? 'Edit Warehouse'"));
        if (titleIdx !== -1) {
            lines[titleIdx] = lines[titleIdx].replace(
                "? 'Edit Warehouse'",
                "? 'Edit Warehouse'\n                                        : activeView === 'bulk-upload'\n                                        ? 'Bulk CSV Upload'"
            );
        }
    }

    // 5. Add bulk-upload view
    if (!content.includes("activeView === 'bulk-upload'")) {
        let addWarehouseViewIdx = lines.findIndex(l => l.includes("activeView === 'add-warehouse' ? ("));
        if (addWarehouseViewIdx !== -1) {
            // find the end of add-warehouse view
            let endOfAddWarehouseIdx = lines.findIndex((l, i) => i > addWarehouseViewIdx && l.includes("</motion.div>"));
            if (endOfAddWarehouseIdx !== -1) {
                let endBracketIdx = lines.findIndex((l, i) => i > endOfAddWarehouseIdx && l.includes(") : activeView ==="));
                if (endBracketIdx !== -1) {
                   lines.splice(endBracketIdx, 0,
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
                }
            }
        }
    }

    fs.writeFileSync(file, lines.join('\n'));
    console.log("Restored bulk upload to", file);
}

restoreBulkUpload('src/components/admin/AdminDashboard.js', 'admin');
restoreBulkUpload('src/components/superadmin/SuperAdminDashboard.js', 'superadmin');
