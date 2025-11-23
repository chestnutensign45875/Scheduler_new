#!/bin/bash

# Name of the source file
SOURCE="scheduler_core.c"

# Detect the Operating System
OS="$(uname -s)"

echo "------------------------------------------------"
echo "Detected OS: $OS"

case "$OS" in
    Linux*)
        OUTPUT="scheduler_core.so"
        echo "Compiling for Linux..."
        # -fPIC: Position Independent Code (required for shared libs)
        # -shared: Create a shared library
        gcc -shared -o "$OUTPUT" -fPIC "$SOURCE"
        ;;

    Darwin*)
        OUTPUT="scheduler_core.so" # Python ctypes on Mac often happily loads .so, but .dylib is standard
        echo "Compiling for macOS..."
        # macOS often needs specific flags to link properly
        gcc -shared -o "$OUTPUT" -fPIC "$SOURCE"
        ;;

    CYGWIN*|MINGW*|MSYS*)
        OUTPUT="scheduler_core.dll"
        echo "Compiling for Windows (MinGW/Git Bash)..."
        # Windows requires -shared
        gcc -shared -o "$OUTPUT" "$SOURCE"
        ;;

    *)
        echo "Unknown Operating System: $OS"
        echo "Trying default Linux compilation..."
        OUTPUT="scheduler_core.so"
        gcc -shared -o "$OUTPUT" -fPIC "$SOURCE"
        ;;
esac

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Success! Created $OUTPUT"
else
    echo "❌ Compilation failed."
    exit 1
fi

echo "------------------------------------------------"
