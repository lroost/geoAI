## Source

Tailwind CSS automatically detects source files, but ignores a few folders such as your `node_modules`.

Here's how you can explicictly set the source files in your main CSS file:

```css
@import "tailwindcss";

@source "../node_modules/flowbite";
```

This will scan the Flowbite folder inside your installed packages for Tailwind classes.

