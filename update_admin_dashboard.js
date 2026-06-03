const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminDashboard.js', 'utf8');

// 1. Add imports
content = content.replace(
    "import AdminAddWarehouse from './AdminAddWarehouse';",
    "import AdminAddWarehouse from './AdminAddWarehouse';\nimport AdminEditWarehouse from './AdminEditWarehouse';"
);
content = content.replace(
    "import { PlusCircle } from 'lucide-react';",
    "import { PlusCircle, Edit } from 'lucide-react';"
);

// 2. Add editTarget state
content = content.replace(
    "const [sidebarOpen, setSidebarOpen] = useState(false);",
    "const [sidebarOpen, setSidebarOpen] = useState(false);\n    const [editTarget, setEditTarget] = useState(null);"
);

// 3. Add handleEdit function
content = content.replace(
    "const handleAction = async (id, newStatus, docPath) => {",
    "const handleEdit = (warehouse) => {\n        setEditTarget(warehouse);\n        setActiveView('edit-warehouse');\n    };\n\n    const handleAction = async (id, newStatus, docPath) => {"
);

// 4. Update WarehouseListView props passing
content = content.replace(
    "setExpandedRow={setExpandedRow}\n                                />",
    "setExpandedRow={setExpandedRow}\n                                    onEdit={handleEdit}\n                                />"
);

// 5. Add edit-warehouse activeView condition
content = content.replace(
    "} else if (v === 'bulk-upload') {",
    "} else if (v === 'edit-warehouse') {\n            if (!editTarget) setActiveView('warehouses');\n        } else if (v === 'bulk-upload') {"
);
content = content.replace(
    "activeView === 'add-warehouse'\n                                          ? 'Add Warehouse'\n                                          : activeView === 'bulk-upload'\n                                            ? 'Bulk CSV Upload'",
    "activeView === 'add-warehouse'\n                                          ? 'Add Warehouse'\n                                          : activeView === 'edit-warehouse'\n                                            ? 'Edit Warehouse'\n                                          : activeView === 'bulk-upload'\n                                            ? 'Bulk CSV Upload'"
);
content = content.replace(
    ") : activeView === 'add-warehouse' ? (",
    ") : activeView === 'edit-warehouse' ? (\n                            <motion.div\n                                key=\"edit-warehouse\"\n                                initial={{ y: 20, opacity: 0 }}\n                                animate={{ y: 0, opacity: 1 }}\n                                exit={{ y: -20, opacity: 0 }}\n                                transition={{ duration: 0.3 }}\n                                className=\"h-full\"\n                            >\n                                <AdminEditWarehouse setActiveTab={setActiveView} initialData={editTarget} />\n                            </motion.div>\n                        ) : activeView === 'add-warehouse' ? ("
);

// 6. Update WarehouseListView component
content = content.replace(
    "function WarehouseListView({ filtered, loading, error, filter, setFilter, search, setSearch, counts, handleAction, actionLoading, expandedRow, setExpandedRow }) {",
    "function WarehouseListView({ filtered, loading, error, filter, setFilter, search, setSearch, counts, handleAction, onEdit, actionLoading, expandedRow, setExpandedRow }) {"
);
content = content.replace(
    "<WarehouseRow\n                                key={w.id}\n                                warehouse={w}\n                                handleAction={handleAction}\n                                actionLoading={actionLoading}\n                                isExpanded={expandedRow === w.id}\n                                onToggleExpand={() => setExpandedRow(expandedRow === w.id ? null : w.id)}\n                            />",
    "<WarehouseRow\n                                key={w.id}\n                                warehouse={w}\n                                handleAction={handleAction}\n                                onEdit={onEdit}\n                                actionLoading={actionLoading}\n                                isExpanded={expandedRow === w.id}\n                                onToggleExpand={() => setExpandedRow(expandedRow === w.id ? null : w.id)}\n                            />"
);

// 7. Update WarehouseRow component
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

// 8. Update ActionButtons component
content = content.replace(
    "function ActionButtons({ w, status, isActing, handleAction }) {",
    "function ActionButtons({ w, status, isActing, handleAction, onEdit }) {"
);
content = content.replace(
    "{status !== 'approved' && (",
    "<button\n                    onClick={() => onEdit(w)}\n                    className=\"flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all\"\n                >\n                    <Edit className=\"w-3 h-3\" />\n                    Edit\n                </button>\n            {status !== 'approved' && ("
);


fs.writeFileSync('src/components/admin/AdminDashboard.js', content);
