// Ambient declaration for the `?raw` Vite import query.
//
// The SDK's own tsconfig pulls "vite/client" into `types`, which declares
// `*?raw` globally. Downstream consumers using the `@glasshome/source`
// customCondition (e.g. packages/public/widgets) compile SDK source directly
// without vite/client in their `types`, so they need this sibling ambient
// declaration to resolve the import at type-check time.
declare module "*.css?raw" {
  const content: string;
  export default content;
}
