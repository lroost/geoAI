## Documentation sections

### Getting started

#### Introduction

Flowbite is an open-source library of UI components based on the utility-first Tailwind CSS framework featuring dark mode support, a Figma design system, templates, and more.

It includes all of the commonly used components that a website requires, such as buttons, dropdowns, navigation bars, modals, but also some more advanced interactive elements such as datepickers. 

All of the elements are built using the utility classes from Tailwind CSS and vanilla JavaScript with support for TypeScript.

Here's a quick overview of the Flowbite ecosystem including the open source Tailwind components library, the Figma design files, and the pro version.

<div class="mt-10 lg:grid lg:grid-cols-2 lg:gap-8">
    <a href="{{< ref "getting-started/quickstart" >}}" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Quickstart</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Learn how to get started by downloading and configuring Flowbite locally on your machine and start developing.</p>
    </a>
    <a href="{{< ref "components/alerts" >}}" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Components</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Explore the Tailwind CSS elements such as buttons, navbars, alerts, dropdowns and use them to build your website.</p>
    </a>
    <a href="{{< param homepage >}}/figma/" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Figma design files</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Prototype and design your website before coding with the Flowbite Figma file which is based on the Tailwind CSS classes.</p>
    </a>
    <a href="{{< param homepage >}}/icons/" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Flowbite Icons</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Free and open-source collection of over 430 solid and outline styled SVG icons to use with our UI component library and Figma.</p>
    </a>
    <a href="{{< param homepage >}}/pro/" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Flowbite Blocks</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Take your Figma and Tailwind CSS development to the next level with thousands more elements and pages with Flowbite Pro.</p>
    </a>
    <a href="{{< param homepage >}}/pro/" class="block p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-700 lg:mb-0">
        <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Upgrade to Pro</h3>
        <p class="font-normal text-gray-600 dark:text-gray-400">Check out over 450+ website sections and advanced UI components built with Tailwind CSS and the Flowbite Library.</p>
    </a>
</div>

##### Using Flowbite

One of the disadvantages of Tailwind CSS compared to other frameworks is that it doesn't have a base set of components. This makes it really hard to quickly prototype a user interface. 

This is where Flowbite comes into play: it's basically Tailwind CSS, but you get all of the components that you would normally get with a classic CSS framework like Bootstrap or Bulma.

There are over 56 types of UI components including buttons, alerts, breadcrumbs, pagination, and navbars. Flowbite also includes some custom JavaScript that enables interactive components, such as dropdowns, modals, tooltips, and many more. 

##### Getting started

Flowbite is technically a plugin that can be included into any existing Tailwind CSS project. To get started, you first need to make sure that you have a working Tailwind CSS project installed and that you also have Node and NPM installed on your machine.

##### Install using NPM

Make sure that you have <a href="https://nodejs.org/en/" rel="nofollow" target="_blank">Node.js</a> and <a href="https://tailwindcss.com/docs/installation/using-postcss" rel="nofollow" target="_blank">Tailwind CSS</a> installed. This guide works with Tailwind v4.

1. Install Flowbite as a dependency using NPM by running the following command:

```bash
npm install flowbite
```

2. Import the default theme variables from Flowbite inside your main `input.css` CSS file:

```css
@import "flowbite/src/themes/default";
```

3. Import the Flowbite plugin file in your CSS:

```css
@plugin "flowbite/plugin";
```

4. Configure the source files of Flowbite in your CSS:

```css
@source "../node_modules/flowbite";
```

5. Include the JavaScript code that powers the interactive elements before the end of your `<body>` tag:

```html
<script src="../path/to/flowbite/dist/flowbite.min.js"></script>
```

