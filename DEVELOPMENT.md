Development
===========

If you would like to contribute to the CometVisu project there are some things you should know
to get started.

Preparation
-----------

The new build system requires a node environment. Sou have to run `npm install` once to install
all required modules for development.

After cloning the sources or updating from 0.10.x you have to do the following steps once:

```
git submodule init
git submodule update
```
 
Building source and build versions
---------------------------------

**Short version**

Execute `npx qx compile --watch`, let your webserver serve the folder `compiled/source`, open
the URL `http://localhost:8082` in your browser and start to develop.

**In Detail:**

Since version >= 0.11.0 the CometVisu sources are based on the
[Qooxdoo-Framework](http://www.qooxdoo.org) and since version 0.12.0 it uses the new qooxdoo compiler. 
To develop, test and debug your changes you can work with a source version of the code, 
which can be compiled by executing`npx qx compile` in your console.

The most useful build commands are:
* `npx qx compile` generates a source version of the cometvisu in the subfolder `compiled/source`.

    Ideal for debugging and development, just serve the folder with your favorite web browser.
     
* `npx qx compile --target=build` generates a minified build version in the subfolder `compiled/build`.

    Not useful for debugging, only as a final test that the build is working. This is how CometVisu releases
    are made.
    
The qooxdoo compiler works as a transpiler, which requires a re-compilation after every change made in the code.
It is recommended to run the compiler in watch mode `npx qx compile --watch` during development.
In this mode the compiler will recognize every change made in the code and automatically re-compile.
    
Pulling changes
---------------

If there have been changes in submodules of the project you have to run `git submodule update` to get those changes.

Other useful resources you may find useful during development are:

* The Qooxdoo-Documentation (only the core part): http://www.qooxdoo.org/current/
* The API: http://cometvisu.org/CometVisu/en/latest/api/
