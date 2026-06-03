const fs = require('fs');

function applyFixes(file, isAdmin) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add handleEdit if it doesn't exist
    if (!content.includes('const handleEdit =')) {
        content = content.replace(
            "const handleAction = async (warehouseId, newStatus, docPath) => {",
            "const handleEdit = (warehouse) => {\n        setEditTarget(warehouse);\n        setActiveView('edit-warehouse');\n    };\n\n    const handleAction = async (warehouseId, newStatus, docPath) => {"
        );
    }

    // 2. Add onEdit parameter to WarehouseListView
    content = content.replace(
        "    counts,\n    handleAction,\n    actionLoading,\n    expandedRow,\n    setExpandedRow,\n}) {",
        "    counts,\n    handleAction,\n    onEdit,\n    actionLoading,\n    expandedRow,\n    setExpandedRow,\n}) {"
    );

    // 3. Pass onEdit to WarehouseListView from Dashboard
    content = content.replace(
        "                                    handleAction={handleAction}\n                                    actionLoading={actionLoading}",
        "                                    handleAction={handleAction}\n                                    onEdit={handleEdit}\n                                    actionLoading={actionLoading}"
    );

    // 4. Pass onEdit from WarehouseListView to WarehouseRow
    content = content.replace(
        "                                handleAction={handleAction}\n                                actionLoading={actionLoading}",
        "                                handleAction={handleAction}\n                                onEdit={onEdit}\n                                actionLoading={actionLoading}"
    );

    // 5. Add onEdit parameter to WarehouseRow
    if (!content.includes('function WarehouseRow({ warehouse: w, handleAction, onEdit')) {
        content = content.replace(
            "function WarehouseRow({ warehouse: w, handleAction, actionLoading, isExpanded, onToggleExpand }) {",
            "function WarehouseRow({ warehouse: w, handleAction, onEdit, actionLoading, isExpanded, onToggleExpand }) {"
        );
    }

    // 6. Pass onEdit to ActionButtons from WarehouseRow (both mobile and desktop layouts)
    content = content.replaceAll(
        "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} />",
        "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} onEdit={onEdit} />"
    );

    // 7. Add onEdit parameter to ActionButtons
    if (!content.includes('function ActionButtons({ w, status, isActing, handleAction, onEdit }) {')) {
        content = content.replace(
            "function ActionButtons({ w, status, isActing, handleAction }) {",
            "function ActionButtons({ w, status, isActing, handleAction, onEdit }) {"
        );
    }

    // 8. Add Edit button to ActionButtons if missing
    if (!content.includes('<Edit className="w-3 h-3" />')) {
        content = content.replace(
            "{status !== 'approved' && (\n                <button",
            "{onEdit && (\n                <button\n                    onClick={() => onEdit(w)}\n                    className=\"flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all\"\n                >\n                    <Edit className=\"w-3 h-3\" />\n                    Edit\n                </button>\n            )}\n            {status !== 'approved' && (\n                <button"
        );
    }

    fs.writeFileSync(file, content);
    console.log("Fixed", file);
}

applyFixes('src/components/admin/AdminDashboard.js', true);
applyFixes('src/components/superadmin/SuperAdminDashboard.js', false);
