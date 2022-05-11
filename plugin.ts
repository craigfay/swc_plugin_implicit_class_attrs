
import { JSXAttributeOrSpread } from "@swc/core"
import { Visitor } from "@swc/core/Visitor.js";


// Defining the input type that the SWC Plugin will receive
export type Options = {
  classList: Set<String> | Array<String>
}


// Defining the SWC Plugin
// https://swc.rs/docs/usage/plugins
export class ImplicitClassAttrs extends Visitor {
  classList: Set<String>;

  constructor(options: Options) {
    super();
    this.classList = new Set(options?.classList ?? []);
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
