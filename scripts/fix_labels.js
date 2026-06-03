const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const target = "    const photoLabels = {\r\n        frontView: 'Front View',\r\n        insideView: 'Inside View',\r\n        dockArea: 'Dock Area',\r\n        rateCard: 'Rate Card',\r\n    };";
    const replacement = "    const photoLabels = {\r\n        frontView: 'Front View',\r\n        insideView: 'Inside View',\r\n        dockArea: 'Dock Area',\r\n        rateCard: 'Rate Card',\r\n        tariff: 'Tariff',\r\n    };";
    
    const target2 = "    const photoLabels = {\n        frontView: 'Front View',\n        insideView: 'Inside View',\n        dockArea: 'Dock Area',\n        rateCard: 'Rate Card',\n    };";
    const replacement2 = "    const photoLabels = {\n        frontView: 'Front View',\n        insideView: 'Inside View',\n        dockArea: 'Dock Area',\n        rateCard: 'Rate Card',\n        tariff: 'Tariff',\n    };";

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed " + filePath);
    } else if (content.includes(target2)) {
        content = content.replace(target2, replacement2);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed " + filePath);
    } else {
        console.log("Could not find target in " + filePath);
    }
}

fixFile('src/components/admin/AdminDashboard.js');
fixFile('src/components/superadmin/SuperAdminDashboard.js');
