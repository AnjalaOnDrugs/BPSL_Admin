try {
    console.log("1. Loading modules...");
    const { getDefaultConfig } = require("expo/metro-config");
    const { withNativeWind } = require("nativewind/metro");
    console.log("   Modules loaded.");

    console.log("2. Getting default config...");
    const config = getDefaultConfig(__dirname);
    console.log("   Default config loaded.");

    console.log("3. Applying NativeWind...");
    const finalConfig = withNativeWind(config, { input: "./global.css" });
    console.log("   NativeWind applied successfully.");

} catch (error) {
    console.error("\n!!! ERROR DETECTED !!!");
    console.error(error);
}
