#!/usr/bin/env python3
"""Script to initialize OpenSearch indices."""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import Config
from app.services.opensearch_service import OpenSearchService
from app.services.opensearch_init import init_opensearch_indices


def main():
    """Initialize OpenSearch indices."""
    config = Config()
    
    # Create OpenSearch service
    opensearch_service = OpenSearchService(
        hosts=config.OPENSEARCH_HOSTS,
        auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
        use_ssl=config.OPENSEARCH_USE_SSL,
        verify_certs=config.OPENSEARCH_VERIFY_CERTS
    )
    
    # Initialize indices
    print("Initializing OpenSearch indices...")
    results = init_opensearch_indices(opensearch_service, recreate=False)
    
    # Print results
    print("\n" + "="*50)
    print("Initialization Results:")
    print("="*50)
    for index_name, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"{index_name}: {status}")
    
    # Check if all succeeded
    if all(results.values()):
        print("\n✓ All indices initialized successfully!")
        return 0
    else:
        print("\n✗ Some indices failed to initialize")
        return 1


if __name__ == "__main__":
    sys.exit(main())
