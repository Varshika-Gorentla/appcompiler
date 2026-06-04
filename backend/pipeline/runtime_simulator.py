def simulate_runtime(config: dict) -> dict:
    results = {
        "routes_validated": [],
        "routes_failed": [],
        "db_relations_valid": [],
        "db_relations_failed": [],
        "auth_flows_valid": [],
        "auth_flows_failed": [],
        "overall_pass": True
    }
    
    db_tables = {t["name"].lower() for t in config.get("db", [])}
    auth_roles = {a["role"].lower() for a in config.get("auth", [])}
    
    # Simulate route validation
    valid_methods = {"GET", "POST", "PUT", "DELETE", "PATCH"}
    for endpoint in config.get("api", []):
        path = endpoint.get("path", "")
        method = endpoint.get("method", "").upper()
        
        route_id = f"{method} {path}"
        
        if not path.startswith("/"):
            results["routes_failed"].append(f"{route_id} — path must start with /")
            results["overall_pass"] = False
        elif method not in valid_methods:
            results["routes_failed"].append(f"{route_id} — invalid HTTP method")
            results["overall_pass"] = False
        else:
            results["routes_validated"].append(route_id)
    
    # Simulate DB relation validation
    for table in config.get("db", []):
        for relation in table.get("relations", []):
            parts = relation.split(":")
            if len(parts) == 2:
                related_table = parts[1].strip().lower()
                if related_table in db_tables:
                    results["db_relations_valid"].append(
                        f"{table['name']} → {parts[1].strip()}"
                    )
                else:
                    results["db_relations_failed"].append(
                        f"{table['name']} references unknown table '{parts[1].strip()}'"
                    )
                    results["overall_pass"] = False
    
    # Simulate auth flow validation
    for page in config.get("ui", []):
        for role in page.get("allowed_roles", []):
            if role.lower() in auth_roles or role.lower() == "public":
                results["auth_flows_valid"].append(
                    f"Page '{page['name']}' accessible by '{role}'"
                )
            else:
                results["auth_flows_failed"].append(
                    f"Page '{page['name']}' uses undefined role '{role}'"
                )
                results["overall_pass"] = False
    
    return results