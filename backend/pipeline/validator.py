from schemas.models import AppConfig
from pydantic import ValidationError
from typing import Tuple, List

def validate_config(config: dict) -> Tuple[bool, List[str]]:
    errors = []
    
    # 1. Pydantic structural validation
    try:
        app = AppConfig(**config)
    except ValidationError as e:
        for err in e.errors():
            errors.append(f"Structure error at {'.'.join(str(x) for x in err['loc'])}: {err['msg']}")
        return False, errors
    
    # 2. Cross-layer consistency checks
    db_table_names = {t["name"].lower() for t in config.get("db", [])}
    db_all_fields = set()
    for table in config.get("db", []):
        for field in table.get("fields", []):
            field_name = field.split(":")[0].strip().lower()
            db_all_fields.add(f"{table['name'].lower()}.{field_name}")
    
    auth_roles = {a["role"].lower() for a in config.get("auth", [])}
    
    # Check every UI page has allowed_roles defined in auth
    for page in config.get("ui", []):
        for role in page.get("allowed_roles", []):
            if role.lower() not in auth_roles and role.lower() != "public":
                errors.append(f"UI page '{page['name']}' references undefined role '{role}'")
    
    # Check API endpoints reference defined roles
    for endpoint in config.get("api", []):
        for role in endpoint.get("roles", []):
            if role.lower() not in auth_roles and role.lower() != "public":
                errors.append(f"API endpoint '{endpoint['path']}' references undefined role '{role}'")
    
    # Check we have at least minimum required content
    if len(config.get("ui", [])) < 2:
        errors.append("Too few UI pages generated (minimum 2 required)")
    if len(config.get("api", [])) < 3:
        errors.append("Too few API endpoints generated (minimum 3 required)")
    if len(config.get("db", [])) < 2:
        errors.append("Too few DB tables generated (minimum 2 required)")
    
    if errors:
        return False, errors
    return True, []