#!/usr/bin/env node
import { existsSync } from 'node:fs';
if (!existsSync('content/questions.json')) { console.log('Question bank not present yet; validation deferred to E3.'); process.exit(0); }
console.log('Question bank validation is supplied by the content integration task.');
