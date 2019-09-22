import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";

export async function install(version: number) {
  shell
    .exec("curl -sL https://github.com/shyiko/jabba/raw/master/install.sh")
    .exec("bash");
  const homedir = require("os").homedir();
  const jabba = path.join(homedir, ".jabba", "bin", "jabba");
  const toInstall = shell
    .exec(`${jabba} ls-remote`)
    .grep(`adopt@1.${version}`)
    .head({ "-n": 1 })
    .stdout.trim();
  console.log(`Installing ${toInstall}`);
  shell.exec(`${jabba} install ${toInstall}`);
  const javaHome = shell.exec(`${jabba} which --home ${toInstall}`).stdout;
  core.exportVariable("JAVA_HOME", javaHome);
}
