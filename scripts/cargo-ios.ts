import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";

const TARGETS = {
  ios: "aarch64-apple-ios",
  "ios-sim": "aarch64-apple-ios-sim",
};

function cargoBuild(target: string) {
  spawnSync("cargo", ["build", "--release", "--target", target], {
    stdio: "inherit",
  });
}

function getTarget() {
  const args = process.argv.slice(2);
  const target = (args[0] ?? "").replace("--target=", "");

  if (target !== "ios" && target !== "ios-sim") {
    console.error(
      `Invalid target ${target} found. Please specify --target='ios' or --target='ios-sim'`
    );
    process.exit(1);
  }

  return target;
}

function main() {
  const target = TARGETS[getTarget()];
  console.log(`Building ios for target ${target}`);

  process.chdir("libsignal-dezire");

  console.log("Building rust library for ios");
  Object.values(TARGETS).forEach(cargoBuild);

  // console.log("Generating bindings for ios");
  // spawnSync(
  //   "cbindgen",
  //   [
  //     "--lang",
  //     "c",
  //     "--crate",
  //     "libsignal-dezire",
  //     "--output",
  //     "libsignal-dezire.h",
  //   ],
  //   {
  //     stdio: "inherit",
  //   }
  // );

  process.chdir("..");

  const destinationPath = path.join(
    process.cwd(),
    "modules",
    "libsignal-dezire",
    "ios",
    "rust"
  );
  const rustLibPath = path.join(
    process.cwd(),
    "libsignal-dezire",
    "target",
    target,
    "release",
    "liblibsignal_dezire.a"
  );
  // const rustHeadersPath = path.join(
  //   process.cwd(),
  //   "libsignal-dezire",
  //   "libsignal-dezire.h"
  // );

  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }
  fs.copyFileSync(
    rustLibPath,
    path.join(destinationPath, "liblibsignal_dezire.a")
  );
  // fs.copyFileSync(
  //   rustHeadersPath,
  //   path.join(destinationPath, "libsignal-dezire.h")
  // );
}

main();
