import math
from typing import Any

def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize dictionaries, lists, and numbers for strict JSON compliance.
    Replaces NaN, +Inf, -Inf, numpy floats, and non-compliant types with None.
    """
    if obj is None:
        return None
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, int):
        return obj

    # Handle pandas Series / DataFrames or numpy ndarrays
    if hasattr(obj, "isna") and callable(obj.isna):
        try:
            if obj.isna():
                return None
        except Exception:
            pass
    if hasattr(obj, "to_dict") and callable(obj.to_dict):
        try:
            return sanitize_for_json(obj.to_dict())
        except Exception:
            pass
    if hasattr(obj, "tolist") and callable(obj.tolist):
        try:
            return sanitize_for_json(obj.tolist())
        except Exception:
            pass

    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj

    # Check for numpy float scalars or anything float-convertible
    try:
        f = float(obj)
        if math.isnan(f) or math.isinf(f):
            return None
        if hasattr(obj, "item"):
            val = obj.item()
            if isinstance(val, (int, bool)):
                return val
            if isinstance(val, float):
                return None if (math.isnan(val) or math.isinf(val)) else val
    except (ValueError, TypeError):
        pass

    return obj

from fastapi.responses import JSONResponse

class SafeJSONResponse(JSONResponse):
    """Custom JSONResponse that automatically sanitizes all content for strict JSON compliance."""
    def render(self, content: Any) -> bytes:
        return super().render(sanitize_for_json(content))
