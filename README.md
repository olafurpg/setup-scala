# Setup Scala GitHub Action

A GitHub Action to install Java via [Jabba](https://github.com/features/actions)
and sbt.

- Configurable Java version: supports OpenJDK, GraalVM, Zulu and any other Java
  version that's installable via Jabba.
- The `sbt` command is installed using the
  [sbt-extras](https://github.com/paulp/sbt-extras/) launcher.
- For faster startup, the `csbt` command is installed using the Coursier-based
  [sbt-extras](https://github.com/paulp/sbt-extras/) launcher. This launcher
  does not work with all builds, only use `csbt` if you know what you are doing.

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
+     - uses: olafurpg/setup-scala@v2
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
      - uses: olafurpg/setup-scala@v2
+       with:
+         java-version: adopt@1.11
      - name: Compile
        run: sbt compile
```

More Java version examples:

- `graalvm@`: the latest GraalVM
- `openjdk@1.14`: the latest OpenJDK 14 version
- `zulu@1.11`: the latest Zulu OpenJDK 11
