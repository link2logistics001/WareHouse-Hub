const fs = require('fs');

let content = fs.readFileSync('src/components/admin/AdminDashboard.js', 'utf8');

// 1. Add BulkWarehouseUpload and AdminEditWarehouse imports
content = content.replace(
    "import AdminAddWarehouse from './AdminAddWarehouse';\nimport { PlusCircle } from 'lucide-react';",
    "import AdminAddWarehouse from './AdminAddWarehouse';\nimport BulkWarehouseUpload from './BulkWarehouseUpload';\nimport AdminEditWarehouse from './AdminEditWarehouse';\nimport { PlusCircle, FileUp, Edit } from 'lucide-react';"
);

// 2. Add menu item
content = content.replace(
    "{ id: 'add-warehouse', label: 'Add Warehouse', icon: PlusCircle },\n        { id: 'inquiries', label: 'Lead Enquiries', icon: MessageSquarePlus },",
    "{ id: 'add-warehouse', label: 'Add Warehouse', icon: PlusCircle },\n        { id: 'bulk-upload', label: 'Bulk CSV Upload', icon: FileUp },\n        { id: 'inquiries', label: 'Lead Enquiries', icon: MessageSquarePlus },"
);

// 3. Add editTarget state
content = content.replace(
    "const [sidebarOpen, setSidebarOpen] = useState(false);",
    "const [sidebarOpen, setSidebarOpen] = useState(false);\n    const [editTarget, setEditTarget] = useState(null);"
);

// 4. Add handleEdit
content = content.replace(
    "const handleAction = async (id, newStatus, docPath) => {",
    "const handleEdit = (warehouse) => {\n        setEditTarget(warehouse);\n        setActiveView('edit-warehouse');\n    };\n\n    const handleAction = async (id, newStatus, docPath) => {"
);

// 5. Update header text
content = content.replace(
    ": activeView === 'add-warehouse'\n                                        ? 'Add Warehouse'\n                                        : 'User Management'}",
    ": activeView === 'add-warehouse'\n                                        ? 'Add Warehouse'\n                                        : activeView === 'edit-warehouse'\n                                        ? 'Edit Warehouse'\n                                        : activeView === 'bulk-upload'\n                                        ? 'Bulk CSV Upload'\n                                        : 'User Management'}"
);

// 6. Update WarehouseListView props
content = content.replace(
    "setExpandedRow={setExpandedRow}\n                                />\n                            </motion.div>\n                        ) : activeView === 'block-people' ? (",
    "setExpandedRow={setExpandedRow}\n                                    onEdit={handleEdit}\n                                />\n                            </motion.div>\n                        ) : activeView === 'block-people' ? ("
);

// 7. Add views
content = content.replace(
    "<AdminAddWarehouse setActiveTab={setActiveView} />\n                            </motion.div>\n                        ) : null}",
    "<AdminAddWarehouse setActiveTab={setActiveView} />\n                            </motion.div>\n                        ) : activeView === 'bulk-upload' ? (\n                            <motion.div\n                                key=\"bulk-upload\"\n                                initial={{ y: 20, opacity: 0 }}\n                                animate={{ y: 0, opacity: 1 }}\n                                exit={{ y: -20, opacity: 0 }}\n                                transition={{ duration: 0.3 }}\n                                className=\"h-full\"\n                            >\n                                <BulkWarehouseUpload role=\"admin\" user={user} setActiveTab={setActiveView} />\n                            </motion.div>\n                        ) : activeView === 'edit-warehouse' ? (\n                            <motion.div\n                                key=\"edit-warehouse\"\n                                initial={{ y: 20, opacity: 0 }}\n                                animate={{ y: 0, opacity: 1 }}\n                                exit={{ y: -20, opacity: 0 }}\n                                transition={{ duration: 0.3 }}\n                                className=\"h-full\"\n                            >\n                                <AdminEditWarehouse setActiveTab={setActiveView} initialData={editTarget} />\n                            </motion.div>\n                        ) : null}"
);

// 8. Update WarehouseListView definition
content = content.replace(
    "function WarehouseListView({ filtered, loading, error, filter, setFilter, search, setSearch, counts, handleAction, actionLoading, expandedRow, setExpandedRow }) {",
    "function WarehouseListView({ filtered, loading, error, filter, setFilter, search, setSearch, counts, handleAction, onEdit, actionLoading, expandedRow, setExpandedRow }) {"
);

content = content.replace(
    "onToggleExpand={() => setExpandedRow(expandedRow === w.id ? null : w.id)}\n                            />\n                        ))}",
    "onEdit={onEdit}\n                                onToggleExpand={() => setExpandedRow(expandedRow === w.id ? null : w.id)}\n                            />\n                        ))}"
);

// 9. Update WarehouseRow definition
content = content.replace(
    "function WarehouseRow({ warehouse: w, handleAction, actionLoading, isExpanded, onToggleExpand }) {",
    "function WarehouseRow({ warehouse: w, handleAction, onEdit, actionLoading, isExpanded, onToggleExpand }) {"
);
content = content.replace(
    "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} />",
    "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} onEdit={onEdit} />"
);
content = content.replace(
    "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} />",
    "<ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} onEdit={onEdit} />"
);

// 10. Update ActionButtons definition
content = content.replace(
    "function ActionButtons({ w, status, isActing, handleAction }) {",
    "function ActionButtons({ w, status, isActing, handleAction, onEdit }) {"
);
content = content.replace(
    "{status !== 'approved' && (\n                <button\n                    onClick={() => handleAction(w.id, 'approved', w._docPath)}",
    "<button\n                    onClick={() => onEdit(w)}\n                    className=\"flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all\"\n                >\n                    <Edit className=\"w-3 h-3\" />\n                    Edit\n                </button>\n            {status !== 'approved' && (\n                <button\n                    onClick={() => handleAction(w.id, 'approved', w._docPath)}"
);

fs.writeFileSync('src/components/admin/AdminDashboard.js', content);
