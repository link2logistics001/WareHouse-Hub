const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split(/\r?\n/);

    // 1. Add editTarget state if not exists
    let sidebarOpenLineIdx = lines.findIndex(l => l.includes('const [sidebarOpen, setSidebarOpen] = useState(false);'));
    if (sidebarOpenLineIdx !== -1 && !lines.some(l => l.includes('const [editTarget, setEditTarget] ='))) {
        lines.splice(sidebarOpenLineIdx + 1, 0, "    const [editTarget, setEditTarget] = useState(null);");
    }

    // 2. Add handleEdit if not exists
    let handleActionLineIdx = lines.findIndex(l => l.includes('const handleAction = async ('));
    if (handleActionLineIdx !== -1 && !lines.some(l => l.includes('const handleEdit = (warehouse) => {'))) {
        lines.splice(handleActionLineIdx, 0, 
            "    const handleEdit = (warehouse) => {",
            "        setEditTarget(warehouse);",
            "        setActiveView('edit-warehouse');",
            "    };",
            ""
        );
    }

    // 3. Add onEdit parameter to WarehouseListView
    let countsLineIdx = lines.findIndex(l => l.includes('    counts,'));
    if (countsLineIdx !== -1 && !lines.some(l => l.includes('    onEdit,'))) {
        let handleActionParamIdx = lines.findIndex((l, i) => i > countsLineIdx && l.includes('    handleAction,'));
        if (handleActionParamIdx !== -1) {
            lines.splice(handleActionParamIdx + 1, 0, "    onEdit,");
        }
    }

    // 4. Pass onEdit from Dashboard to WarehouseListView
    let countsPropIdx = lines.findIndex(l => l.includes('                                    counts={counts}'));
    if (countsPropIdx !== -1 && !lines.some((l, i) => Math.abs(i - countsPropIdx) < 5 && l.includes('onEdit={handleEdit}'))) {
        let handleActionPropIdx = lines.findIndex((l, i) => i > countsPropIdx && l.includes('handleAction={handleAction}'));
        if (handleActionPropIdx !== -1) {
            lines.splice(handleActionPropIdx + 1, 0, "                                    onEdit={handleEdit}");
        }
    }

    // 5. Add onEdit parameter to WarehouseRow
    let wRowDefIdx = lines.findIndex(l => l.includes('function WarehouseRow({'));
    if (wRowDefIdx !== -1) {
        let line = lines[wRowDefIdx];
        if (!line.includes('onEdit,')) {
            lines[wRowDefIdx] = line.replace('handleAction,', 'handleAction, onEdit,');
        }
    }

    // 6. Pass onEdit from WarehouseListView to WarehouseRow
    let handleActionRowPropIdxs = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('handleAction={handleAction}') && lines[i].includes('                                ')) {
            // inside WarehouseListView return
            handleActionRowPropIdxs.push(i);
        }
    }
    for (let i = handleActionRowPropIdxs.length - 1; i >= 0; i--) {
        let idx = handleActionRowPropIdxs[i];
        if (!lines[idx + 1].includes('onEdit={onEdit}') && lines[idx-1].includes('warehouse={w}')) {
             lines.splice(idx + 1, 0, "                                onEdit={onEdit}");
        }
    }

    // 7. Add onEdit to ActionButtons definition
    let aBtnDefIdx = lines.findIndex(l => l.includes('function ActionButtons({'));
    if (aBtnDefIdx !== -1) {
        let line = lines[aBtnDefIdx];
        if (!line.includes('onEdit')) {
            lines[aBtnDefIdx] = line.replace('handleAction })', 'handleAction, onEdit })');
        }
    }

    // 8. Pass onEdit to ActionButtons usage
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<ActionButtons ') && !lines[i].includes('onEdit={onEdit}')) {
            lines[i] = lines[i].replace('handleAction={handleAction}', 'handleAction={handleAction} onEdit={onEdit}');
        }
    }

    // 9. Render the Edit button inside ActionButtons
    let flexWrapIdxs = [];
    for (let i = aBtnDefIdx; i < Math.min(aBtnDefIdx + 10, lines.length); i++) {
        if (lines[i] && lines[i].includes('className="flex flex-wrap gap-2"')) {
            flexWrapIdxs.push(i);
        }
    }
    if (flexWrapIdxs.length > 0) {
        let flexWrapIdx = flexWrapIdxs[0];
        if (!lines.slice(flexWrapIdx, flexWrapIdx + 15).some(l => l.includes('Edit className="w-3 h-3"'))) {
            lines.splice(flexWrapIdx + 1, 0, 
                "            {onEdit && (",
                "                <button",
                "                    onClick={() => onEdit(w)}",
                "                    className=\"flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all\"",
                "                >",
                "                    <Edit className=\"w-3 h-3\" />",
                "                    Edit",
                "                </button>",
                "            )}"
            );
        }
    }

    fs.writeFileSync(file, lines.join('\n'));
    console.log("Successfully fixed", file);
}

fixFile('src/components/admin/AdminDashboard.js');
fixFile('src/components/superadmin/SuperAdminDashboard.js');
