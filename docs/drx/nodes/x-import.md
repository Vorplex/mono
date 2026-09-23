# \<x-import>

Splices another file's content in at the tag's position, resolved before compilation — treat it as a literal paste, not a lazy-loaded module. Use it to split a large app across multiple files (a shared header, a script, a stylesheet) instead of inlining everything into one `.drx` document.

```html
<x-import></x-import>
```

| Attribute | Description                |
| --------- | -------------------------- |
| **src**   | Path to the file to splice in |

A `.drx` file splices in as markup; a `.ts` file becomes an inline `<script type="application/typescript">`; a `.css` file becomes an inline `<style>`.

## Example
```html
<x-app>
    <x-import src="./header.drx"></x-import>
    <x-import src="./app.ts"></x-import>
    <x-import src="./app.css"></x-import>

    <h1>Home</h1>
</x-app>
```
