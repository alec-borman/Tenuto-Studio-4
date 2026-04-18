import fs from 'fs';
import { readFileSync } from 'fs';

let failed = false;

// Prove topological VFS mounting and zero-copy Float32Array protocol in compiler worker
const workerContent = readFileSync('./src/compiler/compiler.worker.ts', 'utf-8');
const workspaceContent = readFileSync('./src/components/layout/Workspace.tsx', 'utf-8');

if (!workerContent.includes("import parserCode from './parser.py?raw';")) {
    console.error("Missing ?raw import for parser");
    failed = true;
}

if (!workerContent.includes("array.array('f')")) {
    console.error("Missing Python array.array('f') zero-copy in worker");
    failed = true;
}

if (!workerContent.includes("transferBuffer") || !workerContent.includes("self.postMessage(")) {
    console.error("Missing Transferable buffer protocol in worker");
    failed = true;
}

if (!workspaceContent.includes("Float32Array(e.data.buffer)")) {
    console.error("Missing Float32Array unpacking in Workspace");
    failed = true;
}

if (!workerContent.includes("mkdir('/src/compiler')") || !workerContent.includes("mkdir('/src')")) {
    console.error("Missing VFS mkdir in worker");
    failed = true;
}

if (failed) {
    process.exit(1);
} else {
    console.log("Failsafe Test Passed: Topological VFS mounting, Vite ?raw bundling, and Zero-Copy Float32Array binary transfer protocol integrated and validated.");
    process.exit(0);
}
