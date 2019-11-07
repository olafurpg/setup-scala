# Setup Scala GitHub Action

A GitHub Action to install Java via [Jabba](https://github.com/features/actions)
and sbt.

- Configurable Java version: supports OpenJDK, GraalVM, Zulu and any other Java
  version that's installable via Jabba.
- The `sbt` command is installed using the
  [paulp/sbt-extras](https://github.com/paulp/sbt-extras/) launcher.
- For faster startup, the `csbt` command is installed using the Coursier-based
  [coursier/sbt-extras](https://github.com/coursier/sbt-extras/) launcher. This launcher
  does not work with all builds, only use `csbt` if you know what you are doing.
- Cross-platform: works on Linux, macOS, Windows.

## Usage:

In your GitHub Actions workflow, add a `uses:` declaration before calling the
`sbt` command.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on:
    push:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v1
+     - uses: olafurpg/setup-scala@v5
      - name: Compile
        run: sbt compile
```

The default Java version is the latest OpenJDK 8 HotSpot version via
[AdoptOpenJDK](https://adoptopenjdk.net/). To customize the Java version add a
`with:` declaration. For example, to use the latest AdoptOpenJDK 11 version

```diff
+++ .github/workflows/ci.yml
  name: CI
  on:
    push:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v1
      - uses: olafurpg/setup-scala@v5
+       with:
+         java-version: adopt@1.11
      - name: Compile
        run: sbt compile
```

More Java version examples:

- `graalvm@`: the latest GraalVM
- `openjdk@1.14`: the latest OpenJDK 14 version
- `zulu@1.11`: the latest Zulu OpenJDK 11

## Tips and tricks

Some suggestions that may be helpful when using GitHub Actions.

### Disable `fail-fast` strategy

By default, GitHub Actions stops running jobs on the first failure. Add the
following configuration to ensure that all jobs run on every PR even if one job
fails.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
+     strategy:
+       fail-fast: false
      steps:
      - uses: actions/checkout@v1
      - uses: olafurpg/setup-scala@v2
      - name: Compile
        run: sbt compile
```

### Browsing raw logs

Searching through large logs in the GitHub Actions web UI can be slow sometimes.
It can be faster to look at the raw logs instead.

![](https://i.imgur.com/Xu29gwb.png)

### Configuring Windows jobs

When running jobs on Windows, you may want to default to the `bash` shell and
configure git to disable Windows line feeds.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on: [push]
  jobs:
    build:
-     runs-on: ubuntu-latest
+     runs-on: windows-latest
      steps:
+     - name: Configure git
+       run: "git config --global core.autocrlf false"
+       shell: bash
      - uses: actions/checkout@v1
      - uses: olafurpg/setup-scala@v2
      - name: Compile
+       shell: bash
        run: sbt compile
```
