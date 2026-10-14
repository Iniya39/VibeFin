import math
from typing import Any

def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize dictionaries, lists, and numbers for strict JSON compliance.
    Replaces NaN, +Inf, -Inf with None.
    """
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, tuple):
        return tuple(sanitize_for_json(v) for v in obj)
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj
