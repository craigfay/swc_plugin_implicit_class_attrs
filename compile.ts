import { JSXAttributeOrSpread, transform } from "@swc/core"
import fs from 'fs'

import { Visitor } from "@swc/core/Visitor.js";




// Defining the input type that the SWC Plugin will receive
type Options = {
  classList: Set<String> | Array<String>
}


// Defining the SWC Plugin
// https://swc.rs/docs/usage/plugins
class ImplicitClassAttrs extends Visitor {
  classList: Set<String>;

  constructor(options: Options) {
    super();
    this.classList = new Set(classList);
  }

  visitJSXAttributes(attrs: JSXAttributeOrSpread[] | undefined): JSXAttributeOrSpread[] {
    if (!attrs) return [];

    // A set of Array indexes that belong to attributes
    // that should be excluded from the result
    const implicitClassAttrIndexes = new Set();

    let explicitClassAttr = attrs.find(n => n?.name?.value == "class");
    let nonClassAttrs = attrs.filter(n => n?.name?.value != "class")

    // Providing a default class attribute
    if (!explicitClassAttr) {
      explicitClassAttr = {
        type: 'JSXAttribute',
        name: { type: 'Identifier', value: 'class', optional: true, span: null },
        value: { type: 'StringLiteral', value: '', hasEscape: false, span: null },
        span: null,
      }
    }

    // Declaring a list of classes, either passed explicitly using
    // the `class` attribute, or implicitly as value-less attributes
    const allClasses = explicitClassAttr?.value?.value.split(' ') ?? []

    // Searching for implicit class attributes
    nonClassAttrs.forEach((attr, idx) => {
      if (attr.value == null && this.classList.has(attr.name.value)) {
        allClasses.push(attr.name.value);
        implicitClassAttrIndexes.add(idx);
      }
    })

    // Adding the list of implicit classes to an explicit class attribute
    explicitClassAttr.value.value = allClasses.join(' ');

    return [
      ...nonClassAttrs.filter((_, i) => !implicitClassAttrIndexes.has(i)),
      explicitClassAttr,
    ]
  }
}

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
