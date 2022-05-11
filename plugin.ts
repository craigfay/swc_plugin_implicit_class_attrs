
import { JSXAttributeOrSpread, JSXAttribute, SpreadElement, StringLiteral } from "@swc/core"
import { Visitor } from "@swc/core/Visitor.js";
import exp from "constants";


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

    // Sorting attributes into categories
    let nonSpreadAttrs: JSXAttribute[] = attrs.filter(n => n?.type == "JSXAttribute") as JSXAttribute[]
    let spreadAttrs = attrs.filter(n => n?.type == "SpreadElement") as SpreadElement[]
    let explicitClassAttr = nonSpreadAttrs.find(n => n.name.type == 'Identifier' && n.name?.value == "class");
    let nonClassAttrs = nonSpreadAttrs.filter(n => n.name.type == 'Identifier' && n.name?.value != "class")

    // Providing sensible defaults for the explicit class attribute.
    // This is only relevant when a JSX element has no class attribute.
    const defaultSpan = { start: 0, end: 0, ctxt: 0 };
    const defaultValue: StringLiteral = { type: 'StringLiteral', value: '', hasEscape: false, span: defaultSpan }

    if (!explicitClassAttr) {
      explicitClassAttr = {
        type: 'JSXAttribute',
        name: { type: 'Identifier', value: 'class', optional: false, span: defaultSpan },
        value: explicitClassAttr?.value.type != "StringLiteral" ? defaultValue : explicitClassAttr.value,
        span: defaultSpan,
      }
    }

    // Declaring a list of classes, either passed explicitly using
    // the `class` attribute, or implicitly as value-less attributes
    const allClasses = (explicitClassAttr?.value as StringLiteral)?.value.split(' ') ?? []

    // Searching for implicit class attributes
    nonClassAttrs.forEach((attr, idx) => {
      if (attr.name.type == 'Identifier' && this.classList.has(attr.name.value)) {
        allClasses.push(attr.name.value);
        implicitClassAttrIndexes.add(idx);
      }
    })

    // Adding the list of implicit classes to an explicit class attribute.
    // This condition should always be true, but helps with type checking.
    if (explicitClassAttr.value.type == 'StringLiteral') {
      explicitClassAttr.value.value = allClasses.join(' ');
    }

    return [
      explicitClassAttr,
      ...nonClassAttrs.filter((_, i) => !implicitClassAttrIndexes.has(i)),
      ...spreadAttrs,
    ]
  }
}
