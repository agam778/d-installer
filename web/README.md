# D-Installer Web-Based UI

This Cockpit modules offers a UI to the [D-Installer service](file:../service). The code is based on
[Cockpit's Starter Kit
(b2379f7)](https://github.com/cockpit-project/starter-kit/tree/b2379f78e203aab0028d8548b39f5f0bd2b27d2a).

## Development

Cockpit searches for modules in the `$HOME/.local/share/cockpit` directory of the logged in user,
which is really handy when working on a module. To make the module available to Cockpit, you can
link your build folder (`dist`) or just rely on the `devel-install` task:

```
    make devel-install
```

Bear in mind that if something goes wrong while building the application (e.g., the linter fails),
the link will not be created.

While working on the code, you might want to run the following command to refresh the build
everytime you save a change:

```
    npm run watch
```

However, there is no live or hot reloading feature, so you need to reload the code in your browser.
You can visit the module through the following URL:
http://localhost:9090/cockpit/@localhost/d-installer/index.html.

## TypeScript Support

This project started as a JavaScript-only project and support for TypeScript was added later.
Therefore, although it is preferred to use TypeScript for the new code, it is perfectly fine to keep
using JavaScript for the time being.

We need to identify two different activities when it comes to TypeScript support:

* Code generation. We need to turn our TypeScript code into proper JavaScript so the run can run it.
* Type-checking. Apart from additional abstractions, type-checking is probably the most relevant
  TypeScript feature.

The TypeScript compiler (`tsc`) can type-check and transpile the code into JavaScript. However, as
we are already using [Babel](https://babeljs.io/), we decided to rely on it to generate the code.
The downside is that no type-check is performed.

We decided to keep the type-check as a separate step using the TypeScript compiler. `tsc` can check
the TypeScript and the JavaScript code using the JSDoc annotations for the latter. Hence, the
following command performs the type-check:

```
npm run check-types
```

Moreover, your editor (or IDE) of choice might help you with type-checking hints while working on
the project using the configuration included in the `tsconfig.json` file.

## JSDoc Documentation

```
npm run jsdoc
xdg-open jsdoc.out/index.html
```

GitHub Actions will automatically publish the result to
<https://d-installer-frontend.surge.sh/>
