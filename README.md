# @glasshome/widget-sdk

SDK for building GlassHome dashboard widgets with SolidJS.

## Install

```bash
bun add @glasshome/widget-sdk
```

## Quick Start

```tsx
import { defineWidget } from "@glasshome/widget-sdk";
import { Card } from "@glasshome/ui";

function MyWidget(props: { config: { label: string } }) {
  return <Card>{props.config.label}</Card>;
}

export default defineWidget({
  manifest: {
    tag: "glasshome-my-widget",
    type: "status",
    name: "My Widget",
    size: "small",
    sdkVersion: "^0.1.0",
    defaultConfig: { label: "Hello" },
  },
  component: MyWidget,
});
```

## Documentation

Full docs at [glasshome.app/docs](https://glasshome.app/docs)

## License

MIT
