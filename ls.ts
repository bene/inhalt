import { Glob } from "bun";

const glob = new Glob("*");

for (const file of glob.scanSync(".")) {
  console.log(file);
}

console.log(import.meta.dir);
console.log(import.meta.file);
