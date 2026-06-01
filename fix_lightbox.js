const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import
    if (!content.includes('import { createPortal }')) {
        content = content.replace(
            "import { useEffect, useState, useRef } from 'react';",
            "import { useEffect, useState, useRef } from 'react';\nimport { createPortal } from 'react-dom';"
        );
    }

    const startRegex = /\{\/\* Lightbox Modal \*\/\}\r?\n\s*<AnimatePresence>\r?\n\s*\{lightboxOpen && \(/g;
    const startRepl = "{/* Lightbox Modal */}\n            {typeof window !== 'undefined' && createPortal(\n            <AnimatePresence>\n                {lightboxOpen && (";

    if (startRegex.test(content)) {
        content = content.replace(startRegex, startRepl);
        
        const endRegex = /<\/AnimatePresence>\r?\n\s*<\/>\r?\n\s*\);\r?\n\}\r?\n\r?\n?\/\/ -+/g;
        
        if (endRegex.test(content)) {
            // we have to replace and keep the // ----- part
            content = content.replace(endRegex, (match) => {
                const commentPart = match.match(/\/\/ -+/)[0];
                return "</AnimatePresence>,\n            document.body\n            )}\n        </>\n    );\n}\n" + (match.includes('\n\n') ? '\n' : '') + commentPart;
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Fixed " + filePath);
        } else {
            console.log("Could not find end block in " + filePath);
        }
    } else {
        console.log("Could not find start block in " + filePath);
    }
}

fixFile('src/components/admin/AdminDashboard.js');
fixFile('src/components/superadmin/SuperAdminDashboard.js');
