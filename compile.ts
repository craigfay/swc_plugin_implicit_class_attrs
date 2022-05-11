import { ImplicitClassAttrs } from "./plugin";
import { transform } from "@swc/core"
import fs from 'fs'

// Declaring an example class list for prototyping purposes
const classList = new Set([
  "text-xl",
  "color-red"
])

const sourceCode = fs.readFileSync('./input.jsx', 'utf8');

transform(sourceCode, {
  filename: "input.js",
  sourceMaps: true,
  isModule: false,
  jsc: {
    parser: {
      syntax: "ecmascript",
      jsx: true,
    },
    transform: {},
  },
  // Using the plugin defined above
  plugin: m => new ImplicitClassAttrs({ classList }).visitProgram(m),
})
  .then((output) => {
    if (!fs.existsSync('./dist')){
      fs.mkdirSync('./dist', { recursive: true });
    }

    fs.writeFileSync('./dist/output.js', output.code);
    fs.writeFileSync('./dist/output.map.js', output.map);
  });