Learn more about the Flowbite JavaScript API and functionalities in the [JavaScript section](https://flowbite.com/docs/getting-started/javascript/).

If you have and old project with Tailwind CSS v3 then [check out this guide](#tailwind-css-v3-to-v4) to learn how to upgrade to v4.

##### Include using CDN

The quickest way to get started working with Flowbite is to include the CSS and JS into your project via CDN.

Require the following minified stylesheet inside the `head` tag:

```html
<link href="https://cdn.jsdelivr.net/npm/flowbite@{{< current_version >}}/dist/flowbite.min.css" rel="stylesheet" />
```

And include the following JavaScript file before the end of the `body` element:

```html
<script src="https://cdn.jsdelivr.net/npm/flowbite@{{< current_version >}}/dist/flowbite.min.js"></script>
```

Please remember that the best way to work with Tailwind CSS and Flowbite is by purging the CSS classes.

##### Bundled JavaScript

One of the most popular way of using Flowbite is to include the bundled Javascript file which is UMD ready using a bundler such as Webpack or Parcel which makes sure that all of the data attributes and functionality will work out-of-the-box.

You can directly import the main JavaScript file inside your bundled `app-bundle.js` file like this:

```javascript
import 'flowbite';
```

This file has access to all of the components and it automatically applies event listeners to the data attributes.

##### Data attributes

The preferred way to use the interactive UI components from Flowbite is via the data attributes interface which allows us to add functionality via the HTML element attributes and most of the examples on our documentation applies this strategy.

For example, to set up a modal component all you need to do is use `data-modal-target` and `data-modal-{toggle|show|hide}` to toggle, show, or hide the component by clicking on any trigger element.

##### Init functions

You can also use the init functions to set up the event listeners yourself. Here's an example how you can do it with Vue or Nuxt:

```javascript
<script setup>
import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'

// initialize components based on data attribute selectors
onMounted(() => {
    initFlowbite();
})
</script>

<template>
    // Modal HTML markup with data attributes from Flowbite
</template>
```

The `initFlowbite` function sets up all of the init functions for dropdowns, modals, navbars, tooltips and so on to hook onto the data attributes. Alternatively, you can also initialise each component category class separately with `initDropdowns` or `initModals`.

You can view more examples by browsing the [components from Flowbite](#components).

##### ESM and CJS

Flowbite also offers an API for using the components programmatically and it supports both CJS and ESM for JavaScript which can be helpful if you need to expand the default capabilities of the data attributes interface and get access to function callbacks.

Here's an example how you can import and create a new Modal component inside JavaScript:

```javascript
import { Modal } from 'flowbite'

const $modalElement = document.querySelector('#modalEl');

const modalOptions = {
    placement: 'bottom-right',
    backdrop: 'dynamic',
    backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
    onHide: () => {
        console.log('modal is hidden');
    },
    onShow: () => {
        console.log('modal is shown');
    },
    onToggle: () => {
        console.log('modal has been toggled');
    }
}

const modal = new Modal($modalElement, modalOptions);

modal.show();
```

Check out the JavaScript behaviour section of each component's page to learn how you can use this.

##### TypeScript

Flowbite supports type declarations for the interactive UI components including object interfaces and parameter types. Check out the following examples to learn how you can use types with Flowbite.

Additionally to our code above, we will now import some relevant types from the Flowbite package, namely the `ModalOptions` and `ModalInterface`:

```javascript
import { Modal } from 'flowbite'
import type { ModalOptions, ModalInterface } from 'flowbite'
import type { InstanceOptions } from 'flowbite';

// other code
```

Learn more about Flowbite and TypeScript in the [quickstart guide](https://flowbite.com/docs/getting-started/typescript/).

##### Figma Design System

The components from Flowbite are first conceptualized and designed in Figma using the latest features such as variants, auto-layout, grids, responsive layouts, and more.

Learn more by checking out <a href="{{< param homepage >}}/figma/">Flowbite's Figma design system</a> and start designing your Tailwind CSS projects before actually coding them.

##### Flowbite SVG Icons

Check out a free and open-source collection of over 430 SVG icons with solid and outline styles to integrate with the UI components from Flowbite.

Learn more by browsing the <a href="{{< param homepage >}}/icons/">Flowbite Icons</a> page and interface to directly copy-paste the icons into your project as raw SVGs or React (JSX) code.

##### Flowbite GPT

We've developed a custom trained ChatGPT model that you can use to generate website sections and pages based on the resources from Flowbite and Tailwind CSS.

Start generating with [Flowbite GPT](https://chat.openai.com/g/g-y7yC35HB9-flowbite-gpt).

##### Pro version

If you want to take your Tailwind development workflow to the next level you can check out the [pro version of Flowbite]({{< param homepage >}}/pro/) which includes fully coded pages and layouts for application, marketing, and e-commerce user interfaces.

##### Work with us

If you're ready to take your application to the next level you can [work with us](https://flowbite.com/work-with-us/) on your project with developers who have been using Flowbite and Tailwind CSS.

##### Learn Design Concepts

If you want to create even better Flowbite pages, learn design fundamentals from [Teach Me Design - Enhance UI](https://www.enhanceui.com/?ref=flowbite-introduction), a book that covers color theory, typography, UI and UX so you can make the most to implement the Flowbite Ecosystem!

##### Tailwind CSS v3 to v4

If you want to upgrade v3 from Tailwind CSS with Flowbite you have to follow the <a href="https://tailwindcss.com/docs/v4-beta" rel="nofollow" target="_blank">v4 upgrade guide</a>.

1. Install the next versions of Tailwind CSS and Flowbite using NPM:

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

2. Add the PostCSS plugin inside the `postcss.config.js` file:

```bash
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

3. Remove the old directives in your main CSS file and import Tailwind:

```bash
@import "tailwindcss";
```

4. Use the `@config` directive to import the old configuration file from your project:

```bash
/* add this to copy the configuration settings from your project */
@config "../tailwind.config.js";
```

5. Compile the source CSS file using NPX:

```bash
npx @tailwindcss/cli -i input.css -o output.css
```

Now you should be good to go! Check the <a href="https://tailwindcss.com/docs/upgrade-guide#changes-from-v3" rel="nofollow" target="_blank">deprecated changes from v3</a> to learn more about the new features.

##### Tailwind CSS v3

We recommend you to follow the upgrade guide from v3 to v4 since Flowbite works with both.

##### Tailwind CSS v2

Flowbite works with the 2.x version of Tailwind CSS.

##### WindiCSS

Flowbite also works with WindiCSS by including the plugin inside the `windi.config.js` file:

```bash
plugins: [
    require('flowbite/plugin-windicss')
],
```

##### React

If you're using React as a front-end library you can also use the components from Flowbite including the interactive ones such as the dropdowns, modals, and tooltips as long as you install Tailwind CSS and Flowbite in an existing project.

Learn how to <a href="{{< ref "getting-started/react" >}}">install Tailwind CSS and Flowbite with React</a>.

##### Next.js

If you're using React as a front-end library and Next.js as a framework you can also use the components from Flowbite React such as the modals, dropdowns, and navbars to speed up your development time coupled with the utility classes from Tailwind CSS.

Learn how to <a href="{{< ref "getting-started/next-js" >}}">install Tailwind CSS and Flowbite with Next.js and React</a>.

##### Vue.js

The components from Flowbite can also be used any new or existing Vue 3 projects as long as you install Tailwind CSS and Flowbite.

Learn how to <a href="{{< ref "getting-started/vue" >}}">install Tailwind CSS and Flowbite with Vue.js</a>.

##### Nuxt

If you're using Vue 3 as a front-end library and Nuxt as a framework you can also use the components from Flowbite Vue such as the modals, dropdowns, and navbars to speed up your development time coupled with the utility classes from Tailwind CSS.

Learn how to <a href="{{< ref "getting-started/nuxt-js" >}}">install Tailwind CSS and Flowbite with Nuxt and Vue 3</a>.

##### Laravel

If you're running a Laravel application you can easily set up Tailwind CSS and Flowbite and start developing user interfaces based on the utility-first classes and components.

Learn how to <a href="{{< ref "getting-started/laravel" >}}">install Tailwind CSS and Flowbite with Laravel</a>.

##### Svelte

If you're using a Svelte application you can install a standalone Flowbite Svelte library and start developing modern websites using the components from Flowbite and the utility classes from Tailwind CSS.

Learn how to <a href="{{< ref "getting-started/svelte" >}}">install Tailwind CSS and Flowbite with Svelte</a>.

##### Angular

You can read our official guide to learn how to set up a new Angular project together with Tailwind CSS and Flowbite to start building advanced web applications with Google's framework.

Learn how to <a href="{{< ref "getting-started/angular" >}}">install Tailwind CSS and Flowbite with Angular</a>.

##### Ruby on Rails

If you're using a Ruby on Rails project you can install Tailwind CSS with Flowbite and start building web pages using the utility-first classes and the interactive UI compnonents from Flowbite.

Learn how to <a href="{{< ref "getting-started/rails" >}}">install Tailwind CSS and Flowbite with Ruby on Rails</a>.

##### Django

Check out the Django integration guide with Tailwind CSS and Flowbite to set up all technologies and start developing even faster using the UI components from Flowbite.

Learn how to <a href="{{< ref "getting-started/django" >}}">install Tailwind CSS and Flowbite with Django</a>.

##### Flask

Check out the Flask integration guide with Tailwind CSS and Flowbite to set up all technologies and start developing with a micro framework combined with the UI components from Flowbite.

Learn how to <a href="{{< ref "getting-started/flask" >}}">install Tailwind CSS and Flowbite with Flask</a>.

##### Licensing

The library of components from Flowbite is open source under the [MIT License]({{< ref "getting-started/license" >}}).

##### Contributions

Flowbite is an open source library under the MIT license and anyone who would like to contribute to the codebase or design is welcome to do so. 

Please reach out to us via the <a href="https://github.com/themesberg/flowbite">official Github repository</a> and the main development team will get in touch as soon as possible.

##### Discord community

Feel free to join our <a href="https://discord.gg/4eeurUVvTy" rel="nofollow">community on Discord</a> to receive help, contribute to the project, or just discuss about Flowbite, Tailwind CSS, and web development in general.

##### YouTube channel

You can also subscribe to the official [Flowbite YouTube channel](https://www.youtube.com/channel/UC_Ms4V2kYDsh7F_CSsHyQ6A) to view tutorials on how you can use the Flowbite ecosystem to design and build websites.

##### Authors

- <a href="https://twitter.com/zoltanszogyenyi">Zoltán Szőgyényi</a> (web developer)
- <a href="https://twitter.com/RobertTanislav">Robert Tanislav</a> (web designer)

#### JavaScript

[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) is one of the most popular programming languages in the world, basically powering the client side of nearly 98% percent of all websites alongside HTML and CSS. It is a high-level language which uses dynamic typing and supports features such as object orientation, first-class functions and the web based API allows you access to the DOM (Document Object Model).

Flowbite uses JavaScript to power the interactivity of the more complex UI components such as datepickers, dropdowns, and modals while also leveraging the utility classes from Tailwind CSS. 

There are two main ways you can use JavaScript to power the interactive UI components:

- use the data attributes interface and include the Flowbite JavaScript via NPM or CDN
- programmatically create instances of the UI components and call methods and attach events to elements

On this page you will learn how to leverage the Flowbite API to work with the interactivity part of the UI library and how you can customize the default behaviour of the UI components using JavaScript.

##### Flowbite API

Flowbite is written in JavaScript with optional support for TypeScript and provides an extensive API for the interactive UI components that you use by creating new instances of the objects, setting them up with various options, calling methods such as to show or hide a component and even access a global instance manager to get access to the initialised objects.

Each component page on the documentation has a section called "JavaScript Behaviour" that documents how you can create and manage an object such as a Modal, Carousel, Dropdown, or any other interactive UI components that requires JavaScript to function.

Here is an extensive example on how you can work with the Modal component:

```javascript
// set the modal menu element
const $targetEl = document.getElementById('modalEl');

// options with default values
const options = {
  placement: 'bottom-right',
  backdrop: 'dynamic',
  backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
  closable: true,
  onHide: () => {
      console.log('modal is hidden');
  },
  onShow: () => {
      console.log('modal is shown');
  },
  onToggle: () => {
      console.log('modal has been toggled');
  }
};
```

Create a new Modal object based on the options above.

```javascript
import { Modal } from 'flowbite';

/*
* $targetEl: required
* options: optional
*/
const modal = new Modal($targetEl, options);
```

Use the `show` and `hide` methods to show and hide the modal component directly from JavaScript.

```javascript
// show the modal
modal.show();

// hide the modal
modal.hide();
```

Use the `toggle` method to toggle the visibility of the modal.

```javascript
// toggle the modal
modal.toggle();
```

Use the `isHidden` or `isVisible` method to check if the modal is visible or not.

```javascript
// true if hidden
modal.isHidden();

// true if visible
modal.isVisible();
```

Please take into consideration that for this example you also need to have the appropriate HTML markup available on the page where the JS is loaded:

```html
<div id="modalEl" tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
    <div class="relative w-full max-w-2xl max-h-full">
        <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
            <div class="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-600">
                <h3 class="text-xl font-semibold text-gray-900 lg:text-2xl dark:text-white">
                    Terms of Service
                </h3>
                <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <div class="p-6 space-y-6">
                <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    With less than a month to go before the European Union enacts new consumer privacy laws for its citizens, companies around the world are updating their terms of service agreements to comply.
                </p>
                <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    The European Union’s General Data Protection Regulation (G.D.P.R.) goes into effect on May 25 and is meant to ensure a common set of data rights in the European Union. It requires organizations to notify users as soon as possible of high-risk data breaches that could personally affect them.
                </p>
            </div>
            <div class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">I accept</button>
                <button type="button" class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">Decline</button>
            </div>
        </div>
    </div>
</div>
```

Each component that requires JavaScript is well documented on their respective pages under the "JavaScript Behaviour" section as described above.

##### Data attributes

The recommended and quickest way of using Flowbite is to use the data attributes interface that automatically creates instances and behaviour for the UI components by applying inline data attributes to the HTML elements, thus making them interactive via the Flowbite JavaScript API.

All of the examples on the Flowbite Docs already have the data attributes applied and they are also documented just above the component preview. 

Here's an example of how you can set up the modal behaviour and apply "show" and "hide" actions:

{{< example id="default-modal-example" github="components/modal.md" class="flex justify-center" show_dark=true iframeHeight="600" >}}
<!-- Modal toggle -->
<button data-modal-target="default-modal" data-modal-toggle="default-modal" class="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
  Toggle modal
</button>

<!-- Main modal -->
<div id="default-modal" tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
    <div class="relative w-full max-w-2xl max-h-full">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Terms of Service
                </h3>
                <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-6 space-y-6">
                <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    With less than a month to go before the European Union enacts new consumer privacy laws for its citizens, companies around the world are updating their terms of service agreements to comply.
                </p>
                <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    The European Union’s General Data Protection Regulation (G.D.P.R.) goes into effect on May 25 and is meant to ensure a common set of data rights in the European Union. It requires organizations to notify users as soon as possible of high-risk data breaches that could personally affect them.
                </p>
            </div>
            <!-- Modal footer -->
            <div class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button data-modal-hide="default-modal" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">I accept</button>
                <button data-modal-hide="default-modal" type="button" class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Decline</button>
            </div>
        </div>
    </div>
</div>
{{< /example >}}

In order to create a modal with Tailwind CSS you only have to add `data-modal-target="modalId"` data attribute where `modalId` is the ID of the modal that you are targeting.

If you want to toggle the visibility, show, or hide the modal you can use the following data attributes where the value is the unique ID of the modal component:

- `data-modal-toggle="modalID"` - toggle the modal
- `data-modal-show="modalID"` - show the modal

This is just one example that shows you how Flowbite leverages the data attributes and sets up the JavaScript API, without having to create new instances of the objects yourself.

##### Init functions

If you want to programmatically call the initialisation functions when using data attributes (for example, you might want to call it after the DOM re-rendered) then you can use the `initFlowbite()` function or the separate component initialisation functions such as `initModals()` or `initDropdowns()` wherever you want in your JS code:

```javascript
<script type="application/javascript">
import { initFlowbite } from 'flowbite'

// initialize components based on data attribute selectors
initFlowbite();
</script>
```

Basically, the `initFlowbite()` function parses your DOM for all of the data attributes and creates new instances of the appropriate components like modals or dropdowns and sets up the behaviour of the examples from the Flowbite Docs - applying the functionality of showing and hiding the components such as hiding the modal when clicking on the "X" (close) button.

##### Instance manager

Since version `2.0.0`, the Flowbite JS API also provides a way to globally access all of the instances even if they were created via the data attributes interface. This allows you to programmatically handle the components while also giving you the possibility to use the recommended and quick way of accessing the data attributes interface and UI component examples.

After the window has loaded and the UI components from Flowbite have been initialised (either via CDN or the `initFlowbite()` function) you can use the following global object and methods to get access to the object instances:

```javascript
window.addEventListener('load', function() {
    const modal = FlowbiteInstances.getInstance('Modal', 'modal-id');
})
```

As you can see, the `FlowbiteInstances` global object has two main parameters:

- the first parameter is the component type which can be `Modal`, `Carousel`, `Dropdown` (ie. the name of the object class)
- the second parameter is the target ID or parent ID of the main element and it's always a string

If you provide the wrong category or ID then the console will give you a warning.

If you have provided the correct category and element ID then you can now access the object as if you've created it yourself and work with it programmatically via JavaScript:

```javascript
// show the modal
modal.show();

// hide the modal
modal.hide();
```

You can even remove the instance from the instance manager:

```javascript
// remove the instance object from the global FlowbiteInstances manager
modal.removeInstance();
```

You can also both destroy and remove the instance at the same time:

```javascript
modal.destroyAndRemoveInstance();
```

This in turn will basically remove the object instance from the global `flowbiteStorage` instance manager - you might want to do this if you want to reset certain elements from the DOM in single page applications.

Another example if you want to show or hide a tooltip that was created via data attributes would be:

```javascript
const tooltip = FlowbiteInstances.getInstance('Tooltip', 'tooltip-id');
```

And now you can show or hide the tooltip programmatically:

```javascript
// show the tooltip
tooltip.show();

// hide the tooltip
tooltip.hide();
```

You can call the `destroy()` and `init()` methods to re-calculate the positioning of the tooltip:

```javascript
// destroy the tooltip event listeners
tooltip.destroy();

// re-init the tooltip object and event listeners
tooltip.init();

// show the tooltip
tooltip.show();
```

A component is added to the `flowbiteStorage` global instance manager automatically when it's created via the `constructor` method of the object class, regardless of which component is being used from Flowbite.

Finally, you can also access all of the instances by calling the following method:

```javascript
FlowbiteInstances.getAllInstances();
```

Alternatively, you can also get all of the instances from one component pool such as from the modals:

```javascript
FlowbiteInstances.getInstances('Modal');
```

##### Instance options

When creating a new object you can also use the last parameter to set the `instanceOptions` object through which you can set custom options for the Instance manager:

```javascript
import type { InstanceOptions } from 'flowbite';

const instanceOptions: InstanceOptions = {
    id: "my-unique-id",
    override: true,
};

const modal = new Modal($targetEl, options, instanceOptions);
```

In this example, the ID of the instance that you can get it from the `FlowbiteInstances` global instance manager object will be `my-unique-id` instead of the `$targetEl` unique ID.

This can be used to override existing instances if you want to re-initialise the same component with different options, such as when using the collapse object for the same object ID.

In our default UI components we use this when we want to toggle the mobile navigation both with the hamburger menu icon and the search icon, even though the target element is the same.

##### TypeScript support

Flowbite has support for type declarations of the Flowbite JS API which helps you to keep your code more maintainable and predictable by giving you safety constraints for the parameters and object methods that you're using through your application.

Learn more about Flowbite and TypeScript in the [introduction guide](https://flowbite.com/docs/getting-started/typescript/).

##### Frameworks support

You can use all of the JS frameworks for the UI components that don't require JavaScript to function (such as buttons, badges, cards) and for the UI components that require JS to work you need to set up the `initFlowbite()` function whenever the DOM has rendered so that you can re-apply the event listeners and object instances to the HTML elements that have data attributes. Otherwise, you need to create the objects and set the event listeners yourself.

We have written integration guides for all major front-end and back-end frameworks - generally we have standalone libraries for the major front-end frameworks such as [Flowbite React](https://www.flowbite-react.com/), [Flowbite Svelte](https://www.flowbite-svelte.com/), and [Flowbite Vue](https://flowbite-vue.com/).

For all of the back-end frameworks we recommend the vanilla JS version of Flowbite which integrates very well with frameworks such as [Laravel](https://flowbite.com/docs/getting-started/laravel/), [Django](https://flowbite.com/docs/getting-started/django/), or [Flask](https://flowbite.com/docs/getting-started/flask/).

#### TypeScript

[TypeScript](https://www.typescriptlang.org/) is a free and open-source programming language that helps improve the scalability, maintainability, and readability of code. It does this by adding optional static typing to JavaScript. 

It is developed and maintained by Microsoft and used by companies such as Slack, Bitpanda, Accenture, Medium, and many more to help them scale code better.

This guide will teach you how to set up Tailwind CSS and the Flowbite library with TypeScript and also show you how you can use the components from Flowbite to power your Tailwind CSS application with integrated types and interfaces.

