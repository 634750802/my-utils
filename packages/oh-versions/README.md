## Why?

When we are developing some overriding code like discourse theme/component,
it's usually difficult to sync codes manually.

This cli make it available to check out code from any version and build to any
versions (even multiple versions).

It's recommend to use this tool to manage small changes.

## How?

1. checkout a file from certain branch or tag or commit
2. edit the file
3. migrate the file to versions you want

```shell
npm i oh-versions

#  Create a .oh-versions.mjs with basic init codes
#  You should edit the repo and path config in this file.
oh-versions init

#  Checkout files from github main branch if not exists, use tag name
# if need.
oh-versions touch main 'templates/components/badge-title.hbs' 
oh-versions touch v2.8.2 'templates/components/application.hbs' 

# ...
# Edit source file
# ...

#  Migrate from source to all versions you defined.
#  All files from source root will apply patches from their own version
# to target version. So you could keep old version source file if you
# don't want to keep source code updated. ()
oh-versions migrate v3.0.0 v3.0.1 v2.9.0
```
