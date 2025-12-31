#!/bin/bash
# Marie Backend Start Script

# Dynamically find NVIDIA library paths from site-packages
PYTHON_SITE_PACKAGES=$(python3 -c "import site; print(site.getsitepackages()[0])")
NVIDIA_LIBS_PATH="${PYTHON_SITE_PACKAGES}/nvidia"

if [ -d "$NVIDIA_LIBS_PATH" ]; then
    echo "✅ Found NVIDIA libraries at $NVIDIA_LIBS_PATH"
    
    # Add CUDNN and CUBLAS to LD_LIBRARY_PATH
    CUDNN_LIB="${NVIDIA_LIBS_PATH}/cudnn/lib"
    CUBLAS_LIB="${NVIDIA_LIBS_PATH}/cublas/lib"
    
    if [ -d "$CUDNN_LIB" ]; then
        export LD_LIBRARY_PATH="${CUDNN_LIB}:${LD_LIBRARY_PATH}"
        echo "   Added $CUDNN_LIB to LD_LIBRARY_PATH"
    fi
    
    if [ -d "$CUBLAS_LIB" ]; then
        export LD_LIBRARY_PATH="${CUBLAS_LIB}:${LD_LIBRARY_PATH}"
        echo "   Added $CUBLAS_LIB to LD_LIBRARY_PATH"
    fi
fi

# Start the application
exec python run.py
