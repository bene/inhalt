#!/usr/bin/env bun

const url = import.meta.env.INHALT_URL ?? "https://cloud.inhalt.io";
const token = import.meta.env.INHALT_TOKEN;
const projectRoot = import.meta.env.INHALT_PROJECT_ROOT ?? process.cwd();

console.log({ projectRoot });
