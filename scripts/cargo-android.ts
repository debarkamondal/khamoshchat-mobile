import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";

const TARGET_TO_DESTINATION = {
  "aarch64-linux-android": "arm64-v8a",
  "armv7-linux-androideabi": "armeabi-v7a",
  "i686-linux-android": "x86",
  "x86_64-linux-android": "x86_64",
} as const;

function build(target: string) {
  spawnSync(
    "cargo",
    ["ndk", "--target", target, "--platform", "31", "build", "--release", "--features=ffi"],
    {
      stdio: "inherit",
    }
  );
}

function main() {
  console.log("Building rust library for android");

  process.chdir("libsignal-dezire");

  Object.keys(TARGET_TO_DESTINATION).forEach(build);

  process.chdir("..");

  Object.entries(TARGET_TO_DESTINATION).forEach(([target, architecture]) => {
    const sourcePath = path.join(
      process.cwd(),
      "libsignal-dezire",
      "target",
      target,
      "release",
      "liblibsignal_dezire.so"
    );
    const architecturePath = path.join(
      process.cwd(),
      "modules",
      "libsignal-dezire",
      "android",
      "src",
      "main",
      "jniLibs",
      architecture
    );
    if (!fs.existsSync(architecturePath)) {
      fs.mkdirSync(architecturePath, { recursive: true });
    }
    fs.copyFileSync(
      sourcePath,
      path.join(architecturePath, "liblibsignal_dezire.so")
    );
  });
}

main();