import widget from "virtual:glasshome-widget";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";

function PreviewHost() {
  const [isDark, setIsDark] = createSignal(false);
  const [config, setConfig] = createSignal(widget.manifest.defaultConfig || {});

  const toggleDark = () => {
    const next = !isDark();
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const WidgetComponent = widget.component;

  return (
    <div
      style={{
        "max-width": "600px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <header
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          "margin-bottom": "24px",
          "padding-bottom": "16px",
          "border-bottom": "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1 style={{ "font-size": "1.5rem", "font-weight": "bold" }}>{widget.manifest.name}</h1>
          <p
            style={{
              "font-size": "0.875rem",
              opacity: 0.7,
              "margin-top": "4px",
            }}
          >
            &lt;{widget.manifest.tag}&gt; | {widget.manifest.type} | {widget.manifest.size}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleDark}
          style={{
            padding: "8px 16px",
            "border-radius": "6px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-foreground)",
            cursor: "pointer",
            "font-size": "0.875rem",
          }}
        >
          {isDark() ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      <section
        style={{
          padding: "24px",
          border: "1px solid var(--color-border)",
          "border-radius": "8px",
          background: "var(--color-background)",
        }}
      >
        <WidgetComponent config={config()} />
      </section>

      <footer
        style={{
          "margin-top": "16px",
          "font-size": "0.75rem",
          opacity: 0.5,
          "text-align": "center",
        }}
      >
        GlassHome Widget Preview | SDK {widget.manifest.sdkVersion}
      </footer>
    </div>
  );
}

render(() => <PreviewHost />, document.getElementById("root")!);
